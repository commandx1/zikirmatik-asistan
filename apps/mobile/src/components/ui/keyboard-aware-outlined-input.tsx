import { useEffect, type RefObject } from "react";
import { Keyboard, Platform, Text, TextInput, type TextInputProps, View } from "react-native";

export type KeyboardState = {
  isOpen: boolean;
  height: number;
};

type ScrollToEndTarget = {
  scrollToEnd: (options?: { animated?: boolean }) => void;
};

type KeyboardAwareOutlinedInputProps = {
  value?: string;
  placeholder: string;
  onChangeText?: (value: string) => void;
  leftIcon?: string;
  onFocus?: TextInputProps["onFocus"];
  onBlur?: TextInputProps["onBlur"];
  onKeyboardStateChange?: (state: KeyboardState) => void;
  scrollRef?: RefObject<ScrollToEndTarget | null>;
  autoScrollOnFocus?: boolean;
  placeholderTextColor?: string;
  containerClassName?: string;
  contentClassName?: string;
  inputClassName?: string;
};

export function KeyboardAwareOutlinedInput({
  value,
  placeholder,
  onChangeText,
  leftIcon,
  onFocus,
  onBlur,
  onKeyboardStateChange,
  scrollRef,
  autoScrollOnFocus = true,
  placeholderTextColor = "rgba(154,144,128,0.7)",
  containerClassName = "rounded-xl border border-white/10 bg-[#162236]",
  contentClassName = "flex-row items-center px-4 py-3.5",
  inputClassName = "flex-1 text-base text-[#F0EDE6]"
}: KeyboardAwareOutlinedInputProps) {
  useEffect(() => {
    if (!onKeyboardStateChange) {
      return;
    }

    const onKeyboardShow = (event: { endCoordinates: { height: number } }) => {
      onKeyboardStateChange({ isOpen: true, height: event.endCoordinates.height });
    };
    const onKeyboardHide = () => {
      onKeyboardStateChange({ isOpen: false, height: 0 });
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      onKeyboardShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      onKeyboardHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [onKeyboardStateChange]);

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    if (autoScrollOnFocus) {
      scrollRef?.current?.scrollToEnd({ animated: true });
    }
    onFocus?.(event);
  };

  return (
    <View className={containerClassName}>
      <View className={contentClassName}>
        {leftIcon ? <Text className="mr-3 text-base text-[#9A9080]">{leftIcon}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          className={inputClassName}
        />
      </View>
    </View>
  );
}
