import { Text, View } from "react-native";
import { i18n } from "../../../i18n";
import type { ChatMessage } from "../hooks/use-ai-chat";

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View className={`mb-4 w-full ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[88%] rounded-2xl px-4 py-3 ${
          isUser ? "rounded-br-sm bg-[--accent]" : "rounded-bl-sm border border-white/10 bg-[--card]"
        }`}
      >
        <Text className={`text-sm leading-5 ${isUser ? "text-[#111827]" : "text-[--text-primary]"}`}>
          {message.content}
        </Text>

        {!isUser && message.sourceCitations.length > 0 ? (
          <View className="mt-2 gap-1 border-t border-white/10 pt-2">
            {message.sourceCitations.map((citation, index) => (
              <Text
                key={`${citation.sourceId}-${index}`}
                className="text-xs leading-4 text-[--text-muted]"
              >
                {citation.pageStart === citation.pageEnd
                  ? i18n.t("ai-chat:citation.singlePage", {
                      title: citation.sourceTitle,
                      page: citation.pageStart
                    })
                  : i18n.t("ai-chat:citation.pageRange", {
                      title: citation.sourceTitle,
                      pageStart: citation.pageStart,
                      pageEnd: citation.pageEnd
                    })}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
