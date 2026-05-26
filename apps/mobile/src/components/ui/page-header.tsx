import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type IconName = ComponentProps<typeof FontAwesome6>["name"];

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  leftIconName?: IconName;
  leftIconStyle?: "solid" | "regular";
  onPressLeft?: () => void;
  leftAccessory?: ReactNode;
  rightIconName?: IconName;
  rightIconStyle?: "solid" | "regular";
  onPressRight?: () => void;
  rightAccessory?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  leftIconName,
  leftIconStyle = "regular",
  onPressLeft,
  leftAccessory,
  rightIconName,
  rightIconStyle = "regular",
  onPressRight,
  rightAccessory,
}: PageHeaderProps) {
  const { tokens } = useThemeTokens();

  return (
    <View className="px-5 pb-4 pt-12">
      <View className="flex-row items-center">
        {leftAccessory ? (
          <View className="h-9 w-9 items-center justify-center">{leftAccessory}</View>
        ) : leftIconName ? (
          onPressLeft ? (
            <Pressable
              onPress={onPressLeft}
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
          <Text className="text-[20px] leading-[28px] font-semibold text-center text-[--text-primary]" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[13px] leading-[18px] text-center text-[--text-muted]" numberOfLines={2}>
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
