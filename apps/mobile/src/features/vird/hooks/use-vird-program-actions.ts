// Vird programı yaşam-döngüsü eylemlerini (duraklat/sil/aktifleştir) TEK bir
// yerde toplar — vird-setup-panel.tsx (diğer programlar listesi),
// vird-editor-screen.tsx (kaydet+aktifleştir) ve template-detail-screen.tsx
// (şablonu başlat+aktifleştir) aynı mantığı üç kez kopyalamak yerine bunu
// kullanır. UI'dan bağımsızdır (paywall/onay modalını AÇMAK çağıranın işidir
// — bu hook yalnızca sonucu {ok:true,...} | {ok:false,code?,message} olarak
// döner, hangi code için hangi modalın açılacağına karışmaz).
//
// origin:'server' + üye ise sunucu çağrılır; aksi halde (misafir ya da henüz
// sunucuya senkron olmamış bir yerel program) tamamen yerel (store) yazımı
// yapılır. Sunucu YALNIZCA "1 aktif program" ücretsiz limitini kendisi
// zorlar (VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE) — misafir/yerel yolda sunucu
// olmadığından bu hook aynı kuralı istemci tarafında EMÜLE eder (bkz.
// activateProgram: hasOtherLocalActiveProgram kontrolü), böylece çağıran
// kod (paywall/onay akışı) iki durumda da AYNI code'a bakabilir.
import { useCallback } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useVirdStore } from "../../../store/vird-store";
import { activateVirdProgram, deleteVirdProgram, updateVirdProgram, VirdApiError } from "../services/vird-api-client";
import { VIRD_ERROR_CODE } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import type { VirdProgramLocal } from "../types";

export type VirdActionResult =
  | { ok: true; program: VirdProgramLocal }
  | { ok: false; code?: string; message: string };

function nowIso(): string {
  return new Date().toISOString();
}

export function useVirdProgramActions() {
  const authStatus = useAuthStore((state) => state.status);
  const isPremium = useProfileStore((state) => state.isPremium);
  const upsertProgram = useVirdStore((state) => state.upsertProgram);
  const removeProgram = useVirdStore((state) => state.removeProgram);
  const setActiveProgram = useVirdStore((state) => state.setActiveProgram);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);

  const isServerBacked = useCallback(
    (program: VirdProgramLocal) => authStatus === "authenticated" && program.origin === "server",
    [authStatus]
  );

  const pauseProgram = useCallback(
    async (program: VirdProgramLocal): Promise<VirdActionResult> => {
      try {
        let merged: VirdProgramLocal;
        if (isServerBacked(program)) {
          const server = await updateVirdProgram(program.id, { status: "paused" });
          merged = toLocalVirdProgram(server, program);
        } else {
          merged = { ...program, status: "paused", updatedAt: nowIso() };
        }

        upsertProgram(merged);
        // Duraklatılan program, ana ekranın takip ettiği program ise (bkz.
        // vird-store.ts removeProgram'daki AYNI kural) yerel "aktif" işaretini
        // de temizle — aksi halde todays-vird-card.tsx duraklatılmış bir
        // programı hâlâ "aktif" gibi göstermeye devam eder.
        if (activeProgramId === program.id) {
          setActiveProgram(null);
        }
        return { ok: true, program: merged };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
    },
    [isServerBacked, upsertProgram, activeProgramId, setActiveProgram]
  );

  const deleteProgram = useCallback(
    async (program: VirdProgramLocal): Promise<VirdActionResult> => {
      try {
        if (isServerBacked(program)) {
          await deleteVirdProgram(program.id);
        }
        removeProgram(program.id);
        return { ok: true, program };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
    },
    [isServerBacked, removeProgram]
  );

  const activateProgram = useCallback(
    async (program: VirdProgramLocal): Promise<VirdActionResult> => {
      // Zaten sunucuda (ya da yerelde) aktifse yeniden aktive etmeye gerek
      // yok — yalnızca ana ekranın takip ettiği programı bu yap.
      if (program.status === "active") {
        setActiveProgram(program.id);
        return { ok: true, program };
      }

      if (isServerBacked(program)) {
        try {
          const server = await activateVirdProgram(program.id);
          const merged = toLocalVirdProgram(server, program);
          upsertProgram(merged);
          setActiveProgram(merged.id);
          return { ok: true, program: merged };
        } catch (error) {
          if (error instanceof VirdApiError && error.code) {
            return { ok: false, code: error.code, message: error.message };
          }
          return { ok: false, message: error instanceof Error ? error.message : String(error) };
        }
      }

      // Misafir / henüz senkron olmamış yerel program: sunucu yok, ücretsiz
      // "1 aktif program" limitini burada emüle et (bkz. dosya başı notu).
      if (!isPremium) {
        const hasOtherActive = useVirdStore
          .getState()
          .programs.some((candidate) => candidate.id !== program.id && candidate.status === "active");
        if (hasOtherActive) {
          return { ok: false, code: VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE, message: "" };
        }
      }

      const merged: VirdProgramLocal = { ...program, status: "active", updatedAt: nowIso() };
      upsertProgram(merged);
      setActiveProgram(merged.id);
      return { ok: true, program: merged };
    },
    [isServerBacked, isPremium, upsertProgram, setActiveProgram]
  );

  /**
   * Ortak "aktif programı değiştir" akışı (bkz. components/vird-swap-active-modal.tsx):
   * mevcut aktif programı (varsa) duraklatır, ardından `next`'i aktive eder.
   * Duraklatma başarısız olursa aktivasyon hiç denenmez, duraklatmanın hatası döner.
   */
  const swapActive = useCallback(
    async (next: VirdProgramLocal): Promise<VirdActionResult> => {
      const currentActive = useVirdStore
        .getState()
        .programs.find((candidate) => candidate.id === useVirdStore.getState().activeProgramId);

      if (currentActive && currentActive.id !== next.id) {
        const paused = await pauseProgram(currentActive);
        if (!paused.ok) {
          return paused;
        }
      }

      return activateProgram(next);
    },
    [pauseProgram, activateProgram]
  );

  return { pauseProgram, deleteProgram, activateProgram, swapActive };
}
