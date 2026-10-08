import { beforeEach, describe, expect, it } from "vitest";
import type { BackendDhikrLog } from "../features/dhikrs/services/dhikr-logs-api-client";
import type { ZikirItem } from "../features/focus/types";
import { ZIKIR_ITEMS } from "./dhikr-catalog-seed";
import { refreshSeedEnglish, useDhikrStore } from "./dhikr-store";
import { registerDhikrStoreText } from "./dhikr-store-text";

registerDhikrStoreText({
  saved: () => "Kayıtlı",
  notStarted: () => "Henüz başlanmadı",
  todayAt: () => "Bugün",
  lowercase: (value) => value.toLocaleLowerCase("tr-TR")
});

const personal = (over: Partial<ZikirItem> = {}): ZikirItem => ({
  id: "p1",
  source: "personal",
  name: "Kişisel",
  transliteration: "Kişisel",
  current: 0,
  target: 10,
  lastActivityLabel: "Henüz başlanmadı",
  streakDays: 0,
  isFavorite: false,
  ...over
});

const get = () => useDhikrStore.getState();
const item = (id: string) => get().items.find((value) => value.id === id);

beforeEach(() => {
  useDhikrStore.setState({
    items: [],
    selectedDhikrId: "",
    activeAiContext: undefined,
    freeModeCount: 0,
    freeModeTarget: 0,
    freeModeLapSize: 33,
    activeDayKeys: [],
    lifetimeCount: 0,
    unsavedProgressDhikrIds: [],
    unsavedProgressSnapshots: {},
    isHydratedFromBackend: false,
    lastSavedBackendLog: undefined,
    syncError: undefined
  });
});

describe("hedef ve tur boyu sınırları", () => {
  it("hedef 1..100000 aralığına kırpılır; sayı olmayan hedef 33'e düşer; mevcut sayım yeni hedefi aşamaz", () => {
    useDhikrStore.setState({ items: [personal({ current: 8 })], selectedDhikrId: "p1" });
    get().setSelectedTarget(5);
    expect(item("p1")).toMatchObject({ target: 5, current: 5 });
    get().setSelectedTarget(Number.NaN);
    expect(item("p1")!.target).toBe(33);
    get().setSelectedTarget(10_000_000);
    expect(item("p1")!.target).toBe(100_000);
    get().setSelectedTarget(-4);
    expect(item("p1")!.target).toBe(1);
  });

  it("tur boyu 1..9999 aralığında; geçersiz değer 33", () => {
    useDhikrStore.setState({ items: [personal()], selectedDhikrId: "p1" });
    get().setSelectedLapSize(100_000);
    expect(item("p1")!.lapSize).toBe(9999);
    get().setSelectedLapSize(0);
    expect(item("p1")!.lapSize).toBe(1);
    get().setSelectedLapSize(Number.NaN);
    expect(item("p1")!.lapSize).toBe(33);
    get().setFreeModeLapSize(12.9);
    expect(get().freeModeLapSize).toBe(12);
  });

  it("serbest mod hedefi: 0/negatif/NaN hedefsiz; hedef düşünce sayım hedefe kırpılır", () => {
    useDhikrStore.setState({ freeModeCount: 50 });
    get().setFreeModeTarget(20);
    expect(get()).toMatchObject({ freeModeTarget: 20, freeModeCount: 20 });
    get().setFreeModeTarget(-1);
    expect(get().freeModeTarget).toBe(0);
    get().setFreeModeTarget(Number.NaN);
    expect(get().freeModeTarget).toBe(0);
    expect(get().freeModeCount).toBe(20);
  });
});

describe("serbest mod sayacı", () => {
  it("hedefe ulaşınca durur (no-op), sonrasında lifetime artmaz", () => {
    useDhikrStore.setState({ freeModeTarget: 2 });
    get().incrementFreeMode();
    get().incrementFreeMode();
    get().incrementFreeMode();
    expect(get()).toMatchObject({ freeModeCount: 2, lifetimeCount: 2 });
    expect(get().activeDayKeys).toHaveLength(1);
  });

  it("reset ve clearFreeModeSession sayımı sıfırlar; clear hedefi de siler", () => {
    useDhikrStore.setState({ freeModeCount: 5, freeModeTarget: 9, freeModeActivityAt: "x" });
    get().resetFreeMode();
    expect(get()).toMatchObject({ freeModeCount: 0, freeModeTarget: 9, freeModeActivityAt: undefined });
    useDhikrStore.setState({ freeModeCount: 5 });
    get().clearFreeModeSession();
    expect(get().freeModeTarget).toBe(0);
  });
});

