import { useState } from "react";
import { useAuthStore } from "../store/auth-store";
import { useProfileStore } from "../store/profile-store";
import {
  purchasePremiumWithRevenueCat,
  toRevenueCatMessage,
} from "../features/subscriptions/services/revenuecat-client";

type PremiumPlan = "monthly" | "annual";

export function usePremiumSheet() {
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const hydrateFromBackend = useProfileStore((s) => s.hydrateFromBackend);

  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<PremiumPlan>("annual");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setError(undefined);
  };

  const activate = async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      setError("Premium aktivasyonu için önce giriş yapmalısın.");
      return;
    }
    setIsActivating(true);
    setError(undefined);
    try {
      const synced = await purchasePremiumWithRevenueCat(session.userId, session.accessToken, plan);
      hydrateFromBackend({ isPremium: synced.isPremium });
      if (synced.isPremium) close();
    } catch (e) {
      const msg = toRevenueCatMessage(e);
      if (msg) setError(msg);
    } finally {
      setIsActivating(false);
    }
  };

  return { isOpen, open, close, plan, setPlan, isActivating, error, activate };
}
