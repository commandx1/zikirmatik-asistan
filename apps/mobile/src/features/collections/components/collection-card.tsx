import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { useLocaleUpper } from "../../../hooks/use-locale-upper";
import type { BackendCollection } from "../services/collections-api-client";
import { COLLECTION_CATEGORIES } from "../types";

type IconName = ComponentProps<typeof FontAwesome6>["name"];

const CATEGORY_ICONS: Record<string, IconName> = {
  gunluk: "sun",
  namaz: "mosque",
  koruma: "shield",
  dua: "hands-praying",
  hayat: "heart",
  ibadet: "star-and-crescent",
};

type Props = {
  item: BackendCollection;
  onPress: () => void;
  isLocked?: boolean;
};

export function CollectionCard({ item, onPress, isLocked = false }: Props) {
  const { tokens } = useThemeTokens();
  const { t, i18n } = useTranslation("collections");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
  const upper = useLocaleUpper();
  const iconName = CATEGORY_ICONS[item.category] ?? "book";
  const categoryLabelKey = COLLECTION_CATEGORIES.find(
    (c) => c.key === item.category,
  )?.labelKey;
  const categoryLabel = categoryLabelKey
    ? t(`collections:categories.${categoryLabelKey}`)
    : item.category;

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 m-1.5 rounded-2xl border border-white/8 bg-[--card] p-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : isLocked ? 0.85 : 1 })}
    >
      {isLocked ? (
        <View className="absolute right-2 top-2 z-10 flex-row items-center gap-1 rounded-full border border-[--accent]/30 bg-[--accent]/15 px-2 py-1">
          <FontAwesome6 name="lock" size={8} color="#C8972A" />
          <Text className="text-xs font-bold tracking-[0.5px] text-[--accent]">{upper(t("collections:card.premiumBadge"))}</Text>
        </View>
      ) : null}

      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-[--accent]/15">
        <FontAwesome6
          name={iconName}
          iconStyle="solid"
          size={16}
          color={tokens.accent}
        />
      </View>

      <Text
        className="mb-1 text-base font-semibold leading-5 text-[--text-primary]"
        numberOfLines={2}
      >
        {resolveLocalizedText(item.label, locale)}
      </Text>

      <View className="mt-auto flex-row items-center justify-between pt-2">
        <Text className="text-xs text-[--text-muted]">{categoryLabel}</Text>
        <Text className="text-xs text-[--text-muted]">
          {t("collections:card.dhikrCount", { count: item.dhikrCount })}
        </Text>
      </View>
    </Pressable>
  );
}
