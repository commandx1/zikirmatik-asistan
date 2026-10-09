/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  settleOverlays,
  dismissBadgeIfShown,
  dismissIfShown,
  dismissNativeReviewPromptIfShown,
  visible,
  existsText,
  openTab,
  scrollTo,
  scrollToCentered,
  waitForTextContaining,
  tapWhenHittable,
  tapN,
  sleep,
  seed,
  mongo,
  ymd,
  setDeviceDate,
  adbRoot,
  apiSignIn,
  apiGet,
  apiPost,
} = require('./helpers');

// Gün dönümü adb saati ister: yalnız Android.
const androidDescribe = device.getPlatform() === 'android' ? describe : describe.skip;
const count = (n) => waitForTextContaining('e2e-home-count-label', new RegExp(`^${n}(/\\d+)?$`), 15000);
const toCounter = () => scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
const selectEsma = async (n) => {
  const id = `e2e-home-esma-item-${n}`;
  await scrollToCentered(id, 'e2e-home-scroll');
  await element(by.id(id)).tap();
};
const afterSave = async () => {
  await dismissBadgeIfShown(8000);
  await dismissIfShown('e2e-notif-offer-dismiss', 6000);
};
const reopen = async () => {
  await relaunch();
  await waitForHome(60000);
  await skipTourIfShown();
  await settleOverlays();
};
const apiLogs = (token) => apiGet('/v1/dhikr-logs', token);
const streakOf = async (me) => (await apiGet(`/v1/streaks/${me.userId}`, me.accessToken)).currentStreak;

let me;

androidDescribe('20 yolculuk 2: üyenin günü (vird, sayaç, istatistik, gün dönümü, seri)', () => {
  beforeAll(async () => {
    adbRoot();
    await freshSignIn();
    me = await apiSignIn();
  });

  afterAll(() => {
    setDeviceDate(0);
  });

  it('sabah virdi: rehberli seans (Sonraki) iki zikri tamamlar, kart "tamamlandı" der', async () => {
    const d = await apiGet('/v1/dhikrs', me.accessToken);
    const list = Array.isArray(d) ? d : d.items;
    const slots = { morning: [{ dhikrId: list[0]._id, target: 2 }, { dhikrId: list[1]._id, target: 2 }] };
    const program = await apiPost('/v1/vird/programs', me.accessToken, {
      title: { tr: 'Gunum Virdi', en: 'Gunum Virdi' },
      kind: 'routine',
      startDate: ymd(),
      phases: [{ fromDay: 1, toDay: null, slots }],
    });
    await apiPost(`/v1/vird/programs/${program._id}/activate`, me.accessToken);
    await reopen();
    await device.openURL({ url: 'zikirmatik://vird' });
    await visible('e2e-vird-hub', 20000);

    await visible('e2e-vird-today-start-morning', 30000);
    await element(by.id('e2e-vird-today-start-morning')).tap();
    await visible('e2e-vird-session', 20000);
    await tapN('e2e-vird-session-counter', 2);
    await element(by.id('e2e-vird-session-next')).tap();
    await tapN('e2e-vird-session-counter', 2);
    await dismissNativeReviewPromptIfShown();
    await visible('e2e-vird-session-finish');
    await tapWhenHittable('e2e-vird-session-finish');
    await dismissNativeReviewPromptIfShown();
    await visible('e2e-vird-today-done', 20000);

    const logs = await apiLogs(me.accessToken);
    assert.equal(logs.reduce((sum, l) => sum + l.count, 0), 4, JSON.stringify(logs));
    assert.equal(await streakOf(me), 1);
  });

  it('ana sayaç: Esma 2 için 3 sayar ve kaydeder; log sunucuda', async () => {
    await reopen();
    await selectEsma(2);
    await toCounter();
    await count(0);
    await tapN('e2e-home-counter', 3);
    await count(3);
    await element(by.id('e2e-home-save')).tap();
    await afterSave();
    await sleep(1500);
    const logs = await apiLogs(me.accessToken);
    assert.ok(logs.some((l) => l.count === 3), JSON.stringify(logs));
    assert.equal(await streakOf(me), 1);
  });

  it('istatistik (premium): toplamlar ve kaynak dağılımı sunucuyla aynı', async () => {
    seed('--premium e2e-user');
    await reopen();
    await openTab('stats');
    await existsText(/^(Kaynak dağılımı|Source breakdown)$/, 30000);
    const summary = await apiGet('/v1/stats/summary', me.accessToken);
    assert.equal(summary.locked, false);
    const total = summary.totals.allTimeCount;
    assert.equal(total, 7);
    const bySource = Object.values(summary.sourceBreakdown).reduce((a, b) => a + b, 0);
    // Kaynak dağılımı zikir adedini sayar (oturum değil): 2 vird + 1 sayaç kaydı, hepsi "elle".
    assert.equal(bySource, total, JSON.stringify(summary.sourceBreakdown));
    assert.equal(summary.sourceBreakdown.manual, total);
    // Toplam kart değeri ekranda.
    await existsText(new RegExp(`^${total}$`), 15000);
    await existsText(/^(Elle|Manual)$/, 15000);
  });

  it('gün dönümü: dünkü kaydedilmemiş sayım sorulur ve kaydedilir; yeni gün sayaç 0', async () => {
    await openTab('home');
    await settleOverlays();
    await toCounter();
    await tapN('e2e-home-counter', 2);
    await count(5);
    try {
      setDeviceDate(1);
      await device.sendToHome();
      await sleep(1500);
      await device.launchApp({ newInstance: false });
      await visible('e2e-home-day-rollover-save', 20000);
      await element(by.id('e2e-home-day-rollover-save')).tap();
      await waitFor(element(by.id('e2e-home-day-rollover-save'))).not.toExist().withTimeout(15000);
      await settleOverlays();
      await toCounter();
      await count(0);
    } finally {
      setDeviceDate(0);
    }
    const logs = await apiLogs(me.accessToken);
    assert.ok(logs.some((l) => l.count === 5 && l.date === ymd(0)), `dünkü kayıt (5) yok: ${JSON.stringify(logs)}`);
  });

  it('seri sürer: dünkü etkinlik + bugünkü kayıt = 2 (sunucu saati gerçek; kayıtlar bir gün geriye alınır)', async () => {
    // Sunucu saati emülatörden bağımsız: önceki günü DB'de "dün" yap, bugünü uygulamadan kaydet.
    mongo(`db.dhikr_logs.updateMany({}, {$set: {date: "${ymd(-1)}"}}); db.streaks.updateMany({}, {$set: {lastCompletedDate: "${ymd(-1)}", lastActiveDate: "${ymd(-1)}"}})`);
    await reopen();
    await toCounter();
    await tapN('e2e-home-counter', 2);
    await element(by.id('e2e-home-save')).tap();
    await afterSave();
    await waitForTextContaining('e2e-home-streak', /(Seri|Streak) 2\b/, 30000);
    assert.equal(await streakOf(me), 2);
  });

  it('etkinlik olmadan günler geçince seri okumada 0; en uzun seri korunur', async () => {
    // Sunucu saati gerçek; son aktif günü 3 gün geriye al (iki gün etkinliksiz).
    mongo(`db.streaks.updateMany({}, {$set: {lastCompletedDate: "${ymd(-3)}", lastActiveDate: "${ymd(-3)}"}})`);
    const streak = await apiGet(`/v1/streaks/${me.userId}`, me.accessToken);
    assert.equal(streak.currentStreak, 0);
    assert.ok(streak.longestStreak >= 2, JSON.stringify(streak));
  });
});
