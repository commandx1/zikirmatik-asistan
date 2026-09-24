import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../store/auth-store";
import { useProfileStore } from "../store/profile-store";
import { useRequireAuth } from "../features/auth/hooks/use-require-auth";
import { trackEvent } from "../lib/analytics";
import {
  CREDIT_TOPUP_FALLBACK,
  fetchSubscriptionPrices,
  getCreditTopupProducts,
  purchaseCreditTopup,
  purchasePremiumWithRevenueCat,
  toRevenueCatMessage,
  type CreditTopupProduct,
  type SubscriptionPrices,
} from "../features/subscriptions/services/revenuecat-client";

type PremiumPlan = "monthly" | "annual";

type UsePremiumSheetOptions = {
  onPremiumActivated?: () => void;
  // true: kredi paketleri sheet açılışında değil mount'ta (ve kullanıcı değişince) yüklenir.
  loadTopupOnMount?: boolean;
  // Başarılı kredi alımından sonra, purchaseTopup true dönmeden önce beklenir.
  onTopupPurchased?: () => Promise<unknown> | void;
};

export function usePremiumSheet(options?: UsePremiumSheetOptions) {
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
  const [subscriptionPrices, setSubscriptionPrices] = useState<SubscriptionPrices>({});

  const userId = session?.userId;
  const loadTopupOnMount = options?.loadTopupOnMount ?? false;

  const loadTopupProducts = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      setTopupProducts(await getCreditTopupProducts(userId));
    } catch {
      // Mağaza fiyatları alınamazsa fallback fiyatlar gösterilir.
    }
  }, [userId]);

  useEffect(() => {
    if (loadTopupOnMount) {
      void loadTopupProducts();
    }
  }, [loadTopupOnMount, loadTopupProducts]);

  const loadSubscriptionPrices = async () => {
    if (!session?.userId) {
      return;
    }
    // fetchSubscriptionPrices hata/boş offering durumunda boş obje döner, throw etmez.
    setSubscriptionPrices(await fetchSubscriptionPrices(session.userId));
  };

  const open = () => {
    setIsOpen(true);
    if (!loadTopupOnMount) {
      void loadTopupProducts();
    }
    void loadSubscriptionPrices();
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
      void trackEvent("credit_topup", { product: productId });
      await options?.onTopupPurchased?.();
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
      const synced = await purchasePremiumWithRevenueCat(session.userId, plan);
      hydrateFromBackend({ isPremium: synced.isPremium });
      if (synced.isPremium) {
        void trackEvent("purchase_completed", { product: plan });
        close();
        options?.onPremiumActivated?.();
      }
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
    // Sheet dışı akışların (ör. abonelik yönetimi) hatasını aynı alanda göstermek için.
    setError,
    activate,
    topupProducts,
    purchasingTopupId,
    topupError,
    purchaseTopup,
    subscriptionPrices,
  };
}
