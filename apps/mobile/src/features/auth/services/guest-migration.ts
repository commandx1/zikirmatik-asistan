import { toDateKey, type VirdProgram } from "@zikirmatik/shared";
import { resolveLocalizedText, useDhikrStore } from "../../../store/dhikr-store";
import { useProfileStore } from "../../../store/profile-store";
import { pruneDayProgress, useVirdStore } from "../../../store/vird-store";
import type {
  GuestMigrationSnapshot,
  GuestSnapshotItem,
  GuestVirdSnapshot
} from "../../../store/guest-migration-store";
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import { listVerifiedActiveDhikrs } from "../../dhikrs/services/dhikrs-api-client";
import type { BackendDhikrLog, CreateDhikrLogPayload } from "../../dhikrs/services/dhikr-logs-api-client";
import { createDhikrLog, listDhikrLogsByUser, setDhikrFavoriteByKey } from "../../dhikrs/services/dhikr-logs-api-client";
import type { BackendUserDhikr, CreateUserDhikrPayload } from "../../dhikrs/services/user-dhikrs-api-client";
import { createUserDhikr, listUserDhikrs } from "../../dhikrs/services/user-dhikrs-api-client";
import { fetchVirdPrograms } from "../../vird/services/vird-api-client";
import { dayIndexFor, expectedItemsForDay, type ExpectedVirdItem } from "../../vird/services/vird-day";
import { pushLocalVirdProgram } from "../../vird/services/vird-sync";
import type { VirdProgramLocal } from "../../vird/types";

// Misafirin son 30 güne ait vird ilerlemesi göç payload'ını gereksiz
// büyütmesin diye bu pencereyle sınırlanır (bkz. GuestVirdSnapshot notu).
const VIRD_MIGRATION_DAY_PROGRESS_WINDOW = 30;

export type GuestMigrationBackendState = {
  verifiedDhikrs: BackendDhikr[];
  userDhikrs: BackendUserDhikr[];
  logs: BackendDhikrLog[];
  /** GET /v1/vird/programs — clientId çakışmalarını tespit edip aynı
   * programı yeniden oluşturmaktan kaçınmak için (bkz. planVirdMigration). */
  existingVirdPrograms: VirdProgram[];
};

export type CreateVirdProgramPlanItem = {
  program: VirdProgramLocal;
  /** snapshot.vird.activeProgramId bu programsa true — yürütücü
   * pushLocalVirdProgram'a activate:true geçer. */
  shouldActivate: boolean;
};

export type CreateVirdProgressLogPlanItem = {
  /**
   * Sunucudaki gerçek _id, createVirdPrograms adımı çalışana kadar BİLİNMEZ
   * (planlama saf/network'süzdür) — yürütücü (runGuestMigration) bunu
   * clientId -> serverId eşlemesiyle çözüp payload.virdProgramId'ye yazar.
   */
  clientProgramId: string;
  payload: Omit<CreateDhikrLogPayload, "userId" | "virdProgramId">;
};

export type GuestMigrationPlan = {
  createUserDhikrs: CreateUserDhikrPayload[];
  createLogs: CreateDhikrLogPayload[];
  favoriteUpdates: Array<{ dhikrId?: string; customDhikrId?: string; isFavorite: boolean }>;
  skippedItemIds: string[];
  createVirdPrograms: CreateVirdProgramPlanItem[];
  createVirdProgressLogs: CreateVirdProgressLogPlanItem[];
};

/**
 * Captures the guest-local dhikr state as a migration snapshot.
 *
 * Must be called BEFORE resetSessionScopedStores() wipes the local store.
 * Returns null when the guest produced nothing worth migrating.
 * Note: free-mode (serbest) counts are intentionally not migrated — they have
 * no dhikr identity, so there is no backend log key to attach them to.
 *
 * Vird: bir misafir authenticate OLAMAYACAĞINDAN tüm programları her zaman
 * `origin:'local'`dır (bkz. GuestVirdSnapshot) — yine de defensive olarak
 * filtrelenir. dayProgress yalnızca son 30 günle sınırlanır (bkz.
 * VIRD_MIGRATION_DAY_PROGRESS_WINDOW).
 */
