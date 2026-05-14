import { Text, View } from "react-native";

const PATTERN_ROWS = 9;
const PATTERN_COLS = 9;

export function DecorativePattern() {
  const cells = Array.from({ length: PATTERN_ROWS * PATTERN_COLS }, (_, index) => index);

  return (
    <View pointerEvents="none" className="absolute inset-0">
      {cells.map((index) => {
        const row = Math.floor(index / PATTERN_COLS);
        const col = index % PATTERN_COLS;
        const left = 16 + col * 36;
        const top = 18 + row * 34;

        return (
          <Text
            key={index}
            className="absolute text-sm font-bold"
            style={{ color: "rgba(200, 151, 42, 0.1)", left, top }}
          >
            +
          </Text>
        );
      })}
    </View>
  );
}
