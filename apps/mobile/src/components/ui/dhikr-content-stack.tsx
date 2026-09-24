import { useThemeTokens } from "@zikirmatik/ui";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { withAlpha } from "@zikirmatik/shared";

import { useLocaleUpper } from "../../hooks/use-locale-upper";

type DhikrContentStackProps = {
  arabic?: string;
  transliteration?: string;
  meaning?: string;
  order?: Array<"transliteration" | "meaning" | "arabic">;
};

export function DhikrContentStack({
  arabic,
  transliteration,
  meaning,
  order = ["arabic", "transliteration", "meaning"],
}: DhikrContentStackProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("components");
  const upper = useLocaleUpper();

  const blocks = {
    arabic: arabic ? (
      <View
        key="arabic"
        className="rounded-xl px-3 py-2"
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.1),
          backgroundColor: withAlpha(tokens.textPrimary, 0.04),
        }}
      >
        <Text className="mb-1 text-xs font-semibold tracking-[0.9px] text-text-muted">{upper(t("components:dhikrContentStack.arabic"))}</Text>
        <Text className="text-right text-xl leading-8 text-text-primary" style={{ writingDirection: "rtl" }}>
          {arabic}
        </Text>
      </View>
    ) : null,
    transliteration: transliteration ? (
      <View
        key="transliteration"
        className="rounded-xl px-3 py-2"
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.1),
          backgroundColor: withAlpha(tokens.textPrimary, 0.04),
        }}
      >
        <Text className="mb-1 text-xs font-semibold tracking-[0.9px] text-text-muted">{upper(t("components:dhikrContentStack.transliteration"))}</Text>
        <Text className="text-sm leading-5 text-text-primary">{transliteration}</Text>
      </View>
    ) : null,
    meaning: meaning ? (
      <View
        key="meaning"
        className="rounded-xl px-3 py-2"
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.1),
          backgroundColor: withAlpha(tokens.textPrimary, 0.04),
        }}
      >
        <Text className="mb-1 text-xs font-semibold tracking-[0.9px] text-text-muted">{upper(t("components:dhikrContentStack.meaning"))}</Text>
        <Text className="text-sm leading-5 text-text-muted" style={{ textAlign: "justify" }}>
          {meaning}
        </Text>
      </View>
    ) : null,
  } as const;

  return (
    <View className="mt-3 gap-2">
      {order.map((key) => blocks[key])}
    </View>
  );
}