describe("seçim ve kişisel zikir yaşam döngüsü", () => {
  it("katalogda olmayan id fallback olmadan seçilemez; fallback ile eklenir; önerilen hedef kırpılarak uygulanır", () => {
    useDhikrStore.setState({ items: [personal({ current: 8 })] });
    get().selectDhikr("ghost");
    expect(get().selectedDhikrId).toBe("");
    get().selectDhikr("ghost", undefined, { fallback: personal({ id: "ghost", current: 0 }), target: 500_000 });
    expect(get().selectedDhikrId).toBe("ghost");
    expect(item("ghost")!.target).toBe(100_000);
    get().selectDhikr("p1", { prompt: "p", assistantNote: "n", recommendationId: "r" } as never, { target: 3 });
    expect(item("p1")).toMatchObject({ target: 3, current: 3 });
    expect(get().activeAiContext).toMatchObject({ dhikrId: "p1", prompt: "p" });
    get().selectDhikr("p1", undefined, { target: 0 });
    expect(item("p1")!.target).toBe(3);
    expect(get().activeAiContext).toBeUndefined();
  });

  it("addCustomDhikr: boş ad no-op ve mevcut seçimi döner; sayım ve hedef kırpılır; boş okunuş addan türer", () => {
    useDhikrStore.setState({ selectedDhikrId: "keep" });
    expect(get().addCustomDhikr({ name: "   " } as never)).toBe("keep");
    const id = get().addCustomDhikr({ name: " Şükür Zikri ", initialCount: -3.7, target: -5 } as never);
    expect(id).toMatch(/^personal-sukur-zikri-/);
    expect(item(id)).toMatchObject({ name: "Şükür Zikri", transliteration: "Şükür Zikri", current: 0, target: 0, lastActivityAt: undefined });
    const second = get().addCustomDhikr({ name: "A", id: " fixed ", initialCount: 4.9, target: 1_000_000, meaning: " m ", arabicOrPronunciation: " ع " } as never);
    expect(second).toBe("fixed");
    expect(item("fixed")).toMatchObject({ current: 4, target: 100_000, meaning: "m", arabic: "ع", lastActivityLabel: "Bugün" });
    expect(item("fixed")!.lastActivityAt).toBeTypeOf("string");
    expect(get().addCustomDhikr({ name: "!!!" } as never)).toMatch(/^personal-zikir-/);
  });

  it("upsertPersonalDhikr: yeni kayıt başa eklenir; var olan güncellenir, hedefsiz kalır, etkinlik zamanı korunur", () => {
    get().upsertPersonalDhikr(personal({ id: "n1", current: 2.8, target: 0 }) as never);
    expect(item("n1")).toMatchObject({ current: 2, target: 0 });
    useDhikrStore.setState({ items: [personal({ lastActivityAt: "2026-01-01T00:00:00Z", isFavorite: true })] });
    get().upsertPersonalDhikr(personal({ current: 50, target: 20, isFavorite: undefined as never, lastActivityLabel: undefined as never }) as never);
    expect(item("p1")).toMatchObject({
      current: 20,
      target: 20,
      lastActivityAt: "2026-01-01T00:00:00Z",
      isFavorite: true,
      lastActivityLabel: "Henüz başlanmadı"
    });
  });

  it("removePersonalDhikr: hazır zikir silinemez; silinen seçili/AI bağlamı temizler", () => {
    useDhikrStore.setState({
      items: [personal(), personal({ id: "r1", source: "ready" }), personal({ id: "p2" })],
      selectedDhikrId: "p1",
      activeAiContext: { dhikrId: "p1" } as never
    });
    get().removePersonalDhikr("r1");
    get().removePersonalDhikr("missing");
    expect(get().items).toHaveLength(3);
    get().removePersonalDhikr("p2");
    expect(get().selectedDhikrId).toBe("p1");
    get().removePersonalDhikr("p1");
    expect(get()).toMatchObject({ selectedDhikrId: "", activeAiContext: undefined });
  });

  it("clearDhikrProgress / startNewDay başka seçimi ve AI bağlamını bozmaz, ilgili geri yükleme noktasını siler", () => {
    useDhikrStore.setState({
      items: [personal({ current: 4 }), personal({ id: "p2", current: 6 })],
      selectedDhikrId: "p2",
      activeAiContext: { dhikrId: "p2" } as never,
      unsavedProgressDhikrIds: ["p1"],
      unsavedProgressSnapshots: { p1: { current: 1, target: 10, lastActivityLabel: "x" } }
    });
    get().clearDhikrProgress("p1");
    expect(get()).toMatchObject({ selectedDhikrId: "p2", unsavedProgressDhikrIds: [] });
    expect(item("p1")!.current).toBe(0);
    useDhikrStore.setState({ unsavedProgressDhikrIds: ["p2"], unsavedProgressSnapshots: { p2: { current: 1, target: 10, lastActivityLabel: "x" } } });
    get().startNewDay("p2");
    expect(item("p2")!.current).toBe(0);
    expect(get().unsavedProgressSnapshots).toEqual({});
    get().clearDhikrProgress("p2");
    expect(get().selectedDhikrId).toBe("");
  });

  it("markPersonalUnsaved yalnız kişisel zikre uygulanır ve 0 sayımı geri yükleme noktası yapar", () => {
    useDhikrStore.setState({ items: [personal({ current: 5 }), personal({ id: "r1", source: "ready" })] });
    get().markPersonalUnsaved("r1");
    get().markPersonalUnsaved("none");
    expect(get().unsavedProgressDhikrIds).toEqual([]);
    get().markPersonalUnsaved("p1");
    expect(get().unsavedProgressSnapshots.p1!.current).toBe(0);
  });
});

