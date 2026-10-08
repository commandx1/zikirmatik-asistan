/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  visible,
  exists,
  existsText,
  readText,
  scrollTo,
  waitForTextContaining,
  dismissIfShown,
  tapN,
  sleep,
  setAirplane,
  ymd,
  apiSignIn,
  apiSignInAs,
  apiGet,
  apiPost,
} = require('./helpers');

const GOAL = 20;
let me;
let m2;
let m3;
let circle;

// Kontroller ekran dışındaysa oturum kaydırıcısında görünene kadar kaydır.
const scrollIntoView = (id) =>
  waitFor(element(by.id(id))).toBeVisible().whileElement(by.id('e2e-circle-session-scroll')).scroll(150, 'down');

// Bekleyen 0 olana kadar "Gönder"e basar (ilk deneme bağlantı gecikmesiyle başarısız olabilir).
async function sendAndWaitPendingZero() {
  for (let i = 0; i < 4; i += 1) {
    await scrollIntoView('e2e-circle-send');
    await element(by.id('e2e-circle-send')).tap();
    try {
      await waitForTextContaining('e2e-circle-pending-count', /: 0$/, 6000);
      return;
    } catch {
      await sleep(2000);
    }
  }
  throw new Error('Gönder sonrası bekleyen 0 olmadı');
}

// Katkı gün başına kümülatif (monoton): verilen sayı üyenin o günkü TOPLAMI.
const circleLog = (member, count) =>
  apiPost('/v1/dhikr-logs', member.accessToken, {
    userId: member.userId,
    dhikrId: circle.dhikrId,
    count,
    targetCount: GOAL,
    date: ymd(),
    source: 'circle',
    circleId: circle.id,
    isCompleted: false,
  });
const detail = () => apiGet(`/v1/circles/${circle.id}`, me.accessToken);

async function waitForTotal(total, ms = 20000) {
  const deadline = Date.now() + ms;
  let last = -1;
  while (Date.now() < deadline) {
    last = (await detail()).totalCount;
    if (last === total) return;
    await sleep(500);
  }
  throw new Error(`halka toplamı ${total} olmadı; son: ${last}`);
}

