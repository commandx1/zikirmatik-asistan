// Sunucu senkronu için paylaşılan (network I/O yapan) yardımcılar. Hem
// hooks/use-vird-backend-sync.ts (normal oturum senkronu) hem de
// ../../auth/services/guest-migration.ts (misafir->üye göçü) aynı
// "yerel-origin bir programı sunucuya it, clientId çakışırsa mevcut kaydı
// çek, istenirse aktive et" akışına ihtiyaç duyduğundan burada TEK bir
// kopya olarak tutulur — iki çağıran da kendi retry/hata politikasını
// üstte uygular, bu dosya kendi başına retry YAPMAZ (bir hata her zaman
// olduğu gibi fırlatılır).
import type { CreateVirdProgramRequest, VirdProgram, VirdTodayResponse } from "@zikirmatik/shared";
import { activateVirdProgram, createVirdProgram, fetchVirdPrograms, VirdApiError } from "./vird-api-client";
import type { VirdProgramLocal } from "../types";
import type { VirdServerTodaySnapshot } from "../../../store/vird-store";

/** VirdProgramLocal'ın yalnızca sunucunun CreateVirdProgramRequest'inin
 * kabul ettiği alt kümesi (clientId dahil, idempotency anahtarı). */
export function buildCreateVirdProgramRequest(program: VirdProgramLocal): CreateVirdProgramRequest {
  return {
    clientId: program.clientId,
    title: program.title,
    kind: program.kind,
    source: program.source,
    templateKey: program.templateKey,
    phases: program.phases,
    startDate: program.startDate,
    prayerSelection: program.prayerSelection,
    reminders: program.reminders
  };
}

function isConflict(error: unknown): boolean {
  return error instanceof VirdApiError && error.status === 409;
}

/**
 * `origin:'local'` bir programı sunucuya iter: POST ile oluşturmayı dener
 * (clientId ile idempotent — bkz. vird-program.schema.ts {userId,clientId}
 * unique/sparse index); sunucu 409 (zaten var, önceki bir denemeden kalma)
 * dönerse programlar listesini çekip aynı clientId'li kaydı bulur.
 * `options.activate` true ise ve program henüz 'active' değilse
 * activateVirdProgram çağrılır.
 *
 * Diğer her hata (transient ağ hatası, 409 dışı terminal hata, ya da 409
 * sonrası "mevcut kayıt bulunamadı" durumu) olduğu gibi fırlatılır —
 * çağıran kendi retry politikasını uygular (bkz. dosya başı notu).
 */
export async function pushLocalVirdProgram(
  program: VirdProgramLocal,
  options: { activate?: boolean } = {}
): Promise<VirdProgram> {
  let serverProgram: VirdProgram;

  try {
    serverProgram = await createVirdProgram(buildCreateVirdProgramRequest(program));
  } catch (error) {
    if (!isConflict(error)) {
      throw error;
    }

    const existing = (await fetchVirdPrograms()).find(
      (candidate) => candidate.clientId === program.clientId
    );
    if (!existing) {
      throw error;
    }
    serverProgram = existing;
  }

  if (options.activate && serverProgram.status !== "active") {
    serverProgram = await activateVirdProgram(serverProgram.id);
  }

  return serverProgram;
}

/**
 * GET /v1/vird/today yanıtındaki slots[*].items'ı store'un replaceFromServer
 * beklediği düz `itemKey -> {count,target}` eşlemesine indirger. Program
 * yoksa (o gün için aktif program yok) undefined döner — replaceFromServer
 * bu durumda dayProgress'e dokunmaz.
 */
export function buildVirdTodaySnapshot(today: VirdTodayResponse, dateKey: string): VirdServerTodaySnapshot | undefined {
  if (!today.program) {
    return undefined;
  }

  const progress: Record<string, { count: number; target: number }> = {};
  for (const slotView of Object.values(today.slots)) {
    if (!slotView) {
      continue;
    }
    for (const item of slotView.items) {
      progress[item.itemKey] = { count: item.count, target: item.target };
    }
  }

  return { dateKey, progress };
}

/**
 * Sunucu VirdProgram'ını yerel VirdProgramLocal'a çevirir. `clientId` ve
 * `dhikrs` (denormalize snapshot) yalnızca yerelde var olan alanlardır:
 * `clientId` sunucudan echo edilmişse o kullanılır, yoksa `previousLocal`'dan
 * (aynı cihazda daha önce yaratılmış program) korunur, o da yoksa (bu
 * cihazda hiç yerel karşılığı olmayan, örn. başka bir cihazda oluşturulmuş
 * bir program) son çare olarak sunucu id'si clientId olarak kullanılır.
 * `dhikrs` her zaman `previousLocal`'dan korunur — sunucu bu alanı hiç
 * bilmez; yerel karşılığı yoksa boş kalır (ad/anlam gösterimi bir sonraki
 * worker'ın içerik-çözümleme işi — bkz. features/vird/README.md).
 */
export function toLocalVirdProgram(server: VirdProgram, previousLocal?: VirdProgramLocal): VirdProgramLocal {
  return {
    ...server,
    clientId: server.clientId ?? previousLocal?.clientId ?? server.id,
    origin: "server",
    dhikrs: previousLocal?.dhikrs ?? {}
  };
}
