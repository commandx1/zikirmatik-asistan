import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { PageLayout } from "../../components/ui/page-layout";
import { ErrorBox } from "../../components/ui/error-box";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { useRequireAuth } from "../auth/hooks/use-require-auth";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import { ChatEmptyState } from "./components/empty-state";
import { ChatInput } from "./components/chat-input";
import { ChatTopBar } from "./components/chat-top-bar";
import { ConversationListSection } from "./components/conversation-list-section";
import { MessageBubble } from "./components/message-bubble";
import { TypingIndicator } from "./components/typing-indicator";
import { useAiChat, type ChatMessage } from "./hooks/use-ai-chat";

export function AiChatScreen() {
  const { t } = useTranslation("ai-chat");
  const router = useRouter();
  const resumeAfterCreditPurchaseRef = useRef<() => void>(() => {});
  const premiumSheet = usePremiumSheet({
    onPremiumActivated: () => resumeAfterCreditPurchaseRef.current()
  });
  const { requireAuth } = useRequireAuth();
  const chat = useAiChat(premiumSheet.open);
  resumeAfterCreditPurchaseRef.current = () => {
    void chat.resumeAfterCreditPurchase();
  };

  const scrollRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 0) : 0;
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  // Android'de KeyboardAvoidingView "padding" davranışı edge-to-edge ile
  // güvenilir değil (kapanışta bazen stale offset bırakıyor). Bu yüzden
  // Android'de klavye yüksekliğini event'ten okuyup ChatInput'un altına
  // ekliyoruz; iOS'ta KAV zaten doğru çalıştığı için dokunmuyoruz.
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [chat.messages.length, chat.isSending]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setAndroidKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => <MessageBubble message={item} />, []);

  return (
    <PageLayout>
      {/* Klavye açılınca ChatInput'un görünür kalması için. iOS'ta KAV'ın
          "padding" davranışı doğru çalışıyor. Android'de edge-to-edge ile
          "padding" davranışı kapanışta stale offset bırakabildiği için
          Android'de KAV devre dışı; klavye yüksekliği yukarıdaki
          androidKeyboardHeight ile ChatInput'un altına ekleniyor. */}
      <KeyboardAvoidingView
        className="relative flex-1 w-full"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ChatTopBar
          onPressBack={() => router.back()}
          onPressNewChat={chat.startNewConversation}
          showNewChat={Boolean(chat.conversationId)}
        />

        <FlatList
          ref={scrollRef}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          className="flex-1 w-full"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 16 + androidBottomInset + tabBarHeight
          }}
          ListHeaderComponent={
            <>
              {!chat.conversationId ? (
                <ConversationListSection
                  items={chat.conversations}
                  activeConversationId={chat.conversationId}
                  onOpenConversation={chat.openConversation}
                />
              ) : null}

              {chat.error ? (
                <ErrorBox message={chat.error} />
              ) : null}

              {chat.aiUnavailable ? (
                <View className="mb-4 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-4">
                  <Text className="mb-3 text-sm leading-5 text-amber-100/80">
                    {chat.aiUnavailable.message || t("ai-chat:errors.aiUnavailable")}
                  </Text>
                  <Pressable
                    onPress={() => void chat.retryLastMessage()}
                    className="self-start rounded-full bg-amber-500/15 px-4 py-2"
                    accessibilityRole="button"
                    accessibilityLabel={t("ai-chat:actions.retry")}
                  >
                    <Text className="text-xs font-semibold text-amber-200">
                      {t("ai-chat:actions.retry")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={<ChatEmptyState />}
          ListFooterComponent={
            chat.isSending && chat.isAwaitingFirstToken ? <TypingIndicator stepMessage={chat.loadingStep} /> : null
          }
        />

        <View style={Platform.OS === "android" ? { paddingBottom: androidKeyboardHeight } : undefined}>
          <ChatInput
            value={chat.inputValue}
            isSending={chat.isSending}
            creditBalance={chat.creditBalance}
            onPressCredits={premiumSheet.open}
            onChangeValue={chat.setInputValue}
            onSend={() => {
              requireAuth(() => {
                void chat.sendMessage();
              });
            }}
          />
        </View>

        <ProfilePremiumSheet
          visible={premiumSheet.isOpen}
          selectedPlan={premiumSheet.plan}
          isActivating={premiumSheet.isActivating}
          error={premiumSheet.error}
          onSelectPlan={premiumSheet.setPlan}
          onStartPremium={premiumSheet.activate}
          onClose={premiumSheet.close}
          topupProducts={premiumSheet.topupProducts}
          purchasingTopupId={premiumSheet.purchasingTopupId}
          topupError={premiumSheet.topupError}
          onPurchaseTopup={(productId) => {
            void premiumSheet.purchaseTopup(productId).then((purchased) => {
              if (!purchased) {
                return;
              }
              premiumSheet.close();
              void chat.resumeAfterCreditPurchase();
            });
          }}
          subscriptionPrices={premiumSheet.subscriptionPrices}
          source="ai_chat"
        />
      </KeyboardAvoidingView>
    </PageLayout>
  );
}