describe("sayaç uç durumları", () => {
  it("seçili zikir yokken sayaç işlemleri sessizce hiçbir şey yapmaz", () => {
    useDhikrStore.setState({ items: [personal()], selectedDhikrId: "" });
    get().incrementSelected();
    get().resetSelected();
    get().setSelectedCount(5);
    get().setSelectedTarget(9);
    expect(get()).toMatchObject({ lifetimeCount: 0, activeDayKeys: [], unsavedProgressDhikrIds: [] });
  });

  it("hedefsiz zikir sınırsız artar; hedefli zikir hedefte durur ve fazla basış lifetime'ı artırmaz", () => {
    useDhikrStore.setState({ items: [personal({ target: 0 }), personal({ id: "p2", target: 1 })], selectedDhikrId: "p1" });
    get().incrementSelected();
    get().incrementSelected();
    expect(item("p1")!.current).toBe(2);
    useDhikrStore.setState({ selectedDhikrId: "p2" });
    get().incrementSelected();
    get().incrementSelected();
    expect(item("p2")!.current).toBe(1);
    expect(get().lifetimeCount).toBe(3);
  });

  it("setSelectedCount: negatif 0'a, hedefi aşan hedefe kırpılır; azaltma lifetime'ı düşürmez", () => {
    useDhikrStore.setState({ items: [personal({ current: 4, target: 10 }), personal({ id: "p2", target: 0 })], selectedDhikrId: "p1" });
    get().setSelectedCount(99);
    expect(item("p1")!.current).toBe(10);
    expect(get().lifetimeCount).toBe(6);
    get().setSelectedCount(-3);
    expect(item("p1")!.current).toBe(0);
    expect(get().lifetimeCount).toBe(6);
    useDhikrStore.setState({ selectedDhikrId: "p2" });
    get().setSelectedCount(7.9);
    expect(item("p2")!.current).toBe(7);
  });

  it("resetSelected geri yükleme noktasını sıfır durumuna koyar (vazgeçince eski sayım dönmez)", () => {
    useDhikrStore.setState({ items: [personal({ current: 9 })], selectedDhikrId: "p1" });
    get().resetSelected();
    get().discardUnsavedProgress("p1");
    expect(item("p1")!.current).toBe(0);
  });

  it("discardUnsavedProgress: anlık görüntü yoksa yalnız işareti temizler; varsa sayımı geri yükler", () => {
    useDhikrStore.setState({ items: [personal({ current: 8 })], unsavedProgressDhikrIds: ["p1"] });
    get().discardUnsavedProgress("p1");
    expect(item("p1")!.current).toBe(8);
    expect(get().unsavedProgressDhikrIds).toEqual([]);
    useDhikrStore.setState({
      unsavedProgressDhikrIds: ["p1"],
      unsavedProgressSnapshots: { p1: { current: 2, target: 5, lastActivityLabel: "eski", lastActivityAt: "t" } }
    });
    get().discardUnsavedProgress("p1");
    expect(item("p1")).toMatchObject({ current: 2, target: 5, lastActivityLabel: "eski", lastActivityAt: "t" });
  });

  it("toggleFavorite yalnız ilgili zikri çevirir; selectedSource ayarlanıp temizlenir", () => {
    useDhikrStore.setState({ items: [personal(), personal({ id: "p2" })] });
    get().toggleFavorite("p1");
    get().toggleFavorite("p1");
    get().toggleFavorite("p2");
    expect(item("p1")!.isFavorite).toBe(false);
    expect(item("p2")!.isFavorite).toBe(true);
    get().setSelectedSource("ai" as never);
    expect(get().selectedSource).toBe("ai");
    get().clearSelectedDhikr();
    expect(get().selectedSource).toBeUndefined();
  });
});

