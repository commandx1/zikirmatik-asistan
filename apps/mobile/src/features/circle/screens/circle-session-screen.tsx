import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { resolveLocalizedText, toDateKey } from "@zikirmatik/shared";
import type { CircleDetail } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { ThemedCard } from "../../../components/ui/themed-card";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ErrorBox } from "../../../components/ui/error-box";
import { DhikrContentStack } from "../../../components/ui/dhikr-content-stack";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";

import { useAuthStore } from "../../../store/auth-store";
import { useCounterStyleStore } from "../../../store/counter-style-store";
import { useProfileStore } from "../../../store/profile-store";
import { useCircleStore } from "../../../store/circle-store";
import { resolveHapticsPattern } from "../../../services/haptics";
import { fireCounterFeedback } from "../../../services/counter-feedback";
import { createDhikrLog } from "../../dhikrs/services/dhikr-logs-api-client";
import { trackEvent } from "../../../lib/analytics";
import { maybeRequestStoreReview } from "../../review/request-store-review";
import { AppleWatchView, type CounterVisualModel } from "../../home/components/apple-watch";
import { TesbihCounterView } from "../../home/components/tesbih-counter";
import { CIRCLE_ERROR_CODE, CircleApiError, fetchCircle, resolveCircleActionError } from "../services/circle-api-client";
import { buildCircleLogPayload, computeDisplayTotal, resolveCircleTitle } from "../services/circle-share";
import {
  canManualRefresh,
  canManualSend,
  canTapCircle,
  isGoalReached,
  mergeResponseTotal,
  pendingFlushes,
  pendingTotal,
  seedTodayCount,
  shouldAutoSend,
  tapDay,
  type AutoSendEvent,
  type DayCounts
} from "../services/circle-session-logic";
import { useAppLocale } from "../../../i18n";
import { TEST_IDS } from "../../../test-ids";

const LAP_SIZE = 33;
// apps/mobile/e2e/recordings/story-circle.e2e.js için eklendi (bkz. rapor):
// AppleWatchView/TesbihCounterView testIDs prop'unu destekliyor ama bu ekran hiç
// geçmiyordu — additive only, davranış değişmedi.
const SESSION_TEST_IDS = { counter: TEST_IDS.circle.sessionCounter, countLabel: TEST_IDS.circle.sessionCountLabel };

// Bir halkanın hedefine ulaştığı analitik olayının BİR KEZ (halka başına)
// atılmasını sağlamak için modül düzeyinde bir guard (bkz. todays-vird-card.tsx
// dayCompletedFired ile aynı desen).
const goalReachedFired = new Set<string>();

