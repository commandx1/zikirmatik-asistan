import { Text, View } from "react-native";

type MarkdownRendererProps = {
  markdown: string;
};

export function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <View className="gap-1.5">
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^[-*]\s+(.+)/);
        if (bulletMatch) {
          return (
            <View key={`${line}-${index}`} className="flex-row items-start gap-2">
              <Text className="pt-[1px] text-xs text-[--text-muted]">•</Text>
              <Text className="flex-1 text-xs leading-5 text-[--text-muted]" style={{ textAlign: "justify" }}>
                {bulletMatch[1]}
              </Text>
            </View>
          );
        }

        const orderedMatch = line.match(/^\d+\.\s+(.+)/);
        if (orderedMatch) {
          return (
            <View key={`${line}-${index}`} className="flex-row items-start gap-2">
              <Text className="text-xs text-[--text-muted]">{`${index + 1}.`}</Text>
              <Text className="flex-1 text-xs leading-5 text-[--text-muted]" style={{ textAlign: "justify" }}>
                {orderedMatch[1]}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`${line}-${index}`} className="text-xs leading-5 text-[--text-muted]" style={{ textAlign: "justify" }}>
            {line}
          </Text>
        );
      })}
    </View>
  );
}