describe('20 yolculuk 3: üç kişilik halka', () => {
  beforeAll(async () => {
    await freshSignIn();
    me = await apiSignIn();
    m2 = await apiSignInAs('e2e-j3-member2', 'Uye Iki');
    m3 = await apiSignInAs('e2e-j3-member3', 'Uye Uc');
  });

  it('@smoke kurucu halka kurar (ücretsiz 1/5); iki üye kodla katılır', async () => {
    await dismissIfShown('e2e-home-welcome-later', 4000);
    await scrollTo('e2e-circle-home-card', 'e2e-home-scroll');
    await element(by.id('e2e-circle-home-card')).tap();
    await visible('e2e-circle-new', 20000);
    await element(by.id('e2e-circle-new')).tap();
    await visible('e2e-circle-pick-dhikr', 10000);
    await element(by.id('e2e-circle-pick-dhikr')).tap();
    await exists('e2e-vird-picker-row', 20000);
    await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
    await element(by.id('e2e-circle-goal-input')).replaceText(String(GOAL));
    await element(by.id('e2e-circle-submit')).tap();
    await visible('e2e-circle-code', 20000);
    await existsText(/^1\/5.*/, 20000);
    const code = await readText('e2e-circle-code');
    assert.match(code, /^[A-Z0-9]{8}$/);

    const mine = (await apiGet('/v1/circles', me.accessToken)).find((c) => c.status === 'active');
    assert.equal(mine.code, code);
    assert.equal(mine.memberLimit, 5);
    assert.equal(mine.goalCount, GOAL);
    circle = mine;

    await apiPost('/v1/circles/join', m2.accessToken, { code });
    await apiPost('/v1/circles/join', m3.accessToken, { code });
    assert.equal((await detail()).memberCount, 3);
  });

  it('oturum: dua metni görünür; Gönder toplamı günceller; Toplamı yenile birleşik toplamı gösterir', async () => {
    await element(by.id('e2e-circle-session-start')).tap();
    await visible('e2e-circle-session-counter', 20000);
    await sleep(2500); // M-12: sayaç ilk detay gelene kadar pasif
    await exists('e2e-circle-dhikr-text', 10000);

    await tapN('e2e-circle-session-counter', 3);
    await waitForTextContaining('e2e-circle-pending-count', /(Gönderilmeyi bekleyen|Waiting to be sent): 3$/, 10000);
    // Periyodik otomatik gönderim yok.
    await sleep(6000);
    assert.equal((await detail()).totalCount, 0);
    await sendAndWaitPendingZero();
    await waitForTotal(3);

    await circleLog(m2, 4);
    await circleLog(m3, 5);
    await scrollIntoView('e2e-circle-refresh');
    await element(by.id('e2e-circle-refresh')).tap();
    await waitForTextContaining('e2e-circle-session-count-label', /^12/, 15000);
  });

  (device.getPlatform() === 'android' ? it : it.skip)(
    'çevrimdışı: Gönder hata verir, bekleyen korunur; ağ gelince gönderilir',
    async () => {
      await setAirplane(true);
      try {
        await tapN('e2e-circle-session-counter', 2);
        await scrollIntoView('e2e-circle-send');
        await element(by.id('e2e-circle-send')).tap();
        await visible('e2e-circle-session-notice', 15000);
        await waitForTextContaining('e2e-circle-pending-count', /: 2$/, 10000);
      } finally {
        await setAirplane(false);
      }
      await sleep(6000);
      await sendAndWaitPendingZero();
      await waitForTotal(14);
    },
  );

  it('hedefe ulaşınca sayaç kilitlenir ve halka tamamlanır; sonradan gelen katkı kabul edilir (A-01)', async () => {
    await circleLog(m3, 8); // 5 -> 8: toplama +3
    await scrollIntoView('e2e-circle-refresh');
    await element(by.id('e2e-circle-refresh')).tap();
    await waitForTextContaining('e2e-circle-session-count-label', /^17/, 15000);
    await tapN('e2e-circle-session-counter', 3);
    await visible('e2e-circle-session-locked', 15000);
    await waitForTotal(GOAL);
    assert.equal((await detail()).status, 'completed');

    await circleLog(m2, 5); // 4 -> 5: hedef sonrası +1
    await waitForTotal(GOAL + 1);
  });

  it('kurucu halkayı kapatır: üyenin geç katkısı reddedilir', async () => {
    // Tamamlanan halka aktif sayılmaz; kurucu yeni (2.) halka açar, üye katılır.
    const dhikrId = circle.dhikrId;
    const second = await apiPost('/v1/circles', me.accessToken, { dhikrId, goalCount: 50, name: 'Yolculuk Halka 2' });
    await apiPost('/v1/circles/join', m2.accessToken, { code: second.code });
    await element(by.id('e2e-circle-session-close')).tap();
    await device.openURL({ url: `zikirmatik://circle/${second.id}` });
    await exists('e2e-circle-close', 30000);
    await element(by.id('e2e-circle-close')).tap();
    await exists('e2e-circle-close-confirm', 10000);
    await element(by.id('e2e-circle-close-confirm')).tap();
    await sleep(2000);
    assert.equal((await apiGet(`/v1/circles/${second.id}`, me.accessToken)).status, 'closed');

    await assert.rejects(
      apiPost('/v1/dhikr-logs', m2.accessToken, {
        userId: m2.userId,
        dhikrId,
        count: 2,
        targetCount: 50,
        date: ymd(),
        source: 'circle',
        circleId: second.id,
        isCompleted: false,
      }),
      /403/,
    );
    assert.equal((await apiGet(`/v1/circles/${second.id}`, me.accessToken)).totalCount, 0);
  });
});
