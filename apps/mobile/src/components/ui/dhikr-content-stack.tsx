import { useThemeTokens } from "@zikirmatik/ui";
import { Text, View } from "react-native";

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
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[0.9px] text-[--text-muted]">Arapça</Text>
        <Text className="text-right text-xl leading-8 text-[--text-primary]" style={{ writingDirection: "rtl" }}>
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
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[0.9px] text-[--text-muted]">Okunuş</Text>
        <Text className="text-sm leading-5 text-[--text-primary]">{transliteration}</Text>
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
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[0.9px] text-[--text-muted]">Anlam</Text>
        <Text className="text-sm leading-5 text-[--text-muted]" style={{ textAlign: "justify" }}>
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