export function captureGuestMigrationSnapshot(): GuestMigrationSnapshot | null {
  const { items } = useDhikrStore.getState();
  const relevant = items.filter(
    (item) => item.source === "personal" || item.current > 0 || item.isFavorite
  );

  const virdState = useVirdStore.getState();
  const localVirdPrograms = virdState.programs.filter((program) => program.origin === "local");
  const hasVirdData = localVirdPrograms.length > 0;

  if (relevant.length === 0 && !hasVirdData) {
    return null;
  }

  const now = new Date();
  const locale = useProfileStore.getState().locale;
  const vird: GuestVirdSnapshot | undefined = hasVirdData
    ? {
        programs: localVirdPrograms,
        activeProgramId: virdState.activeProgramId,
        dayProgress: pruneDayProgress(virdState.dayProgress, toDateKey(now), VIRD_MIGRATION_DAY_PROGRESS_WINDOW)
      }
    : undefined;

  return {
    id: `guest-migration-${now.getTime()}`,
    capturedAt: now.toISOString(),
    dateKey: toDateKey(now),
    items: relevant.map((item) => ({
      id: item.id,
      source: item.source,
      name: resolveLocalizedText(item.name, locale),
      transliteration: resolveLocalizedText(item.transliteration, locale),
      arabic: item.arabic,
      meaning: item.meaning ? resolveLocalizedText(item.meaning, locale) : undefined,
      current: item.current,
      target: item.target,
      isFavorite: item.isFavorite
    })),
    ...(vird ? { vird } : {})
  };
}

/**
 * Pure merge planner. Guest data never overwrites richer backend data:
 * - personal dhikrs: union by clientId (create only the missing ones);
 * - progress: per dhikr key and snapshot day, max(count) wins — a log is only
 *   created when the local count beats every backend log of that day, which
 *   also makes re-runs after a mid-flight crash idempotent;
 * - favorites: only ever turned ON (guest favorite adds, never removes).
 */
export function planGuestMigration(
  snapshot: GuestMigrationSnapshot,
  backend: GuestMigrationBackendState
): GuestMigrationPlan {
  const plan: GuestMigrationPlan = {
    createUserDhikrs: [],
    createLogs: [],
    favoriteUpdates: [],
    skippedItemIds: [],
    ...planVirdMigration(snapshot.vird, backend.existingVirdPrograms)
  };

  const locale = useProfileStore.getState().locale;
  const verifiedByName = new Map<string, BackendDhikr>();
  for (const dhikr of backend.verifiedDhikrs) {
    verifiedByName.set(normalizeName(resolveLocalizedText(dhikr.name, locale)), dhikr);
    verifiedByName.set(normalizeName(resolveLocalizedText(dhikr.transliteration, locale)), dhikr);
  }
  const userDhikrClientIds = new Set(backend.userDhikrs.map((d) => d.clientId));

  for (const item of snapshot.items) {
    const key = resolveLogKey(item, verifiedByName);

    if (item.source === "personal" && !userDhikrClientIds.has(item.id)) {
      plan.createUserDhikrs.push({
        clientId: item.id,
        name: item.name,
        transliteration: item.transliteration || undefined,
        arabic: item.arabic,
        meaning: item.meaning,
        target: item.target > 0 ? item.target : undefined,
        isFavorite: item.isFavorite
      });
    }

    const sameDayLogs = backend.logs.filter(
      (log) => matchesKey(log, key) && log.date.slice(0, 10) === snapshot.dateKey
    );
    const backendSameDayMax = sameDayLogs.reduce((max, log) => Math.max(max, log.count), 0);

    if (item.current > 0 && item.current > backendSameDayMax) {
      const targetCount = item.target > 0 ? item.target : item.current;
      plan.createLogs.push({
        userId: "", // filled in by the executor with the session user id
        ...key,
        count: item.current,
        targetCount,
        date: snapshot.dateKey,
        source: "manual",
        isCompleted: item.current >= targetCount,
        isFavorite: item.isFavorite || undefined
      });
      continue;
    }

    plan.skippedItemIds.push(item.id);

    // No new log was created; if the guest favorited a dhikr that already has
    // backend logs, flip the favorite flag on the existing logs.
    if (item.isFavorite) {
      const anyLogForKey = backend.logs.some((log) => matchesKey(log, key));
      const alreadyFavorite = backend.logs.some((log) => matchesKey(log, key) && log.isFavorite);
      if (anyLogForKey && !alreadyFavorite) {
        plan.favoriteUpdates.push({ ...key, isFavorite: true });
      }
    }
  }

  return plan;
}

