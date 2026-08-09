import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { useRequireAuth } from "../auth/hooks/use-require-auth";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import { ChatEmptyState } from "./components/empty-state";
import { ChatInput } from "./components/chat-input";
import { ChatTopBar } from "./components/chat-top-bar";
import { ConversationListSection } from "./components/conversation-list-section";
import { MessageBubble } from "./components/message-bubble";
import { TypingIndicator } from "./components/typing-indicator";
import { useAiChat } from "./hooks/use-ai-chat";

export function AiChatScreen() {
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

  const scrollRef = useRef<ScrollView>(null);
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

        <PageScrollView
          scrollRef={scrollRef}
          contentInnerClassName="w-full px-5"
          keyboardShouldPersistTaps="handled"
          bottomPadding={16}
        >
          {!chat.conversationId ? (
            <ConversationListSection
              items={chat.conversations}
              activeConversationId={chat.conversationId}
              onOpenConversation={chat.openConversation}
            />
          ) : null}

          {chat.error ? (
            <View className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
              <Text className="text-sm text-[#fecaca]">{chat.error}</Text>
            </View>
          ) : null}

          {chat.messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            chat.messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {chat.isSending && chat.isAwaitingFirstToken ? (
            <TypingIndicator stepMessage={chat.loadingStep} />
          ) : null}
        </PageScrollView>

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
        />
      </KeyboardAvoidingView>
    </PageLayout>
  );
}
