import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { DhikrResumeModal } from "../../components/ui/dhikr-resume-modal";
import { PageLayout, PageScrollView } from "../../components/ui/page-layout";
import { UnsavedDhikrTransitionModal } from "../../components/ui/unsaved-dhikr-transition-modal";
import { useAuthStore } from "../../store/auth-store";
import { useDhikrStartGuard } from "../../hooks/use-dhikr-start-guard";
import { usePremiumSheet } from "../../hooks/use-premium-sheet";
import { useRequireAuth } from "../auth/hooks/use-require-auth";
import { ProfilePremiumSheet } from "../profile/components/profile-premium-sheet";
import { resolveLocalizedText, useDhikrStore } from "../../store/dhikr-store";
import { createDhikrLog } from "../dhikrs/services/dhikr-logs-api-client";
import { ChatEmptyState } from "./components/empty-state";
import { ChatInput } from "./components/chat-input";
import { ChatTopBar } from "./components/chat-top-bar";
import { ConversationListSection } from "./components/conversation-list-section";
import { MessageBubble } from "./components/message-bubble";
import { TypingIndicator } from "./components/typing-indicator";
import { useAiChat, type ChatDhikrCard } from "./hooks/use-ai-chat";

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AiChatScreen() {
  const { t, i18n } = useTranslation("ai-chat");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
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

  const guard = useDhikrStartGuard();
  const clearDhikrProgress = useDhikrStore((s) => s.clearDhikrProgress);
  const storeItems = useDhikrStore((s) => s.items);
  const selectedDhikrId = useDhikrStore((s) => s.selectedDhikrId);
  const unsavedProgressDhikrIds = useDhikrStore((s) => s.unsavedProgressDhikrIds);
  const freeModeCount = useDhikrStore((s) => s.freeModeCount);
  const discardUnsavedProgress = useDhikrStore((s) => s.discardUnsavedProgress);
  const clearFreeModeSession = useDhikrStore((s) => s.clearFreeModeSession);
  const applySavedBackendLog = useDhikrStore((s) => s.applySavedBackendLog);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);
  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const sessionAccessToken = useAuthStore((s) => s.session?.accessToken);

  const scrollRef = useRef<ScrollView>(null);
  const [pendingCard, setPendingCard] = useState<ChatDhikrCard | null>(null);
  const [isSavingUnsaved, setIsSavingUnsaved] = useState(false);
  const [unsavedSaveError, setUnsavedSaveError] = useState<string | null>(null);
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

  const proceedWithCard = (item: ChatDhikrCard) => {
    guard.guardedStart({
      id: item.id,
      dhikrName: item.title ?? item.transliteration,
      onFresh: () => {
        clearDhikrProgress(item.id);
        selectDhikr(item.id, {
          recommendationId: chat.conversationId ?? "",
          prompt: chat.inputValue,
          assistantNote: item.virtue
        });
        router.push("/(tabs)/home");
      },
      onContinue: () => {
        selectDhikr(item.id, {
          recommendationId: chat.conversationId ?? "",
          prompt: chat.inputValue,
          assistantNote: item.virtue
        });
        router.push("/(tabs)/home");
      }
    });
  };

  const handleSelectDhikr = (item: ChatDhikrCard) => {
    const isSameTarget = item.id === selectedDhikrId;
    const hasUnsaved = !isSameTarget && (
      selectedDhikrId ? unsavedProgressDhikrIds.includes(selectedDhikrId) : freeModeCount > 0
    );

    if (hasUnsaved) {
      setPendingCard(item);
      setUnsavedSaveError(null);
      return;
    }

    proceedWithCard(item);
  };

  const handleUnsavedSaveAndContinue = async () => {
    const item = pendingCard;
    if (!item || isSavingUnsaved) return;

    const selectedDhikr = storeItems.find((d) => d.id === selectedDhikrId);
    if (!selectedDhikr || authStatus !== "authenticated" || !sessionUserId) {
      setUnsavedSaveError(t("ai-chat:errors.loginRequiredToSave"));
      return;
    }

    setIsSavingUnsaved(true);
    setUnsavedSaveError(null);

    const count = Math.max(0, Math.floor(selectedDhikr.current));
    const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, count) : count;
    const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target;
    const isObjectId = /^[a-f\d]{24}$/i.test(selectedDhikr.id);
    const dateKey = toDateKey(new Date());

    try {
      const savedLog = await createDhikrLog(
        isObjectId
          ? {
              userId: sessionUserId,
              dhikrId: selectedDhikr.id,
              count: safeCount,
              targetCount: selectedDhikr.target,
              date: dateKey,
              source: "manual",
              isCompleted,
              isFavorite: selectedDhikr.isFavorite
            }
          : {
              userId: sessionUserId,
              customDhikrId: selectedDhikr.id,
              customDhikrName:
                resolveLocalizedText(selectedDhikr.name, locale) ||
                resolveLocalizedText(selectedDhikr.transliteration, locale),
              count: safeCount,
              targetCount: selectedDhikr.target,
              date: dateKey,
              source: "manual",
              isCompleted: false,
              isFavorite: selectedDhikr.isFavorite
            },
        sessionAccessToken
      );
      applySavedBackendLog(savedLog);
      setPendingCard(null);
      proceedWithCard(item);
    } catch (e) {
      setUnsavedSaveError(e instanceof Error ? e.message : t("ai-chat:errors.dhikrSaveFailed"));
    } finally {
      setIsSavingUnsaved(false);
    }
  };

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
            chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} onSelectDhikr={handleSelectDhikr} />
            ))
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

        <UnsavedDhikrTransitionModal
          visible={Boolean(pendingCard)}
          dhikrName={(() => {
            const found = storeItems.find((d) => d.id === selectedDhikrId);
            return found ? resolveLocalizedText(found.name, locale) : "";
          })()}
          count={storeItems.find((d) => d.id === selectedDhikrId)?.current ?? freeModeCount}
          isSaving={isSavingUnsaved}
          error={unsavedSaveError}
          onSaveAndContinue={handleUnsavedSaveAndContinue}
          onContinueWithoutSaving={() => {
            const item = pendingCard!;
            setPendingCard(null);
            setUnsavedSaveError(null);
            if (selectedDhikrId) {
              discardUnsavedProgress(selectedDhikrId);
            } else {
              clearFreeModeSession();
            }
            proceedWithCard(item);
          }}
          onCancel={() => {
            setPendingCard(null);
            setUnsavedSaveError(null);
          }}
        />
        <DhikrResumeModal
          visible={guard.isGuardOpen}
          dhikrName={guard.guardDhikrName}
          currentCount={guard.guardCurrentCount}
          onContinue={guard.onGuardContinue}
          onFresh={guard.onGuardFresh}
          onCancel={guard.onGuardCancel}
        />

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
