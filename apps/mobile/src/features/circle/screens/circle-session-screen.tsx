import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toDateKey } from "@zikirmatik/shared";
import type { CircleDetail } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { ThemedCard } from "../../../components/ui/themed-card";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { useAuthStore } from "../../../store/auth-store";
import { useCounterStyleStore } from "../../../store/counter-style-store";
import { useProfileStore } from "../../../store/profile-store";
import { useCircleStore } from "../../../store/circle-store";
import { fireLapHaptic, fireTapHaptic, resolveHapticsPattern } from "../../../services/haptics";
import { playClickSound } from "../../../services/click-sound";
import { createDhikrLog } from "../../dhikrs/services/dhikr-logs-api-client";
import { trackEvent } from "../../../lib/analytics";
import { AppleWatchView, type CounterVisualModel } from "../../home/components/apple-watch";
import { TesbihCounterView } from "../../home/components/tesbih-counter";
import { fetchCircle } from "../services/circle-api-client";
import { buildCircleLogPayload, computeDisplayTotal } from "../services/circle-share";

const POLL_INTERVAL_MS = 5_000;
const FLUSH_INTERVAL_MS = 3_000;
const LAP_SIZE = 33;

// Bir halkanın hedefine ulaştığı analitik olayının BİR KEZ (halka başına)
// atılmasını sağlamak için modül düzeyinde bir guard (bkz. todays-vird-card.tsx
// dayCompletedFired ile aynı desen).
const goalReachedFired = new Set<string>();

