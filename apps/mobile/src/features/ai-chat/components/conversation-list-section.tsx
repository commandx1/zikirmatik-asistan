import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { i18n } from "../../../i18n";
import { useProfileStore } from "../../../store/profile-store";
import { toIntlLocale } from "../../../lib/locale-format";
import type { ChatConversationSummary } from "../types";

type ConversationListSectionProps = {
  items: ChatConversationSummary[];
  activeConversationId?: string;
  onOpenConversation: (id: string) => void;
};

export function ConversationListSection({
  items,
  activeConversationId,
  onOpenConversation
}: ConversationListSectionProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("ai-chat");
  const [isExpanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const visibleItems = isExpanded ? items : items.slice(0, 3);

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <FontAwesome6 name="comments" size={12} color={tokens.accent} />
          <Text className="text-sm font-semibold text-[--text-primary]">{t("ai-chat:history.title")}</Text>
        </View>
        {items.length > 3 ? (
          <Pressable onPress={() => setExpanded((v) => !v)} className="rounded-full px-3 py-1.5">
            <Text className="text-xs font-semibold text-[--accent]">
              {isExpanded ? t("ai-chat:history.showLess") : t("ai-chat:history.showAll")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="gap-2">
        {visibleItems.map((item) => {
          const isActive = item.id === activeConversationId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onOpenConversation(item.id)}
              className="flex-row items-center justify-between rounded-2xl border px-4 py-3"
              style={{
                borderColor: isActive ? tokens.accent : withAlpha(tokens.textPrimary, 0.12),
                backgroundColor: isActive ? withAlpha(tokens.accent, 0.12) : withAlpha(tokens.card, 0.84)
              }}
            >
              <Text className="mr-3 flex-1 text-sm text-[--text-primary]" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-xs text-[--text-muted]">{formatConversationDate(item.lastMessageAt)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return i18n.t("ai-chat:history.today");
  }
  if (dayDiff === 1) {
    return i18n.t("ai-chat:history.yesterday");
  }

  return date.toLocaleDateString(toIntlLocale(useProfileStore.getState().locale), {
    day: "2-digit",
    month: "short"
  });
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
