import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { useVirdStore } from "../../../store/vird-store";
import type { VirdFocusSegment } from "../types";

// focus/screen.tsx'te (Zikirlerim sekmesi) başlığın altında gösterilen Vird |
// Zikirlerim segment seçici. useVirdStore.focusSegment ile senkron — diğer
// yazarlar (todays-vird-card.tsx boş durum CTA'sı) da aynı alanı 'vird'e
// çevirip bu sekmeye yönlendirdiğinden, buradaki seçim state'i o akışla
// otomatik olarak eşleşir.
export function VirdSegmentControl() {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("vird");
  const focusSegment = useVirdStore((state) => state.focusSegment);
  const setFocusSegment = useVirdStore((state) => state.setFocusSegment);

  const segments: Array<{ key: VirdFocusSegment; label: string }> = [
    { key: "vird", label: t("vird:segment.vird") },
    { key: "list", label: t("vird:segment.list") }
  ];

  return (
    <View className="mx-5 mb-4 flex-row rounded-full border border-white/10 bg-[--card] p-1">
      {segments.map((segment) => {
        const isActive = focusSegment === segment.key;
        return (
          <Pressable
            key={segment.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => setFocusSegment(segment.key)}
            className={`flex-1 items-center rounded-full py-2 ${isActive ? "bg-[--accent]" : ""}`}
          >
            <Text className="text-sm font-semibold" style={{ color: isActive ? tokens.bg : tokens.textMuted }}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
