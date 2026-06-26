import type { RefObject } from "react";
import { Pressable, Text, type TextInputProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import {
  KeyboardAwareOutlinedInput,
  type KeyboardState
} from "../../../components/ui/keyboard-aware-outlined-input";
import { ONBOARDING_COLORS, cx } from "../onboarding-theme";

type ProgressDotsProps = {
  activeIndex: number;
  count: number;
};

export function ProgressDots({ activeIndex, count }: ProgressDotsProps) {
  return (
    <View className="mb-8 flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={`dot-${index}`}
            className={cx(
              "h-2 rounded",
              isActive ? "w-6 bg-[#C8972A]" : "w-2 bg-white/30"
            )}
          />
        );
      })}
    </View>
  );
}

type StepHeadingProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
};

export function StepHeading({ title, subtitle, centered = true }: StepHeadingProps) {
  return (
    <View className="mb-6">
      <Text className={cx("text-3xl font-bold leading-[34px] text-[#F0EDE6]", centered && "text-center")}>{title}</Text>
      {subtitle ? (
        <Text className={cx("mt-2 text-sm text-[#9A9080]", centered && "text-center")}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

type BottomCtaProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function BottomCta({ label, onPress, disabled = false }: BottomCtaProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute inset-x-0 bottom-0 px-6 pt-8" style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
      <View className="absolute inset-0 bg-[#0F1B2D]/96" />
      <PrimaryCtaButton
        label={label}
        onPress={onPress}
        disabled={disabled}
        className={disabled ? "opacity-60" : undefined}
      />
    </View>
  );
}

type CardOptionProps = {
  icon: string;
  title: string;
  subtitle: string;
  active?: boolean;
  onPress?: () => void;
};

export function CardOption({ icon, title, subtitle, active = false, onPress }: CardOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cx(
        "mb-3 rounded-2xl border-2 bg-[#162236] p-5",
        active ? "border-[#C8972A]/60" : "border-white/5"
      )}
      style={active ? { boxShadow: "0 4px 20px rgba(0,0,0,0.15)" } : undefined}
    >
      <View className="flex-row items-center gap-4">
        <View className={cx("h-14 w-14 items-center justify-center rounded-full", active ? "bg-[#C8972A]/20" : "bg-white/5")}>
          <Text className={cx("text-3xl", active ? "text-[#C8972A]" : "text-[#F0EDE6]")}>{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-base font-semibold text-[#F0EDE6]">{title}</Text>
          <Text className="text-xs text-[#9A9080]">{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

type OutlinedInputProps = {
  value?: string;
  placeholder: string;
  onChangeText?: (value: string) => void;
  leftIcon?: string;
  onFocus?: TextInputProps["onFocus"];
  onBlur?: TextInputProps["onBlur"];
  onKeyboardStateChange?: (state: KeyboardState) => void;
  scrollRef?: RefObject<{ scrollToEnd: (options?: { animated?: boolean }) => void } | null>;
};

export function OutlinedInput({
  value,
  placeholder,
  onChangeText,
  leftIcon,
  onFocus,
  onBlur,
  onKeyboardStateChange,
  scrollRef
}: OutlinedInputProps) {
  return (
    <KeyboardAwareOutlinedInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      leftIcon={leftIcon}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyboardStateChange={onKeyboardStateChange}
      scrollRef={scrollRef}
      placeholderTextColor={ONBOARDING_COLORS.textMuted}
    />
  );
}

export function BackgroundPattern() {
  return <View className="absolute inset-0 bg-[#0F1B2D]" />;
}