describe("sunucudan birleştirme (hydrate)", () => {
  const backendReady = (over: Record<string, unknown> = {}) => ({
    id: "r1",
    name: { tr: "Ad" },
    transliteration: { tr: "Ad" },
    arabic: "ع",
    target: 33,
    ...over
  });

  it("hydrateReadyItems: boş liste yalnız hazır bayrağını açar; hedef kırpılır; seçim kaybolursa temizlenir", () => {
    useDhikrStore.setState({ items: [personal()], selectedDhikrId: "p1" });
    get().hydrateReadyItems([]);
    expect(get()).toMatchObject({ isHydratedFromBackend: true, items: [personal()] });
    useDhikrStore.setState({ selectedDhikrId: "gone", activeAiContext: { dhikrId: "gone" } as never });
    get().hydrateReadyItems([backendReady({ target: 9_999_999, current: 500 })] as never);
    expect(item("r1")).toMatchObject({ target: 100_000, current: 500 });
    expect(get()).toMatchObject({ selectedDhikrId: "", activeAiContext: undefined });
  });

  it("hydrateReadyItems: kaydedilmemiş yerel ilerleme ve hedef korunur; AI bağlamı eksik alanları doldurur", () => {
    useDhikrStore.setState({
      items: [personal({ id: "r1", source: "ready", current: 12, target: 20, lastActivityAt: "yerel" })],
      selectedDhikrId: "r1",
      activeAiContext: { dhikrId: "r1", prompt: "P", assistantNote: "N", recommendationId: "R" } as never,
      unsavedProgressDhikrIds: ["r1"]
    });
    get().hydrateReadyItems([backendReady({ current: 1, target: 5, lastActivityAt: "sunucu", isFavorite: true })] as never);
    expect(item("r1")).toMatchObject({
      current: 12,
      target: 20,
      lastActivityAt: "yerel",
      aiPrompt: "P",
      aiAssistantNote: "N",
      aiRecommendationId: "R",
      isFavorite: true
    });
    expect(get().activeAiContext).toBeDefined();
  });

  it("hydrateReadyItems: yerel etiket ve favori sunucuda yoksa korunur", () => {
    useDhikrStore.setState({ items: [personal({ id: "r1", source: "ready", lastActivityLabel: "yerel etiket", isFavorite: true, current: 4 })] });
    get().hydrateReadyItems([backendReady()] as never);
    expect(item("r1")).toMatchObject({ lastActivityLabel: "yerel etiket", isFavorite: true, current: 4 });
  });

  it("hydratePersonalItems: sunucu sayımı uygulanır; kaydedilmemiş yerel kayıt sunucuda yoksa silinmez; hazırlar korunur", () => {
    useDhikrStore.setState({
      items: [
        personal({ id: "local-only", current: 3 }),
        personal({ id: "dirty", current: 9, target: 12 }),
        personal({ id: "clean", current: 1 }),
        personal({ id: "r1", source: "ready" })
      ],
      unsavedProgressDhikrIds: ["local-only", "dirty"]
    });
    get().hydratePersonalItems([
      { id: "dirty", name: " D ", transliteration: " d ", current: 1, target: 3 },
      { id: "clean", name: "C", transliteration: "c", current: 7.9, target: 0, arabic: "  ", meaning: " m ", isFavorite: true },
      { id: "fresh", name: "F", transliteration: "f", target: 5 }
    ] as never);
    const ids = get().items.map((value) => value.id);
    expect(ids).toEqual(["dirty", "clean", "fresh", "local-only", "r1"]);
    expect(item("dirty")).toMatchObject({ name: "D", current: 9, target: 12 });
    expect(item("clean")).toMatchObject({ current: 7, target: 0, arabic: undefined, meaning: "m", isFavorite: true });
    expect(item("fresh")).toMatchObject({ current: 0, lastActivityLabel: "Henüz başlanmadı" });
  });

  it("hydratePersonalItems: hedefli kayıtta sunucu sayımı hedefe kırpılır", () => {
    get().hydratePersonalItems([{ id: "x", name: "X", transliteration: "x", current: 50, target: 10 }] as never);
    expect(item("x")!.current).toBe(10);
  });
});

