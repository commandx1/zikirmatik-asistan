import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import type { AppFontFamily } from "../../store/theme-store";
import { BottomActionFooter } from "../../components/ui/bottom-action-footer";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { PageHeader } from "../../components/ui/page-header";
import { PrimaryCtaButton } from "../../components/ui/primary-cta-button";
import { useThemePreferences } from "../../hooks/use-theme-preferences";
import { SelectorPreviewCard } from "../theme-selector/components/selector-preview-card";
import { FONT_LABELS } from "../../theme/fonts";

const OPTIONS: Array<{
  id: AppFontFamily;
  title: string;
  sample: string;
}> = [
  {
    id: "default",
    title: FONT_LABELS.default,
    sample: "Bismillahirrahmanirrahim"
  },
  {
    id: "merriweather",
    title: FONT_LABELS.merriweather,
    sample: "Bismillahirrahmanirrahim"
  },
  {
    id: "intel-one-mono",
    title: FONT_LABELS["intel-one-mono"],
    sample: "Bismillahirrahmanirrahim"
  }
];

export function FontSelectorScreen() {
  const { tokens, themeName } = useThemeTokens();
  const { fontFamily, setFontFamily } = useThemePreferences();
  const [draftFontFamily, setDraftFontFamily] = useState<AppFontFamily>(fontFamily);

  useEffect(() => {
    setDraftFontFamily(fontFamily);
  }, [fontFamily]);

  const hasChanges = draftFontFamily !== fontFamily;

  return (
    <PageLayout>
      <View className="flex-1 w-full">
        <PageHeader title="Yazı Tipi" subtitle="Uygulama yazı tipini belirle" />
        <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={24}>
          <View className="gap-5">
            <SelectorPreviewCard themeName={themeName} tokens={tokens} previewFontFamily={draftFontFamily} />

            {OPTIONS.map((item) => {
              const isActive = draftFontFamily === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDraftFontFamily(item.id)}
                  className={`relative rounded-2xl border p-4 ${isActive ? "border-[--accent]" : "border-white/10 bg-[--card]"}`}
                >
                  {isActive ? (
                    <View className="absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full bg-[--accent]">
                      <FontAwesome6 name="check" size={10} color="#0F1B2D" />
                    </View>
                  ) : null}

                  <Text className="text-base font-semibold text-[--text-primary]">{item.title}</Text>
                  <Text
                    className="mt-2 text-sm text-[--text-muted]"
                    style={
                      item.id === "merriweather"
                        ? { fontFamily: "Merriweather_400Regular" }
                        : item.id === "intel-one-mono"
                          ? { fontFamily: "IntelOneMono_400Regular" }
                          : undefined
                    }
                  >
                    {item.sample}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-5 rounded-xl border border-white/10 bg-[--card] px-4 py-3">
            <Text className="text-xs leading-5" style={{ color: tokens.textMuted }}>
              Merriweather seçeneği Premium değil, herkes kullanabilir. Seçimi kaydetmek için alttaki butona bas.
            </Text>
          </View>
        </PageScrollView>

        <BottomActionFooter>
          <PrimaryCtaButton
            label="Değişiklikleri Kaydet"
            onPress={() => setFontFamily(draftFontFamily)}
            disabled={!hasChanges}
            className={hasChanges ? undefined : "opacity-50"}
            textClassName="text-[15px]"
          />
        </BottomActionFooter>
      </View>
    </PageLayout>
  );
}
