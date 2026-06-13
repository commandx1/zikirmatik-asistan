import { useRef } from "react";
import { Text, View } from "react-native";
import { BottomActionFooter } from "../../components/ui/bottom-action-footer";
import { useThemeTransition } from "../../contexts/theme-transition-context";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../components/ui/primary-cta-button";
import { SelectorHeader } from "./components/selector-header";
import { SelectorPreviewCard } from "./components/selector-preview-card";
import { ThemeGridSection } from "./components/theme-grid-section";
import { useThemeSelector } from "./hooks/use-theme-selector";

export function ThemeSelectorScreen() {
  const selector = useThemeSelector();
  const { triggerTransition } = useThemeTransition();
  const selectedCardRef = useRef<View>(null);

  function handleSave() {
    if (!selector.hasThemeChanges) return;
    selectedCardRef.current?.measureInWindow((x, y, width, height) => {
      triggerTransition(x + width / 2, y + height / 2, () => selector.saveThemeChanges());
    });
  }

  return (
    <PageLayout>
      <View className="flex-1 w-full">
        <SelectorHeader title="Tema Seçimi" subtitle="Uygulamanın görünümünü kişiselleştir" showBackButton />
        <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={24}>
          <View className="gap-8">
            {selector.isPremium ? (
              <View className="rounded-xl border border-[#C8972A]/30 bg-[#C8972A]/10 px-4 py-3">
                <Text className="text-[12px] font-semibold text-[#EAC46B]">Premium üyelik aktif: tüm temalar açık.</Text>
              </View>
            ) : (
              <View className="rounded-xl border border-white/10 bg-[--card] px-4 py-3">
                <Text className="text-[12px] font-semibold text-[--text-primary]">
                  Bazı temalar Premium ile açılır.
                </Text>
              </View>
            )}
            <SelectorPreviewCard themeName={selector.draftThemeName} tokens={selector.draftThemeTokens} />
            <ThemeGridSection
              options={selector.themes}
              selected={selector.draftThemeName}
              onSelect={selector.setDraftThemeName}
              selectedCardRef={selectedCardRef}
            />
            {selector.lockedThemeMessage ? (
              <View className="rounded-xl border border-[#C8972A]/30 bg-[#C8972A]/10 px-4 py-3">
                <Text className="text-[12px] text-[#EAC46B]">{selector.lockedThemeMessage}</Text>
              </View>
            ) : null}
          </View>
        </PageScrollView>

        <BottomActionFooter>
          {selector.hasThemeChanges ? (
            <PrimaryCtaButton
              label="Değişiklikleri Kaydet"
              onPress={handleSave}
              textClassName="text-[15px]"
            />
          ) : null}
        </BottomActionFooter>
      </View>
    </PageLayout>
  );
}