/**
 * Vird programlarını ve son 30 günlük ilerlemesini saf olarak planlar (ağ
 * çağrısı YAPMAZ — bkz. dosya başı planGuestMigration notu). `vird`
 * yoksa (misafirin hiç yerel vird verisi yoksa) boş bir plan döner.
 *
 * - Programlar: `existingVirdPrograms`da (aynı clientId) zaten var olanlar
 *   ATLANIR — bu, aynı snapshot'ın ikinci kez çalıştırılmasını (ör. bir
 *   önceki deneme kısmen başarılı olduysa) idempotent yapar.
 * - İlerleme: her (dateKey, itemKey) girdisi, o tarihte o itemKey'i
 *   BEKLENEN item listesinde taşıyan programı bulur (bkz.
 *   findOwningProgramItem — snapshot.vird.activeProgramId önceliklidir,
 *   çünkü ilerleme kaydı yalnızca aktif programken yapılabilir; ondan
 *   sonraki programlar yalnızca "aktif program artık yok/değişti" edge
 *   case'i için bir geri dönüştür). Hiçbir program o itemKey'i talep
 *   etmiyorsa (silinmiş/değişmiş bir program) girdi sessizce atlanır.
 */
export function planVirdMigration(
  vird: GuestVirdSnapshot | undefined,
  existingVirdPrograms: VirdProgram[]
): Pick<GuestMigrationPlan, "createVirdPrograms" | "createVirdProgressLogs"> {
  if (!vird || vird.programs.length === 0) {
    return { createVirdPrograms: [], createVirdProgressLogs: [] };
  }

  const existingClientIds = new Set(
    existingVirdPrograms.map((program) => program.clientId).filter((clientId): clientId is string => Boolean(clientId))
  );

  const createVirdPrograms: CreateVirdProgramPlanItem[] = vird.programs
    .filter((program) => !existingClientIds.has(program.clientId))
    .map((program) => ({
      program,
      shouldActivate: vird.activeProgramId === program.id
    }));

  const locale = useProfileStore.getState().locale;
  const createVirdProgressLogs: CreateVirdProgressLogPlanItem[] = [];

  for (const [dateKey, dayEntries] of Object.entries(vird.dayProgress)) {
    for (const [itemKey, entry] of Object.entries(dayEntries)) {
      if (entry.count <= 0) {
        continue;
      }

      const match = findOwningProgramItem(vird.programs, vird.activeProgramId, dateKey, itemKey);
      if (!match) {
        continue;
      }

      const { program, dayIndex, item } = match;
      const dhikrSnapshot = program.dhikrs[item.ref];
      const isCustom = dhikrSnapshot?.isCustom ?? !isObjectIdLike(item.ref);
      const dhikrKey = isCustom
        ? {
            customDhikrId: item.ref,
            customDhikrName: dhikrSnapshot ? resolveLocalizedText(dhikrSnapshot.name, locale) : undefined
          }
        : { dhikrId: item.ref };

      createVirdProgressLogs.push({
        clientProgramId: program.clientId,
        payload: {
          ...dhikrKey,
          count: entry.count,
          targetCount: entry.target,
          date: dateKey,
          source: "manual",
          isCompleted: entry.count >= entry.target,
          virdSlot: item.slot,
          virdDayIndex: dayIndex,
          ...(item.prayerIndex != null ? { virdPrayerIndex: item.prayerIndex } : {})
        }
      });
    }
  }

  return { createVirdPrograms, createVirdProgressLogs };
}

/**
 * `itemKey`'i o `dateKey` için BEKLENEN item listesinde taşıyan ilk programı
 * bulur (bkz. planVirdMigration notu — activeProgramId önce denenir).
 */
function findOwningProgramItem(
  programs: VirdProgramLocal[],
  preferredProgramId: string | null,
  dateKey: string,
  itemKey: string
): { program: VirdProgramLocal; dayIndex: number; item: ExpectedVirdItem } | undefined {
  const ordered = preferredProgramId
    ? [...programs].sort((a, b) => Number(b.id === preferredProgramId) - Number(a.id === preferredProgramId))
    : programs;

  for (const program of ordered) {
    const dayIndex = dayIndexFor(program, dateKey);
    const item = expectedItemsForDay(program, dayIndex).find((candidate) => candidate.itemKey === itemKey);
    if (item) {
      return { program, dayIndex, item };
    }
  }

  return undefined;
}

/**
 * Executes a migration plan against the backend. Steps are sequential and
 * individually idempotent; on any transient failure it throws so the caller
 * can retry the whole run (already-applied steps re-plan as no-ops).
 */