export function CircleSessionScreen({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation("circle");
  const locale = useAppLocale();
  // M-24: her dokunuş DOKUNUŞ ANININ (cihaz yerel) gününe yazılır. Gün anahtarı
  // render'da değil, dokunuşta yenilenir; gün değişince eski günün sayımı
  // olduğu gibi gönderilir, yeni gün 0'dan başlar (çift sayım yok).
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));
  const todayKeyRef = useRef(todayKey);

  const authStatus = useAuthStore((state) => state.status);
  const sessionUserId = useAuthStore((state) => state.session?.userId);

  const storedCircle = useCircleStore((state) => state.circles.find((circle) => circle.id === id));
  const setTodayCount = useCircleStore((state) => state.setTodayCount);
  const upsertCircle = useCircleStore((state) => state.upsertCircle);
  const bumpTotal = useCircleStore((state) => state.bumpTotal);

  const storedHapticsPattern = useProfileStore((state) => state.hapticsPattern);
  const storedHapticsEnabled = useProfileStore((state) => state.hapticsEnabled);
  const hapticsPattern = resolveHapticsPattern(storedHapticsPattern, storedHapticsEnabled);
  const isPremium = useProfileStore((state) => state.isPremium);
  const soundPack = useCounterStyleStore((state) => state.soundPack);
  const effectiveSoundPack = isPremium ? soundPack : "off";
  const counterStyle = useCounterStyleStore((state) => state.counterStyle);

  const [locked, setLocked] = useState(false);

  // Canlı sayaç (gün bazlı): render closure'larına güvenmemek için ref'te
  // tutulur, bugünkü değer useCircleStore.todayCounts'a da yansıtılır.
  // Mount'ta kalıcı yerel sayımla tohumlanır (B-33: çevrimdışı açılan oturum da
  // bekleyen sayımı gönderebilsin).
  const countsRef = useRef<DayCounts | null>(null);
  if (countsRef.current === null) {
    const local = useCircleStore.getState().todayCounts[id];
    countsRef.current = local && local.dateKey === todayKey && local.count > 0 ? { [todayKey]: local.count } : {};
  }
  const sentRef = useRef<DayCounts>({});
  const seededRef = useRef(false);
  const liveToday = () => countsRef.current?.[todayKeyRef.current] ?? 0;
  // Sunucudan gelen "çift" (toplam, benim payım) HER ZAMAN birlikte set
  // edilir — ikisi ayrı ayrı güncellenirse (ör. yalnız toplam tazelenirse)
  // computeDisplayTotal formülü anlık olarak yanlış bir "başkalarının payı"
  // hesaplardı. Poll'da fresh'ten, flush yanıtında circleTotalCount'tan gelir.
  const serverPairRef = useRef<{ total: number; mine: number } | null>(null);
  // Tracks the last-seen server status/total for this mount so the
  // circle_goal_reached event (and review prompt) only fire on a
  // not-reached→reached transition observed here — not when simply opening
  // an already-completed circle's session (cold open / remount).
  const prevGoalStateRef = useRef<{ status: CircleDetail["status"] | null; total: number }>({ status: null, total: 0 });

  // Ekranda gösterilen (asla geriye düşmeyen) toplam — artık ref yerine
  // state: her artış onCountPress/flush/poll içinde (render GÖVDESİNDE
  // DEĞİL) hesaplanıp setDisplayTotal ile yazılır. Lazy initializer, aynı
  // halkaya önceden girilmişse (store'da zaten varsa) ilk render'da doğru
  // sayıyı göstermek için — sonraki render'larda bir daha okunmaz.
  const [displayTotal, setDisplayTotal] = useState(
    () => useCircleStore.getState().circles.find((circle) => circle.id === id)?.totalCount ?? 0
  );
  // displayTotal'ın en güncel committed değeri — flush/unmount gibi render
  // dışı yerlerde okunur (yalnızca effect içinde yazılır, render'da DEĞİL).
  const displayTotalRef = useRef(displayTotal);
  useEffect(() => {
    displayTotalRef.current = displayTotal;
  }, [displayTotal]);

  const detailQuery = useQuery(
    {
      queryKey: qk.circle(id),
      queryFn: () => fetchCircle(id, todayKeyRef.current),
      // Halka oturumu modeli: oturuma girişte bir kez yüklenir; periyodik yoklama
      // yok, yenileme "Toplamı yenile" düğmesiyle.
      enabled: authStatus === "authenticated" && !!sessionUserId
    },
    queryClient
  );

  useEffect(() => {
    const fresh = detailQuery.data;
    if (!fresh) {
      return;
    }
    // Store artık monoton (upsertCircle geri düşürmez) — halka ekranları
    // arası tutarlılık için burada da yazılır.
    upsertCircle(fresh);
    serverPairRef.current = { total: fresh.totalCount, mine: fresh.myTodayCount ?? 0 };
    // Baseline is null on the first fetch of this mount, so opening an
    // already-completed circle's session never counts as a transition —
    // only a status change observed WITHIN this mount does.
    const prevStatus = prevGoalStateRef.current.status;
    prevGoalStateRef.current = { status: fresh.status, total: fresh.totalCount };
    if (fresh.status !== "active") {
      setLocked(true);
      const justReached = prevStatus !== null && prevStatus !== "completed" && fresh.status === "completed";
      if (justReached && !goalReachedFired.has(id)) {
        goalReachedFired.add(id);
        void trackEvent("circle_goal_reached");
        void maybeRequestStoreReview("circle_goal");
      }
    }
    if (!seededRef.current) {
      seededRef.current = true;
      const key = todayKeyRef.current;
      const mine = fresh.myTodayCount ?? 0;
      const seed = seedTodayCount(useCircleStore.getState().todayCounts[id], key, mine);
      countsRef.current = { ...countsRef.current, [key]: Math.max(countsRef.current?.[key] ?? 0, seed) };
      sentRef.current = { ...sentRef.current, [key]: Math.max(sentRef.current[key] ?? 0, mine) };
      setTodayCount(id, key, countsRef.current[key] ?? seed);
    }
    setDisplayTotal((prev) => computeDisplayTotal(prev, fresh.totalCount, fresh.myTodayCount ?? 0, liveToday()));
  }, [detailQuery.data, id, setTodayCount, upsertCircle]);

  useEffect(() => {
    if (detailQuery.error) {
      console.warn("[circle-session] fetch başarısız", detailQuery.error);
    }
  }, [detailQuery.error]);

  // Gönder/yenile düğmelerinin uçuştaki durumu (ref: çift dokunuşta state commit'ini beklemez).
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sendingRef = useRef(false);
  const refreshingRef = useRef(false);
  const [notice, setNotice] = useState<"send" | "refresh" | null>(null);
  const [, setTick] = useState(0);

  /** Başarılıysa (veya gönderecek bir şey yoksa) true; hata/çevrimdışıysa false (bekleyen korunur). */
  const flush = useCallback(async (): Promise<boolean> => {
    // Halka bilgisi store'dan (çevrimdışı açılışta da vardır) — detail'e bağlı değil.
    const circle = useCircleStore.getState().circles.find((item) => item.id === id);
    if (!sessionUserId || !circle) {
      return true;
    }
    for (const { date, count } of pendingFlushes(countsRef.current ?? {}, sentRef.current)) {
      const previousSent = sentRef.current[date] ?? 0;
      // Optimistik işaretle (çakışan flush'lar aynı sayıyı iki kez göndermesin);
      // hata olursa geri alınır ki sonraki tetikte yeniden denensin.
      sentRef.current = { ...sentRef.current, [date]: count };
      try {
        const response = await createDhikrLog(
          buildCircleLogPayload({ userId: sessionUserId, circle: { id: circle.id, dhikrId: circle.dhikrId, goalCount: circle.goalCount }, count, date })
        );
        if (date !== todayKeyRef.current) {
          continue;
        }
        let nextDisplay = displayTotalRef.current;
        const merged = mergeResponseTotal(displayTotalRef.current, response, count, liveToday());
        if (merged) {
          serverPairRef.current = merged.pair;
          nextDisplay = merged.display;
          displayTotalRef.current = nextDisplay;
          setDisplayTotal(nextDisplay);
        }
        bumpTotal(id, nextDisplay);
      } catch (error) {
        if (error instanceof CircleApiError && error.code === CIRCLE_ERROR_CODE.NOT_ACTIVE) {
          // Kurucu halkayı kapattı: sunucu katkıyı reddeder — yeniden deneme yok,
          // sayaç kilitlenir, detay tazelenir (durum "closed" gelir).
          setLocked(true);
          void detailQuery.refetch();
          continue;
        }
        sentRef.current = { ...sentRef.current, [date]: previousSent };
        console.warn("[circle-session] log kaydı başarısız", error);
        return false;
      }
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- detailQuery.refetch kararlı; liveToday ref okur
  }, [sessionUserId, id, bumpTotal]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  const pendingNow = () => pendingTotal(countsRef.current ?? {}, sentRef.current);
  // Otomatik gönderim yalnız çıkış, arka plan ve hedefe ulaşmada (shouldAutoSend).
  const autoSendRef = useRef<(event: AutoSendEvent) => void>(() => {});
  autoSendRef.current = (event) => {
    if (shouldAutoSend(event, pendingNow())) {
      void flushRef.current();
    }
  };

  useEffect(() => {
    return () => {
      autoSendRef.current("leave");
      bumpTotal(id, displayTotalRef.current);
    };
  }, [bumpTotal, id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "inactive" || nextState === "background") {
        autoSendRef.current("background");
      }
    });
    return () => subscription.remove();
  }, []);

  if (authStatus !== "authenticated") {
    return (
      <PageLayout>
        <PageHeader title="" leftIconName="arrow-left" onPressLeft={() => router.back()} />
      </PageLayout>
    );
  }

  if (!storedCircle) {
    // B-36: show why instead of an endless blank page.
    return (
      <PageLayout>
        <PageHeader title="" leftIconName="arrow-left" onPressLeft={() => router.back()} />
        {detailQuery.error ? (
          <Text testID={TEST_IDS.circle.notFound} className="px-5 text-sm text-text-muted">
            {resolveCircleActionError(detailQuery.error, t("circle:errors.notFound"))}
          </Text>
        ) : null}
      </PageLayout>
    );
  }

  const circleName = resolveCircleTitle(storedCircle, locale);
  const goal = storedCircle.goalCount;

  const onCountPress = () => {
    // M-12: ilk detay gelene kadar (ve kilitliyken) dokunuş yok.
    if (!canTapCircle({ loaded: seededRef.current, locked })) {
      return;
    }
    const key = toDateKey(new Date());
    if (key !== todayKeyRef.current) {
      // Gece yarısı geçti: eski günün sayımı gönderilir, yeni gün 0'dan başlar.
      // Sunucu toplamı eski günün payını zaten içerir -> "benim payım" 0.
      void flushRef.current();
      todayKeyRef.current = key;
      setTodayKey(key);
      if (serverPairRef.current) {
        serverPairRef.current = { ...serverPairRef.current, mine: 0 };
      }
    }
    const prev = liveToday();
    countsRef.current = tapDay(countsRef.current ?? {}, key);
    const next = liveToday();
    setTodayCount(id, key, next);
    setNotice(null);
    setTick((n) => n + 1);
    const pair = serverPairRef.current;
    const nextDisplay = pair
      ? computeDisplayTotal(displayTotalRef.current, pair.total, pair.mine, next)
      : Math.max(displayTotalRef.current, storedCircle.totalCount);
    setDisplayTotal(nextDisplay);
    fireCounterFeedback({ prev, next, lapSize: LAP_SIZE, pattern: hapticsPattern, soundPack: effectiveSoundPack });
    if (isGoalReached(nextDisplay, goal)) {
      // M-11: hedefe ulaşıldı -> sayaç anında yerel kilit + son gönderim.
      displayTotalRef.current = nextDisplay;
      setLocked(true);
      autoSendRef.current("goal");
    }
  };

  const close = () => {
    autoSendRef.current("leave");
    router.back();
  };

  const pending = pendingNow();

  const onSend = async () => {
    if (sendingRef.current || !canManualSend({ pending, sending })) {
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setNotice(null);
    const ok = await flush();
    sendingRef.current = false;
    setSending(false);
    if (!ok) {
      setNotice("send");
    }
  };

  const onRefresh = async () => {
    if (refreshingRef.current || !canManualRefresh({ refreshing })) {
      return;
    }
    refreshingRef.current = true;
    setRefreshing(true);
    setNotice(null);
    const result = await detailQuery.refetch();
    refreshingRef.current = false;
    setRefreshing(false);
    if (result.isError) {
      setNotice("refresh");
    }
  };

  const dhikrSnapshot = storedCircle.dhikr;
  const transliteration = dhikrSnapshot.transliteration ? resolveLocalizedText(dhikrSnapshot.transliteration, locale) : undefined;
  const meaning = dhikrSnapshot.meaning ? resolveLocalizedText(dhikrSnapshot.meaning, locale) : undefined;

  const progress = goal > 0 ? Math.min(1, displayTotal / goal) : 0;

  const model: CounterVisualModel = {
    count: displayTotal,
    target: goal,
    progress,
    isTargetMode: true,
    onCountPress,
    onResetPress: () => {},
    onTargetPress: () => {},
    onSavePress: () => {},
    isSavingLog: false,
    mainDhikr: { displayName: circleName },
    activeQuickDhikr: "",
    currentLap: 0,
    lapSize: LAP_SIZE
  };

  return (
    <PageLayout>
      <PageHeader title={circleName} leftIconName="xmark" onPressLeft={close} leftTestID={TEST_IDS.circle.sessionClose} />

      <PageScrollView testID={TEST_IDS.circle.sessionScroll} contentInnerClassName="w-full px-5" bottomPadding={40}>
        {locked ? (
          <ThemedCard testID={TEST_IDS.circle.sessionLocked} className="mb-4 items-center rounded-2xl px-4 py-6">
            <Text className="mb-4 text-sm text-text-muted">
              {storedCircle.status === "closed" ? t("circle:session.closedNotice") : t("circle:session.completedNotice")}
            </Text>
            <PrimaryCtaButton label={t("circle:session.close")} onPress={close} className="w-full" />
          </ThemedCard>
        ) : (
          <>
            {counterStyle === "tesbih" && isPremium ? (
              <TesbihCounterView model={model} controls="none" testIDs={SESSION_TEST_IDS} />
            ) : (
              <AppleWatchView model={model} controls="none" testIDs={SESSION_TEST_IDS} />
            )}
            <Text className="-mt-4 mb-3 text-center text-xs text-text-muted">
              {t("circle:session.mine", { count: countsRef.current?.[todayKey] ?? 0 })}
            </Text>
          </>
        )}
        <Text testID={TEST_IDS.circle.pendingCount} className="mb-3 text-center text-sm text-text-muted">
          {t("circle:session.pending", { count: pending })}
        </Text>
        {notice ? (
          <ErrorBox testID={TEST_IDS.circle.sessionNotice} message={t(notice === "send" ? "circle:session.sendError" : "circle:session.refreshError")} />
        ) : null}
        <PrimaryCtaButton
          testID={TEST_IDS.circle.sendButton}
          label={t(sending ? "circle:session.sending" : "circle:session.send")}
          onPress={() => void onSend()}
          disabled={!canManualSend({ pending, sending })}
          className="mb-2 w-full"
          style={canManualSend({ pending, sending }) ? undefined : { opacity: 0.5 }}
        />
        <Pressable
          testID={TEST_IDS.circle.refreshButton}
          accessibilityRole="button"
          onPress={() => void onRefresh()}
          disabled={!canManualRefresh({ refreshing })}
          className="mb-5 items-center px-4 py-2"
        >
          <Text className="text-sm font-semibold text-text-muted">{t(refreshing ? "circle:session.refreshing" : "circle:session.refresh")}</Text>
        </Pressable>
        <View testID={TEST_IDS.circle.dhikrText}>
          <DhikrContentStack arabic={dhikrSnapshot.nameArabic} transliteration={transliteration} meaning={meaning} />
        </View>
      </PageScrollView>
    </PageLayout>
  );
}
