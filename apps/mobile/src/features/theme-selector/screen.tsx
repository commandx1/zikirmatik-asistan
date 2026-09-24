import { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ThemeName } from "@zikirmatik/shared";
import { BottomActionFooter } from "../../components/ui/bottom-action-footer";
import { useThemeTransition } from "../../contexts/theme-transition-context";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../components/ui/primary-cta-button";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { trackEvent } from "../../lib/analytics";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import { CounterStyleSection } from "./components/counter-style-section";
import { SelectorHeader } from "./components/selector-header";
import { SelectorPreviewCard } from "./components/selector-preview-card";
import { ThemeGridSection } from "./components/theme-grid-section";
import { useThemeSelector } from "./hooks/use-theme-selector";

export function ThemeSelectorScreen() {
  const { t } = useTranslation("theme-selector");
  const selector = useThemeSelector();
  const { triggerTransition } = useThemeTransition();
  const premiumSheet = usePremiumSheet();
  const selectedCardRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  function handleSelectTheme(themeId: ThemeName) {
    selector.setDraftThemeName(themeId);
    scrollRef.current?.scrollTo({ y: 70, animated: true });
  }

  function handleSave() {
    if (!selector.hasThemeChanges) return;
    if (!selector.canSave) {
      void trackEvent("theme_locked_tapped", { theme: selector.draftThemeName });
      premiumSheet.open();
      return;
    }
    selectedCardRef.current?.measureInWindow((x, y, width, height) => {
      triggerTransition(x + width / 2, y + height / 2, () => selector.saveThemeChanges());
    });
  }

  return (
    <PageLayout>
      <View className="flex-1 w-full">
        <SelectorHeader title={t("theme-selector:screen.title")} subtitle={t("theme-selector:screen.subtitle")} showBackButton />
        <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={24} scrollRef={scrollRef}>
          <View className="gap-8">
            <CounterStyleSection onRequestPremium={premiumSheet.open} />
            {selector.isPremium ? (
              <View className="rounded-xl border border-gold-30 bg-gold-10 px-4 py-3">
                <Text className="text-sm font-semibold text-[#EAC46B]">{t("theme-selector:screen.premiumActiveBanner")}</Text>
              </View>
            ) : (
              <View className="rounded-xl border border-white/10 bg-card px-4 py-3">
                <Text className="text-sm font-semibold text-text-primary">
                  {t("theme-selector:screen.premiumLockedBanner")}
                </Text>
              </View>
            )}
            <SelectorPreviewCard themeName={selector.draftThemeName} tokens={selector.draftThemeTokens} />
            <ThemeGridSection
              options={selector.themes}
              selected={selector.draftThemeName}
              onSelect={handleSelectTheme}
              selectedCardRef={selectedCardRef}
            />
          </View>
        </PageScrollView>

        <BottomActionFooter>
          {selector.hasThemeChanges ? (
            <PrimaryCtaButton
              label={t("theme-selector:screen.saveChanges")}
              onPress={handleSave}
              textClassName="text-base"
            />
          ) : null}
        </BottomActionFooter>
      </View>

      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        topupProducts={premiumSheet.topupProducts}
        purchasingTopupId={premiumSheet.purchasingTopupId}
        topupError={premiumSheet.topupError}
        onPurchaseTopup={(productId) => {
          void premiumSheet.purchaseTopup(productId).then((purchased) => {
            if (purchased) premiumSheet.close();
          });
        }}
        subscriptionPrices={premiumSheet.subscriptionPrices}
        source="theme_selector"
      />
    </PageLayout>
  );
}