export async function runGuestMigration(
  snapshot: GuestMigrationSnapshot,
  session: { userId: string; accessToken?: string }
): Promise<GuestMigrationPlan> {
  const [verifiedDhikrs, userDhikrs, logs, existingVirdPrograms] = await Promise.all([
    listVerifiedActiveDhikrs(),
    listUserDhikrs(session.accessToken),
    listDhikrLogsByUser(session.userId, undefined, undefined, session.accessToken),
    // Vird programları JwtAuthGuard (zorunlu token) arkasındadır; token
    // yoksa (olağandışı) boş listeyle devam et — bu, aşağıdaki vird
    // adımlarının 409-fallback'i üzerinden zaten idempotent olduğundan
    // yalnızca gereksiz bir yeniden-oluşturma denemesine yol açar, veri
    // kaybına değil. Bir servis kesintisi de aynı şekilde (dhikr
    // migrasyonunu bloklamadan) boş listeye düşer.
    session.accessToken
      ? fetchVirdPrograms(session.accessToken).catch(() => [] as VirdProgram[])
      : Promise.resolve([] as VirdProgram[])
  ]);

  const plan = planGuestMigration(snapshot, { verifiedDhikrs, userDhikrs, logs, existingVirdPrograms });

  for (const payload of plan.createUserDhikrs) {
    try {
      await createUserDhikr(payload, session.accessToken);
    } catch (error) {
      if (isTerminalConflict(error)) {
        continue; // already exists — union semantics
      }
      throw error;
    }
  }

  for (const payload of plan.createLogs) {
    await createDhikrLog({ ...payload, userId: session.userId }, session.accessToken);
  }

  for (const update of plan.favoriteUpdates) {
    await setDhikrFavoriteByKey(update, session.accessToken);
  }

  // Vird programları + son 30 günlük ilerlemesi. Vird uçları accessToken
  // ZORUNLU (JwtAuthGuard) olduğundan token yoksa bu adım tamamen atlanır.
  if (session.accessToken) {
    const accessToken = session.accessToken;
    // clientId -> sunucu _id eşlemesi. ÖNCE zaten var olan (bu göçten önce
    // sunucuya senkronize edilmiş — bkz. existingVirdPrograms) programlarla
    // tohumlanır: aksi halde createVirdPrograms'ta ATLANAN (zaten var
    // olduğu için yeniden oluşturulmayan) bir programın ilerleme logları
    // burada hiç eşleşmez ve sessizce düşer.
    const clientIdToServerId = new Map<string, string>();
    for (const existing of existingVirdPrograms) {
      if (existing.clientId) {
        clientIdToServerId.set(existing.clientId, existing.id);
      }
    }

    for (const item of plan.createVirdPrograms) {
      const serverProgram = await pushLocalVirdProgram(item.program, accessToken, { activate: item.shouldActivate });
      clientIdToServerId.set(item.program.clientId, serverProgram.id);
    }

    for (const item of plan.createVirdProgressLogs) {
      const virdProgramId = clientIdToServerId.get(item.clientProgramId);
      if (!virdProgramId) {
        // Beklenmeyen durum (programı hiçbir yerde bulunamadı) — veri
        // kaybı yerine bu tek girdiyi atla, geri kalan göçü bloklama.
        continue;
      }
      await createDhikrLog({ ...item.payload, userId: session.userId, virdProgramId }, accessToken);
    }
  }

  return plan;
}

function resolveLogKey(
  item: GuestSnapshotItem,
  verifiedByName: Map<string, BackendDhikr>
): { dhikrId?: string; customDhikrId?: string; customDhikrName?: string; customDhikrArabic?: string } {
  if (item.source === "personal") {
    return {
      customDhikrId: item.id,
      customDhikrName: item.name,
      customDhikrArabic: item.arabic
    };
  }

  if (isObjectIdLike(item.id)) {
    return { dhikrId: item.id };
  }

  const matched =
    verifiedByName.get(normalizeName(item.name)) ??
    verifiedByName.get(normalizeName(item.transliteration));
  if (matched) {
    return { dhikrId: matched._id };
  }

  // Unmatched ready item (e.g. seed content removed from the catalog): keep the
  // progress as a custom-keyed log, mirroring the home-context fallback.
  return {
    customDhikrId: item.id,
    customDhikrName: item.name,
    customDhikrArabic: item.arabic
  };
}

function matchesKey(
  log: BackendDhikrLog,
  key: { dhikrId?: string; customDhikrId?: string }
): boolean {
  if (key.dhikrId) {
    return log.dhikrId === key.dhikrId;
  }
  return Boolean(key.customDhikrId) && log.customDhikrId === key.customDhikrId;
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function isObjectIdLike(value: string): boolean {
  return /^[0-9a-f]{24}$/i.test(value);
}

function isTerminalConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 409
  );
}
