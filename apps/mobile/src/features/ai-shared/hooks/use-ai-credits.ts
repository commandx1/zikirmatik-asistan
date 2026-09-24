// Rehber, Sohbet ve Vird programı akışlarının ortak AI kredi durumu. Saf
// parçalar ../services/ai-credits.ts'de (orada test edilir).
import { useRef, useState } from "react";
import { useStableCallback } from "../../../hooks/use-stable-callback";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { fetchAiCredits, fetchAiQuota } from "../services/ai-queries";
import {
  hasEnoughCredits,
  normalizeRemainingCredits,
  pollUntil,
  resolveCreditsFromQuota,
  type CreditState
} from "../services/ai-credits";

type Options = {
  /** Bir isteğin maliyeti: Rehber/Sohbet 1, Vird programı 3. */
  requiredCredits?: number;
  /** true → ön kontrol her seferinde tazeler (Vird); false → yalnızca bakiye doğrulanmamış ya da 0 ise (Rehber/Sohbet). */
  alwaysRefresh?: boolean;
  onOpenPremiumSheet?: () => void;
};

export function useAiCredits({ requiredCredits = 1, alwaysRefresh = false, onOpenPremiumSheet }: Options = {}) {
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const profilePremium = useProfileStore((s) => s.isPremium);

  const [creditBalance, setCreditBalance] = useState(0);
  const [creditsConfirmed, setCreditsConfirmed] = useState(false);
  // Son sunucu yanıtı (bakiye + isPremium); iki fetch de düşerse döndürülen
  // "son bilinen" değer.
  const lastRef = useRef<CreditState>({ balance: 0, isPremium: false });

  const write = (balance: number, confirmed: boolean, isPremium = lastRef.current.isPremium) => {
    lastRef.current = { balance, isPremium };
    setCreditBalance(balance);
    setCreditsConfirmed(confirmed);
  };

  const resetCredits = useStableCallback(() => write(0, false, false));

  const refreshCredits = useStableCallback(async (): Promise<CreditState> => {
    if (authStatus !== "authenticated") {
      resetCredits();
      return { balance: 0, isPremium: false };
    }

    try {
      const credits = await fetchAiCredits();
      const balance = Math.max(0, Math.floor(credits.balance));
      write(balance, true, credits.isPremium);
      return { balance, isPremium: credits.isPremium };
    } catch {
      try {
        const state = resolveCreditsFromQuota(await fetchAiQuota());
        write(state.balance, true, state.isPremium);
        return state;
      } catch {
        return lastRef.current;
      }
    }
  });

  const ensureCreditsAvailable = useStableCallback(async (): Promise<boolean> => {
    if (authStatus !== "authenticated" || !userId) {
      return false;
    }

    const state =
      alwaysRefresh || !creditsConfirmed || creditBalance <= 0
        ? await refreshCredits()
        : { balance: creditBalance, isPremium: lastRef.current.isPremium };

    // Bilinçli birleşim: profil store'u VEYA sunucu yanıtı premium diyorsa geç.
    if (hasEnoughCredits({ balance: state.balance, isPremium: state.isPremium || profilePremium, requiredCredits })) {
      return true;
    }

    onOpenPremiumSheet?.();
    return false;
  });

  /** Başarılı yanıttaki `remainingCredits` ile iyimser bakiye yazımı. */
  const applyRemainingCredits = useStableCallback((value: unknown) => {
    const balance = normalizeRemainingCredits(value);
    if (balance !== undefined) {
      write(balance, true);
    }
  });

  /** Sunucu AI_CREDIT_INSUFFICIENT / DAILY_LIMIT_REACHED döndü. */
  const markInsufficient = useStableCallback(() => write(0, true));

  /**
   * Satın alma sonrası: 8 × 2 sn (ilk deneme hemen) sunucu bakiyesini yoklar.
   * Durma koşulu yalnızca sunucu yanıtına bakar (profil store'u satın alma
   * anında true olur ama webhook gecikebilir — beklemenin sebebi bu).
   */
  const waitForCredits = useStableCallback(() =>
    pollUntil(async () => hasEnoughCredits({ ...(await refreshCredits()), requiredCredits }))
  );

  return {
    creditBalance,
    refreshCredits,
    resetCredits,
    ensureCreditsAvailable,
    applyRemainingCredits,
    markInsufficient,
    waitForCredits
  };
}