export function CircleSessionScreen({ id }: { id: string }) {
  const router = useRouter();
  const { t, i18n } = useTranslation("circle");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
  // Gün anahtarı oturum boyunca SABİT: her render'da yeniden hesaplansaydı gece
  // yarısını geçen bir oturumda canlı sayı (dünkü dokunuşlar dahil) yeni günün
  // log'una yazılır ve halka toplamı çift sayılırdı. Mount anındaki gün ile
  // devam etmek dürüst kalır (dünkü log büyür), çift sayım olmaz.
  const [todayKey] = useState(() => toDateKey(new Date()));

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

  const [detail, setDetail] = useState<CircleDetail | null>(null);
  const [locked, setLocked] = useState(false);

  // Canlı sayaç: render closure'larına güvenmemek için ref'te tutulur,
  // her artışta useCircleStore.todayCounts'a da yansıtılır (bkz. görev notu).
  const liveCountRef = useRef(0);
  const seededRef = useRef(false);
  const lastFlushedRef = useRef(0);
  const prevDisplayRef = useRef(0);
  const prevDisplaySeededRef = useRef(false);
  // Sunucudan gelen "çift" (toplam, benim payım) HER ZAMAN birlikte set
  // edilir — ikisi ayrı ayrı güncellenirse (ör. yalnız toplam tazelenirse)
  // computeDisplayTotal formülü anlık olarak yanlış bir "başkalarının payı"
  // hesaplardı. Poll'da fresh'ten, flush yanıtında circleTotalCount'tan gelir.
  const serverPairRef = useRef<{ total: number; mine: number } | null>(null);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const detailQuery = useQuery(
    {
      queryKey: qk.circle(id),
      queryFn: () => fetchCircle(id, todayKey),
      enabled: authStatus === "authenticated" && !!sessionUserId,
      refetchInterval: POLL_INTERVAL_MS
    },
    queryClient
  );

  useEffect(() => {
    const fresh = detailQuery.data;
    if (!fresh) {
      return;
    }
    setDetail(fresh);
    // Store artık monoton (upsertCircle geri düşürmez) — halka ekranları
    // arası tutarlılık için burada da yazılır.
    upsertCircle(fresh);
    serverPairRef.current = { total: fresh.totalCount, mine: fresh.myTodayCount ?? 0 };
    if (fresh.status !== "active") {
      setLocked(true);
      if (fresh.status === "completed" && !goalReachedFired.has(id)) {
        goalReachedFired.add(id);
        void trackEvent("circle_goal_reached");
      }
    }
    if (!seededRef.current) {
      seededRef.current = true;
      const localToday = useCircleStore.getState().todayCounts[id];
      const seed = Math.max(localToday && localToday.dateKey === todayKey ? localToday.count : 0, fresh.myTodayCount ?? 0);
      liveCountRef.current = seed;
      setTodayCount(id, todayKey, seed);
    }
    forceRender();
  }, [detailQuery.data, id, setTodayCount, todayKey, upsertCircle]);

  useEffect(() => {
    if (detailQuery.error) {
      console.warn("[circle-session] fetch başarısız", detailQuery.error);
    }
  }, [detailQuery.error]);

  const flush = useCallback(async () => {
    if (!sessionUserId || !detail) {
      return;
    }
    const count = liveCountRef.current;
    if (count === lastFlushedRef.current) {
      return;
    }
    const previousFlushed = lastFlushedRef.current;
    lastFlushedRef.current = count;
    try {
      const response = await createDhikrLog(
        buildCircleLogPayload({ userId: sessionUserId, circle: { id: detail.id, dhikrId: detail.dhikrId, goalCount: detail.goalCount }, count, date: todayKey })
      );
      if (typeof response.circleTotalCount === "number") {
        // mine = sunucunun $max sonrası GERÇEK log sayısı (başka cihaz daha
        // yüksek yazdıysa gönderdiğimizden büyük olabilir), gönderilen değil.
        serverPairRef.current = { total: response.circleTotalCount, mine: response.count ?? count };
        forceRender();
      }
      bumpTotal(id, prevDisplayRef.current);
    } catch (error) {
      // Başarısız flush geri alınır ki bir sonraki tetikte (periyodik flush /
      // kapanış / arka plan) aynı sayı yeniden denensin.
      lastFlushedRef.current = previousFlushed;
      console.warn("[circle-session] log kaydı başarısız", error);
    }
  }, [sessionUserId, detail, todayKey, bumpTotal, id]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useFocusEffect(
    useCallback(() => {
      const flushTimer = setInterval(() => {
        void flushRef.current();
      }, FLUSH_INTERVAL_MS);
      return () => {
        clearInterval(flushTimer);
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      void flushRef.current();
      bumpTotal(id, prevDisplayRef.current);
    };
  }, [bumpTotal, id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "inactive" || nextState === "background") {
        void flushRef.current();
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
    return (
      <PageLayout>
        <PageHeader title="" leftIconName="arrow-left" onPressLeft={() => router.back()} />
      </PageLayout>
    );
  }

  // prevDisplayRef'i ilk render'da (storedCircle mevcutken) bir kez store'daki
  // totalCount ile tohumla — aksi hâlde varsayılan 0'dan başlayıp yeniden
  // girişte gösterilen toplam geriye sıçrardı.
  if (!prevDisplaySeededRef.current) {
    prevDisplaySeededRef.current = true;
    prevDisplayRef.current = storedCircle.totalCount;
  }

  const circleName = storedCircle.name || resolveLocalizedText(storedCircle.dhikr.name, locale);
  const goal = storedCircle.goalCount;

  const onCountPress = () => {
    if (locked) {
      return;
    }
    const next = liveCountRef.current + 1;
    liveCountRef.current = next;
    setTodayCount(id, todayKey, next);
    forceRender();
    fireTapHaptic(hapticsPattern);
    playClickSound(effectiveSoundPack);
    if (next % LAP_SIZE === 0) {
      fireLapHaptic(hapticsPattern);
    }
  };

  const close = () => {
    void flush();
    router.back();
  };

  // İlk fetch gelmeden (serverPair yokken) yerel sayımı toplama katmadan,
  // yalnızca store'daki (zaten monoton) değeri güvenli biçimde gösteririz.
  const displayTotal = serverPairRef.current
    ? computeDisplayTotal(prevDisplayRef.current, serverPairRef.current.total, serverPairRef.current.mine, liveCountRef.current)
    : Math.max(prevDisplayRef.current, storedCircle.totalCount);
  prevDisplayRef.current = displayTotal;
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
      <PageHeader title={circleName} leftIconName="xmark" onPressLeft={close} />

      <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={40}>
        {locked ? (
          <ThemedCard className="mb-4 items-center rounded-2xl px-4 py-6">
            <Text className="mb-4 text-sm text-[--text-muted]">
              {storedCircle.status === "completed" ? t("circle:session.completedNotice") : t("circle:session.closedNotice")}
            </Text>
            <PrimaryCtaButton label={t("circle:session.close")} onPress={close} className="w-full" />
          </ThemedCard>
        ) : (
          <>
            {counterStyle === "tesbih" && isPremium ? (
              <TesbihCounterView model={model} controls="none" />
            ) : (
              <AppleWatchView model={model} controls="none" />
            )}
            <Text className="-mt-4 mb-3 text-center text-xs text-[--text-muted]">
              {t("circle:session.mine", { count: liveCountRef.current })}
            </Text>
          </>
        )}
      </PageScrollView>
    </PageLayout>
  );
}
