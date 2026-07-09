import { toDateKey } from "@zikirmatik/shared";
import { useDhikrStore } from "../../../store/dhikr-store";
import type {
  GuestMigrationSnapshot,
  GuestSnapshotItem
} from "../../../store/guest-migration-store";
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import { listVerifiedActiveDhikrs } from "../../dhikrs/services/dhikrs-api-client";
import type { BackendDhikrLog, CreateDhikrLogPayload } from "../../dhikrs/services/dhikr-logs-api-client";
import { createDhikrLog, listDhikrLogsByUser, setDhikrFavoriteByKey } from "../../dhikrs/services/dhikr-logs-api-client";
import type { BackendUserDhikr, CreateUserDhikrPayload } from "../../dhikrs/services/user-dhikrs-api-client";
import { createUserDhikr, listUserDhikrs } from "../../dhikrs/services/user-dhikrs-api-client";

export type GuestMigrationBackendState = {
  verifiedDhikrs: BackendDhikr[];
  userDhikrs: BackendUserDhikr[];
  logs: BackendDhikrLog[];
};

export type GuestMigrationPlan = {
  createUserDhikrs: CreateUserDhikrPayload[];
  createLogs: CreateDhikrLogPayload[];
  favoriteUpdates: Array<{ dhikrId?: string; customDhikrId?: string; isFavorite: boolean }>;
  skippedItemIds: string[];
};

/**
 * Captures the guest-local dhikr state as a migration snapshot.
 *
 * Must be called BEFORE resetSessionScopedStores() wipes the local store.
 * Returns null when the guest produced nothing worth migrating.
 * Note: free-mode (serbest) counts are intentionally not migrated — they have
 * no dhikr identity, so there is no backend log key to attach them to.
 */
export function captureGuestMigrationSnapshot(): GuestMigrationSnapshot | null {
  const { items } = useDhikrStore.getState();
  const relevant = items.filter(
    (item) => item.source === "personal" || item.current > 0 || item.isFavorite
  );

  if (relevant.length === 0) {
    return null;
  }

  const now = new Date();
  return {
    id: `guest-migration-${now.getTime()}`,
    capturedAt: now.toISOString(),
    dateKey: toDateKey(now),
    items: relevant.map((item) => ({
      id: item.id,
      source: item.source,
      nameTurkish: item.nameTurkish,
      transliteration: item.transliteration,
      arabic: item.arabic,
      meaning: item.meaning,
      current: item.current,
      target: item.target,
      isFavorite: item.isFavorite
    }))
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
    skippedItemIds: []
  };

  const verifiedByName = new Map<string, BackendDhikr>();
  for (const dhikr of backend.verifiedDhikrs) {
    verifiedByName.set(normalizeName(dhikr.nameTurkish), dhikr);
    verifiedByName.set(normalizeName(dhikr.transliteration), dhikr);
  }
  const userDhikrClientIds = new Set(backend.userDhikrs.map((d) => d.clientId));

  for (const item of snapshot.items) {
    const key = resolveLogKey(item, verifiedByName);

    if (item.source === "personal" && !userDhikrClientIds.has(item.id)) {
      plan.createUserDhikrs.push({
        clientId: item.id,
        name: item.nameTurkish,
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
 * Executes a migration plan against the backend. Steps are sequential and
 * individually idempotent; on any transient failure it throws so the caller
 * can retry the whole run (already-applied steps re-plan as no-ops).
 */
export async function runGuestMigration(
  snapshot: GuestMigrationSnapshot,
  session: { userId: string; accessToken?: string }
): Promise<GuestMigrationPlan> {
  const [verifiedDhikrs, userDhikrs, logs] = await Promise.all([
    listVerifiedActiveDhikrs(),
    listUserDhikrs(session.accessToken),
    listDhikrLogsByUser(session.userId, undefined, undefined, session.accessToken)
  ]);

  const plan = planGuestMigration(snapshot, { verifiedDhikrs, userDhikrs, logs });

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

  return plan;
}

function resolveLogKey(
  item: GuestSnapshotItem,
  verifiedByName: Map<string, BackendDhikr>
): { dhikrId?: string; customDhikrId?: string; customDhikrName?: string; customDhikrArabic?: string } {
  if (item.source === "personal") {
    return {
      customDhikrId: item.id,
      customDhikrName: item.nameTurkish,
      customDhikrArabic: item.arabic
    };
  }

  if (isObjectIdLike(item.id)) {
    return { dhikrId: item.id };
  }

  const matched =
    verifiedByName.get(normalizeName(item.nameTurkish)) ??
    verifiedByName.get(normalizeName(item.transliteration));
  if (matched) {
    return { dhikrId: matched._id };
  }

  // Unmatched ready item (e.g. seed content removed from the catalog): keep the
  // progress as a custom-keyed log, mirroring the home-context fallback.
  return {
    customDhikrId: item.id,
    customDhikrName: item.nameTurkish,
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