describe("applySavedBackendLog", () => {
  const log = (over: Partial<BackendDhikrLog> = {}) =>
    ({ userId: "u", date: "2026-09-17", count: 5, targetCount: 10, ...over }) as BackendDhikrLog;

  it("customDhikrId ile eşleşir; AI alanlarını işler; kaydedilen gün aktif gün olur", () => {
    useDhikrStore.setState({ items: [personal({ current: 5 })], unsavedProgressDhikrIds: ["p1"] });
    get().applySavedBackendLog(log({ customDhikrId: "p1", aiPrompt: "q", aiAssistantNote: "a", aiRecommendationId: "r" }));
    expect(item("p1")).toMatchObject({ aiPrompt: "q", aiAssistantNote: "a", aiRecommendationId: "r" });
    expect(get().unsavedProgressDhikrIds).toEqual([]);
    expect(get().activeDayKeys).toEqual(["2026-09-17"]);
  });

  it("kayıt uçuştayken sayım ilerlediyse zikir kaydedilmemiş kalır; yeni geri yükleme noktası kaydedilen sayım", () => {
    useDhikrStore.setState({ items: [personal({ current: 8 })] });
    get().applySavedBackendLog(log({ dhikrId: "p1", count: 5 }));
    expect(get().unsavedProgressSnapshots.p1!.current).toBe(5);
  });

  it("vird/halka logu ana sayacı ve kaydedilmemiş durumu etkilemez; 0 sayım aktif gün eklemez; bozuk tarih bugüne düşer", () => {
    useDhikrStore.setState({ items: [personal({ current: 8 })], unsavedProgressDhikrIds: ["p1"] });
    get().applySavedBackendLog(log({ dhikrId: "p1", count: 0, virdProgramId: "v" }));
    expect(get().unsavedProgressDhikrIds).toEqual(["p1"]);
    expect(get().activeDayKeys).toEqual([]);
    get().applySavedBackendLog(log({ dhikrId: "p1", count: 3, circleId: "c", date: "bozuk" as never }));
    expect(get().activeDayKeys).toHaveLength(1);
    expect(get().activeDayKeys[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("hedef zikir kimliği yoksa öğeler değişmez", () => {
    useDhikrStore.setState({ items: [personal()] });
    get().applySavedBackendLog(log());
    expect(item("p1")!.aiPrompt).toBeUndefined();
    expect(get().lastSavedBackendLog).toBeDefined();
  });
});

describe("oturum sıfırlama", () => {
  it("resetSessionScoped sayaç/aktif gün/sayaç geçmişini temizler", () => {
    useDhikrStore.setState({ items: [personal()], lifetimeCount: 9, activeDayKeys: ["2026-01-01"], isHydratedFromBackend: true, syncError: "x" });
    get().setSyncError("hata");
    get().resetSessionScoped();
    expect(get()).toMatchObject({ lifetimeCount: 0, activeDayKeys: [], isHydratedFromBackend: false, syncError: undefined });
    expect(get().items.length).toBeGreaterThan(0);
    expect(get().items.every((value) => value.source === "ready")).toBe(true);
  });
});

describe("kalıcılık geçişleri", () => {
  const options = () =>
    useDhikrStore.persist.getOptions() as { migrate: (state: unknown, version: number) => Record<string, unknown>; partialize: (s: unknown) => Record<string, unknown> };

  it("partialize geçici alanları (hydrate bayrağı, son log, hata) kalıcılaştırmaz", () => {
    const persisted = options().partialize(get());
    expect(Object.keys(persisted)).not.toContain("isHydratedFromBackend");
    expect(Object.keys(persisted)).not.toContain("syncError");
    expect(Object.keys(persisted)).not.toContain("lastSavedBackendLog");
    expect(Object.keys(persisted)).toContain("unsavedProgressSnapshots");
  });

  it("v0: nameTurkish → LocalizedText (hazır) / düz metin (kişisel); geçersiz adlar güvenli varsayılana düşer; obje olmayan öğeler atılır", () => {
    const out = options().migrate(
      {
        items: [
          { id: "a", source: "ready", nameTurkish: "Ad", transliteration: "tr", meaning: "m", virtue: "v", contentSource: "k", current: 3 },
          { id: "b", source: "personal", nameTurkish: "Kişisel" },
          { id: "c", source: "ready" },
          { id: "d", source: "personal", name: 5 },
          "çöp",
          null
        ],
        freeModeCount: 2
      },
      0
    ) as { items: Record<string, unknown>[]; lifetimeCount: number; activeDayKeys: string[] };
    expect(out.items).toHaveLength(4);
    expect(out.items[0]).toMatchObject({ name: { tr: "Ad" }, transliteration: { tr: "tr" }, meaning: { tr: "m" }, virtue: { tr: "v" }, contentSource: { tr: "k" } });
    expect(out.items[0]).not.toHaveProperty("nameTurkish");
    expect(out.items[1]!.name).toBe("Kişisel");
    expect(out.items[2]!.name).toEqual({ tr: "", en: "" });
    expect(out.items[3]!.name).toBe("");
    expect(out.lifetimeCount).toBe(5);
  });

  it("v2: aktif gün anahtarları lastActivityAt ve serbest mod izinden türetilir; bozuk değerler atlanır", () => {
    const stamp = new Date().toISOString();
    const out = options().migrate(
      { items: [{ lastActivityAt: stamp, current: 4 }, { lastActivityAt: 5 }, null], freeModeCount: 3, freeModeActivityAt: stamp },
      2
    ) as { activeDayKeys: string[]; lifetimeCount: number };
    expect(out.activeDayKeys).toHaveLength(1);
    expect(out.lifetimeCount).toBe(7);
    const noFree = options().migrate({ items: [], freeModeCount: 0, freeModeActivityAt: stamp }, 2) as { activeDayKeys: string[] };
    expect(noFree.activeDayKeys).toEqual([]);
  });

  it("v3: yalnız lifetimeCount türetilir; sayı olmayan/negatif/sonsuz değerler 0 sayılır; v4+ aynen geçer", () => {
    const out = options().migrate({ items: [{ current: -5 }, { current: Infinity }, { current: "x" }, { current: 2.9 }], freeModeCount: "a" }, 3) as { lifetimeCount: number };
    expect(out.lifetimeCount).toBe(2);
    const same = { items: [] };
    expect(options().migrate(same, 5)).toBe(same);
    expect(options().migrate(same, 4)).toEqual(same);
    expect(options().migrate(null, 3)).toMatchObject({ lifetimeCount: 0 });
  });

  it("migrasyon patlarsa boş items ile devam eder (veri kaybı değil çökme engellenir)", () => {
    const hostileItem = { get source(): never { throw new Error("boom"); } };
    expect(options().migrate({ items: [hostileItem], freeModeCount: 1 }, 0)).toMatchObject({ items: [], freeModeCount: 1 });
    expect(options().migrate(undefined, 1)).toMatchObject({ items: [] });
  });

  it("refreshSeedEnglish: yalnız hazır seed öğelerinin en alanını günceller; kişisel/bilinmeyen öğeye ve eksik alanlara dokunmaz; hata atmaz", () => {
    const seed = ZIKIR_ITEMS.find((value) => value.source === "ready")!;
    const state = {
      items: [
        { ...seed, name: { tr: "özel", en: "eski" }, transliteration: "düz", meaning: undefined },
        { id: seed.id + "-x", source: "ready", name: { tr: "a", en: "b" } },
        { id: "p", source: "personal", name: "k" },
        null
      ]
    };
    const out = refreshSeedEnglish(state as never) as unknown as { items: Record<string, unknown>[] };
    const seedName = seed.name as { en?: string };
    expect((out.items[0]!.name as { tr: string; en?: string }).tr).toBe("özel");
    expect((out.items[0]!.name as { en?: string }).en).toBe(seedName.en);
    expect(out.items[0]!.transliteration).toBe("düz");
    expect(out.items[1]).toEqual(state.items[1]);
    expect(out.items[2]).toBe(state.items[2]);
    expect(out.items[3]).toBeNull();
    const noItems = { foo: 1 };
    expect(refreshSeedEnglish(noItems as never)).toBe(noItems);
    const hostile = { get items(): never { throw new Error("x"); } };
    expect(refreshSeedEnglish(hostile as never)).toBe(hostile);
  });
});
