import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SelectOption = {
  label: string;
  value: string;
};

type AppSelectBoxProps = {
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (nextValue: string) => void;
  title?: string;
  disabled?: boolean;
};

export function AppSelectBox({
  value,
  placeholder = "Seçiniz",
  options,
  onChange,
  title = "Seçenekler",
  disabled = false
}: AppSelectBoxProps) {
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = useMemo(() => options.find((item) => item.value === value)?.label, [options, value]);

  const close = () => setIsOpen(false);

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        className={`w-full rounded-xl border px-4 py-3.5 ${disabled ? "opacity-60" : ""}`}
        style={{
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: tokens.card
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text style={{ color: selectedLabel ? tokens.textPrimary : withAlpha(tokens.textMuted, 0.85) }} className="text-base">
            {selectedLabel ?? placeholder}
          </Text>
          <FontAwesome6 name="chevron-down" size={14} color={tokens.textMuted} />
        </View>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1 bg-black/55" onPress={close}>
          <View className="flex-1 justify-end">
            <Pressable
              onPress={() => undefined}
              className="rounded-t-3xl border-t p-5"
              style={{
                borderColor: withAlpha(tokens.textPrimary, 0.08),
                backgroundColor: tokens.bg,
                paddingBottom: Math.max(20, insets.bottom + 12)
              }}
            >
              <Text className="mb-3 text-base font-semibold" style={{ color: tokens.textPrimary }}>
                {title}
              </Text>
              <ScrollView
                style={{ maxHeight: Math.max(260, 420 - insets.bottom) }}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
              >
                {options.map((option) => {
                  const isActive = option.value === value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onChange(option.value);
                        close();
                      }}
                      className="mb-2 rounded-xl border px-4 py-3"
                      style={{
                        borderColor: isActive ? withAlpha(tokens.accent, 0.45) : withAlpha(tokens.textPrimary, 0.12),
                        backgroundColor: isActive ? withAlpha(tokens.accent, 0.12) : tokens.card
                      }}
                    >
                      <Text className="text-base font-medium" style={{ color: isActive ? tokens.accent : tokens.textPrimary }}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
