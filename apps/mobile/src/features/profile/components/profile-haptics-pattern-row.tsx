import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { fireTapHaptic } from "../../../services/haptics";
import type { HapticsPattern } from "../../../services/haptics-pattern";
import { withAlpha } from "@zikirmatik/shared";

const PATTERNS: HapticsPattern[] = ["off", "hafif", "orta", "tesbih"];

type ProfileHapticsPatternRowProps = {
  label: string;
  iconName: React.ComponentProps<typeof FontAwesome6>["name"];
  value: HapticsPattern;
  onChange: (pattern: HapticsPattern) => void;
};

export function ProfileHapticsPatternRow({ label, iconName, value, onChange }: ProfileHapticsPatternRowProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("profile");

  const selectPattern = (pattern: HapticsPattern) => {
    if (pattern === value) {
      return;
    }

    // Küçük bir önizleme: seçilen desen hemen hissettirilir. UI katmanı
    // dışına (store/hook) sızdırmamak için fireTapHaptic burada, doğrudan
    // bileşenden çağrılıyor — bkz. services/haptics.ts üstündeki not.
    fireTapHaptic(pattern);
    onChange(pattern);
  };

  return (
    <View className="p-4">
      <View className="mb-3 flex-row items-center gap-3">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(tokens.accent, 0.12) }}
        >
          <FontAwesome6 name={iconName} size={14} color={tokens.accent} />
        </View>
        <Text className="text-base font-medium text-text-primary">{label}</Text>
      </View>
      <View className="flex-row gap-2">
        {PATTERNS.map((pattern) => {
          const isSelected = pattern === value;
          return (
            <Pressable
              key={pattern}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => selectPattern(pattern)}
              className={`flex-1 items-center justify-center rounded-full py-2 ${
                isSelected ? "bg-accent" : "border border-white/10 bg-white/5"
              }`}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: isSelected ? "#0F1B2D" : tokens.textMuted }}
                numberOfLines={1}
              >
                {t(`profile:sections.personalization.hapticsPattern.${pattern}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

