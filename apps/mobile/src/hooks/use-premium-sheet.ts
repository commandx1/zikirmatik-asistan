import { useState } from "react";
import { useAuthStore } from "../store/auth-store";
import { useProfileStore } from "../store/profile-store";
import { useRequireAuth } from "../features/auth/hooks/use-require-auth";
import {
  CREDIT_TOPUP_FALLBACK,
  getCreditTopupProducts,
  purchaseCreditTopup,
  purchasePremiumWithRevenueCat,
  toRevenueCatMessage,
  type CreditTopupProduct,
} from "../features/subscriptions/services/revenuecat-client";

type PremiumPlan = "monthly" | "annual";

export function usePremiumSheet() {
  const session = useAuthStore((s) => s.session);
  const { requireAuth } = useRequireAuth();
  const hydrateFromBackend = useProfileStore((s) => s.hydrateFromBackend);

  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<PremiumPlan>("annual");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [topupProducts, setTopupProducts] = useState<CreditTopupProduct[]>(CREDIT_TOPUP_FALLBACK);
  const [purchasingTopupId, setPurchasingTopupId] = useState<string | undefined>();
  const [topupError, setTopupError] = useState<string | undefined>();

  const loadTopupProducts = async () => {
    if (!session?.userId) {
      return;
    }
    try {
      setTopupProducts(await getCreditTopupProducts(session.userId));
    } catch {
      // Mağaza fiyatları alınamazsa fallback fiyatlar gösterilir.
    }
  };

  const open = () => {
    setIsOpen(true);
    void loadTopupProducts();
  };
  const close = () => {
    setIsOpen(false);
    setError(undefined);
    setTopupError(undefined);
  };

  const purchaseTopup = async (productId: string): Promise<boolean> => {
    if (!session?.userId || purchasingTopupId) {
      return false;
    }
    setPurchasingTopupId(productId);
    setTopupError(undefined);
    try {
      await purchaseCreditTopup(session.userId, productId);
      return true;
    } catch (e) {
      const msg = toRevenueCatMessage(e);
      if (msg) setTopupError(msg);
      return false;
    } finally {
      setPurchasingTopupId(undefined);
    }
  };

  const activatePremium = async () => {
    if (!session?.userId) {
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

  const activate = () => {
    requireAuth(() => {
      void activatePremium();
    });
  };

  return {
    isOpen,
    open,
    close,
    plan,
    setPlan,
    isActivating,
    error,
    activate,
    topupProducts,
    purchasingTopupId,
    topupError,
    purchaseTopup,
  };
}
