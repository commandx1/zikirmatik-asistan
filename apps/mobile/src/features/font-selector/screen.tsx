import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
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
  },
  {
    id: "finlandica-headline",
    title: FONT_LABELS["finlandica-headline"],
    sample: "Bismillahirrahmanirrahim"
  },
  {
    id: "indie-flower",
    title: FONT_LABELS["indie-flower"],
    sample: "Bismillahirrahmanirrahim"
  }
];

export function FontSelectorScreen() {
  const { t } = useTranslation("font-selector");
  const router = useRouter();
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
        <PageHeader
          title={t("font-selector:screen.title")}
          subtitle={t("font-selector:screen.subtitle")}
          leftIconName="chevron-left"
          onPressLeft={() => {
            router.back();
          }}
        />
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
                          : item.id === "finlandica-headline"
                            ? { fontFamily: "Finlandica_400Regular" }
                            : item.id === "indie-flower"
                              ? { fontFamily: "IndieFlower_400Regular" }
                            : { fontFamily: "" }
                    }
                  >
                    {item.sample}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </PageScrollView>

        <BottomActionFooter>
          {hasChanges ? (
            <PrimaryCtaButton
              label={t("font-selector:screen.saveChanges")}
              onPress={() => setFontFamily(draftFontFamily)}
              textClassName="text-base"
            />
          ) : null}
        </BottomActionFooter>
      </View>
    </PageLayout>
  );
}
