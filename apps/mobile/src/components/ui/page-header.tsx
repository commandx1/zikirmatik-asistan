import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type IconName = ComponentProps<typeof FontAwesome6>["name"];

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  subtitleTestID?: string;
  leftTestID?: string;
  leftIconName?: IconName;
  leftIconStyle?: "solid" | "regular";
  onPressLeft?: () => void;
  leftAccessibilityLabel?: string;
  leftAccessory?: ReactNode;
  rightIconName?: IconName;
  rightIconStyle?: "solid" | "regular";
  onPressRight?: () => void;
  rightAccessory?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  subtitleTestID,
  leftTestID,
  leftIconName,
  leftIconStyle = "regular",
  onPressLeft,
  leftAccessibilityLabel,
  leftAccessory,
  rightIconName,
  rightIconStyle = "regular",
  onPressRight,
  rightAccessory,
}: PageHeaderProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("components");

  return (
    <View className="px-5 pb-4 pt-12">
      <View className="flex-row items-center">
        {leftAccessory ? (
          <View className="h-9 w-9 items-center justify-center">{leftAccessory}</View>
        ) : leftIconName ? (
          onPressLeft ? (
            <Pressable
              onPress={onPressLeft}
              testID={leftTestID}
              accessibilityRole="button"
              accessibilityLabel={leftAccessibilityLabel ?? t("components:a11y.pageHeaderBack")}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/10"
            >
              <FontAwesome6 name={leftIconName} iconStyle={leftIconStyle} size={14} color={tokens.textMuted} />
            </Pressable>
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10">
              <FontAwesome6 name={leftIconName} iconStyle={leftIconStyle} size={14} color={tokens.textMuted} />
            </View>
          )
        ) : (
          <View className="h-9 w-9" />
        )}

        <View className="flex-1 items-center px-2">
          <Text className="text-xl leading-7 font-semibold text-center text-text-primary" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text testID={subtitleTestID} className="mt-0.5 text-sm leading-5 text-center text-text-muted" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAccessory ? (
          <View className="h-9 w-9 items-center justify-center">{rightAccessory}</View>
        ) : rightIconName ? (
          onPressRight ? (
            <Pressable
              onPress={onPressRight}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/10"
            >
              <FontAwesome6 name={rightIconName} iconStyle={rightIconStyle} size={14} color={tokens.textMuted} />
            </Pressable>
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10">
              <FontAwesome6 name={rightIconName} iconStyle={rightIconStyle} size={14} color={tokens.textMuted} />
            </View>
          )
        ) : (
          <View className="h-9 w-9" />
        )}
      </View>
    </View>
  );
}
