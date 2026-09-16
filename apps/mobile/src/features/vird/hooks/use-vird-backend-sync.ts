// Vird programlarını ve bugünkü ilerlemeyi sunucuyla senkronize eder.
// app/_layout.tsx'e (useDhikrBackendSync'in yanına) mount edilir. Desen
// features/dhikrs/hooks/use-dhikr-backend-sync.ts ile aynı: auth zorunlu,
// useGuestMigrationStore ile aynı gate (misafir->üye göçü tamamlanmadan
// senkron BAŞLAMAZ — aksi halde henüz göç edilmemiş yerel programlar
// sunucudan boş bir listeyle ezilebilir). Ayrıca (dhikr-backend-sync'te
// olmayan) bir AppState 'active' dinleyicisi taşır — bkz.
// features/vird/hooks/use-vird-reminder-sync.ts ile aynı desen — uygulama
// arka plandan öne her geldiğinde de yeniden senkronlar.
//
// Misafirde (authStatus !== 'authenticated') HİÇBİR istek yapılmaz. Hata
// durumunda yerel state OLDUĞU GİBİ KORUNUR (replaceFromServer/upsertProgram
// çağrılmaz) — sync error store'un syncError alanına yazılır (bkz.
// vird-store.ts — hook'un kendisi app/_layout.tsx'te değer yakalanmadan
// mount edildiğinden, hata durumu buradan okunmalıdır).
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { toDateKey } from "@zikirmatik/shared";
import { useAuthStore } from "../../../store/auth-store";
import { useGuestMigrationStore } from "../../../store/guest-migration-store";
import { useVirdStore } from "../../../store/vird-store";
import { fetchVirdPrograms, fetchVirdToday } from "../services/vird-api-client";
import { buildVirdTodaySnapshot, pushLocalVirdProgram, toLocalVirdProgram } from "../services/vird-sync";

export function useVirdBackendSync(): void {
  const authStatus = useAuthStore((state) => state.status);
  const isMigrationBlocking = useGuestMigrationStore(
    (state) => state.status === "pending" || state.status === "running"
  );
  const appState = useRef(AppState.currentState);
  const isSyncingRef = useRef(false);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) {
      return;
    }

    const accessToken = useAuthStore.getState().session?.accessToken;
    if (useAuthStore.getState().status !== "authenticated" || !accessToken) {
      return;
    }

    isSyncingRef.current = true;
    try {
      // (a) Henüz sunucuya yazılmamış (origin:'local') programları it —
      // clientId ile idempotent, 409'da mevcut kaydı çeker; yerelde aktifse
      // sunucuda da aktive eder (bkz. vird-sync.ts pushLocalVirdProgram).
      const localOnlyPrograms = useVirdStore.getState().programs.filter((program) => program.origin === "local");
      for (const program of localOnlyPrograms) {
        const wasActive = useVirdStore.getState().activeProgramId === program.id;
        const serverProgram = await pushLocalVirdProgram(program, accessToken, { activate: wasActive });
        const merged = toLocalVirdProgram(serverProgram, program);
        useVirdStore.getState().upsertProgram(merged);
        if (wasActive && merged.id !== program.id) {
          // clientId aynı kaldı ama id (local clientId'den) sunucunun
          // gerçek _id'sine değişti — aktif referansı güncelle, aksi halde
          // "aktif program" hiçbir kayıtla eşleşmez kalır.
          useVirdStore.getState().setActiveProgram(merged.id);
        }
      }

      // (b) Programlar + bugünün ilerlemesi. programId yalnızca aktif program
      // zaten sunucuda varsa (origin:'server') gönderilir — yerel clientId'ler
      // Mongo ObjectId değildir ve sunucu tarafında @IsMongoId ile reddedilir.
      const todayKey = toDateKey(new Date());
      const activeProgram = useVirdStore
        .getState()
        .programs.find((program) => program.id === useVirdStore.getState().activeProgramId);
      const activeProgramId = activeProgram?.origin === "server" ? activeProgram.id : undefined;
      const [serverPrograms, today] = await Promise.all([
        fetchVirdPrograms(accessToken),
        fetchVirdToday(accessToken, todayKey, activeProgramId)
      ]);

      const localById = new Map(useVirdStore.getState().programs.map((program) => [program.id, program]));
      const mergedPrograms = serverPrograms.map((server) => toLocalVirdProgram(server, localById.get(server.id)));
      useVirdStore.getState().replaceFromServer(mergedPrograms, buildVirdTodaySnapshot(today, todayKey));

      // (c) Authoritative seri — bkz. vird-store.ts virdStreak notu.
      useVirdStore.getState().setVirdStreak(today.virdStreak ?? null);
      useVirdStore.getState().setSyncError(undefined);
    } catch (error) {
      // Yerel state dokunulmadan kalır (yukarıdaki hiçbir store yazımı
      // burada henüz çalışmamıştır ya da kısmen çalışmış olsa da hepsi
      // kendi başına idempotent'tir) — bir sonraki tetikte (foreground,
      // yeniden mount) yeniden denenir.
      const message = error instanceof Error ? error.message : "vird sync failed";
      useVirdStore.getState().setSyncError(message);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || isMigrationBlocking) {
      return;
    }

    void runSync();

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active") {
        void runSync();
      }
    });

    return () => subscription.remove();
  }, [authStatus, isMigrationBlocking, runSync]);
}
