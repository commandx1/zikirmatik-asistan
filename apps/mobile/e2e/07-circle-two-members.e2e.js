/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  visible,
  exists,
  existsText,
  waitForTextContaining,
  tapN,
  sleep,
  setAirplane,
  apiSignIn,
  apiSignInAs,
  apiGet,
  apiPost,
} = require('./helpers');

let host;
let me;

const circleLink = (code) => device.openURL({ url: `zikirmatik://circle/join?code=${code}` });

// Kurucu (2. hesap) API ile halka açar; ücretsiz kurucu 1 aktif halka → öncekini kapatır.
async function newCircle(goalCount) {
  const mine = await apiGet('/v1/circles', host.accessToken);
  for (const c of mine.filter((item) => item.status === 'active')) {
    await apiPost(`/v1/circles/${c.id}/close`, host.accessToken);
  }
  const dhikrs = await apiGet('/v1/dhikrs', host.accessToken);
  const dhikrId = (Array.isArray(dhikrs) ? dhikrs : dhikrs.items)[0]._id;
  const created = await apiPost('/v1/circles', host.accessToken, { dhikrId, goalCount, name: `E2E Halka ${goalCount}` });
  return { ...created, dhikrId };
}

async function joinInApp(code) {
  await circleLink(code);
  await visible('e2e-circle-join-cta', 20000);
  await element(by.id('e2e-circle-join-cta')).tap();
  await exists('e2e-circle-session-start', 20000);
}

async function openSession() {
  await element(by.id('e2e-circle-session-start')).tap();
  await visible('e2e-circle-session-counter', 20000);
  // M-12: sayaç ilk detay gelene kadar pasif; seed'in oturması için kısa bekleme.
  await sleep(2500);
}

// Bekleyen göstergesi 0 olana kadar "Gönder"e basar (ilk deneme bağlantı gecikmesiyle başarısız olabilir).
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

async function tapRefresh() {
  await scrollIntoView('e2e-circle-refresh');
  await element(by.id('e2e-circle-refresh')).tap();
}

// Kontroller ekran dışındaysa oturum kaydırıcısında görünene kadar kaydır.
async function scrollIntoView(id) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .whileElement(by.id('e2e-circle-session-scroll'))
    .scroll(150, 'down');
}

// Kurucu (2. üye) halkaya API ile katkı gönderir.
async function hostLog(circle, count) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  await apiPost('/v1/dhikr-logs', host.accessToken, {
    userId: host.userId,
    dhikrId: circle.dhikrId,
    count,
    targetCount: circle.goalCount,
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    source: 'circle',
    circleId: circle.id,
    isCompleted: false,
  });
}

async function waitForTotal(circle, total, ms = 20000) {
  const deadline = Date.now() + ms;
  let last = -1;
  while (Date.now() < deadline) {
    last = (await apiGet(`/v1/circles/${circle.id}`, host.accessToken)).totalCount;
    if (last === total) return;
    await sleep(500);
  }
  throw new Error(`halka toplamı ${total} olmadı; son: ${last}`);
}

describe('07 halka: iki üye', () => {
  beforeAll(async () => {
    await freshSignIn();
    me = await apiSignIn();
    // freshSignIn kullanıcıları sıfırlar: kurucu SONRA oluşturulur (yoksa userId geçersiz kalır).
    host = await apiSignInAs('e2e-host', 'Kurucu Hesap');
  });

  it('oturum modeli: dua metni görünür; dokunuş bekleyene yazılır, Gönder toplamı günceller; ikinci üye gönderir, Toplamı yenile birleşik toplamı gösterir; çıkış otomatik gönderir', async () => {
    const circle = await newCircle(100);
    await joinInApp(circle.code);
    await existsText(/^2\/5.*/, 20000);
    await openSession();
    // Zikrin Arapçası/okunuşu/anlamı oturum ekranında (ana sayaçtaki gibi).
    await exists('e2e-circle-dhikr-text', 10000);

    await tapN('e2e-circle-session-counter', 3);
    await waitForTextContaining('e2e-circle-session-count-label', /^3/, 10000);
    await waitForTextContaining('e2e-circle-pending-count', /(Gönderilmeyi bekleyen|Waiting to be sent): 3$/, 10000);
    // Periyodik otomatik gönderim yok: bekleme sonrası sunucu toplamı hâlâ 0.
    await sleep(7000);
    assert.equal((await apiGet(`/v1/circles/${circle.id}`, host.accessToken)).totalCount, 0);

    await sendAndWaitPendingZero();
    assert.equal((await apiGet(`/v1/circles/${circle.id}`, host.accessToken)).totalCount, 3);
    await waitForTextContaining('e2e-circle-session-count-label', /^3/, 10000);

    // İkinci üye (kurucu) katkı gönderir; ilk üye "Toplamı yenile" ile birleşik toplamı görür.
    await hostLog(circle, 4);
    await tapRefresh();
    await waitForTextContaining('e2e-circle-session-count-label', /^7/, 15000);

    // Çıkış (kapat) bekleyen sayımı otomatik gönderir.
    await tapN('e2e-circle-session-counter', 2);
    await waitForTextContaining('e2e-circle-pending-count', /: 2$/, 10000);
    await element(by.id('e2e-circle-session-close')).tap();
    await waitForTotal(circle, 9);
  });

  it('hedefe ulaşınca sayaç kilitlenir ve son sayım hemen gönderilir (M-11)', async () => {
    const circle = await newCircle(5);
    await joinInApp(circle.code);
    await existsText(/^2\/5.*/, 20000);
    await openSession();
    await tapN('e2e-circle-session-counter', 3);
    await waitForTextContaining('e2e-circle-session-count-label', /^3/, 10000);
    await tapN('e2e-circle-session-counter', 2);
    await visible('e2e-circle-session-locked', 15000);
    await waitForTotal(circle, 5);
    const detail = await apiGet(`/v1/circles/${circle.id}`, host.accessToken);
    assert.equal(detail.status, 'completed');
  });

  it('kurucu halkayı kapatınca sayaç kilitlenir', async () => {
    const circle = await newCircle(100);
    await joinInApp(circle.code);
    await openSession();
    await tapN('e2e-circle-session-counter', 1);
    await apiPost(`/v1/circles/${circle.id}/close`, host.accessToken);
    await visible('e2e-circle-session-locked', 20000);
    await existsText(/.*(has been closed|kapatıldı|kapandı).*/, 5000);
  });

  it('kapalı/süresi dolmuş halkaya katılma: notActive mesajı, Katıl pasif', async () => {
    const circle = await newCircle(50);
    await apiPost(`/v1/circles/${circle.id}/close`, host.accessToken);
    await circleLink(circle.code);
    await visible('e2e-circle-join-cta', 20000);
    await existsText(/.*(no longer active|artık aktif değil).*/, 10000);
    await element(by.id('e2e-circle-join-cta')).tap();
    await sleep(1500);
    await expect(element(by.id('e2e-circle-session-start'))).not.toExist();
    const mine = await apiGet('/v1/circles', me.accessToken);
    assert.ok(!mine.some((c) => c.id === circle.id));
  });

  it('B-36 bilinmeyen halka kimliği derin bağlantısı "bulunamadı" gösterir', async () => {
    await device.openURL({ url: 'zikirmatik://circle/000000000000000000000000' });
    await exists('e2e-circle-not-found', 20000);
  });

  it('ücretsiz 5 üye limiti: 6. üye "halka dolu" görür (CIRCLE_FULL)', async () => {
    const circle = await newCircle(50);
    for (let i = 1; i <= 4; i += 1) {
      const member = await apiSignInAs(`e2e-member-${i}`, `Üye ${i}`);
      await apiPost('/v1/circles/join', member.accessToken, { code: circle.code });
    }
    await circleLink(circle.code);
    await visible('e2e-circle-join-cta', 20000);
    await element(by.id('e2e-circle-join-cta')).tap();
    await existsText(/.*(circle is full|halka dolu).*/, 15000);
  });

  it('üye halkadan ayrılır; liste/üyelik temizlenir', async () => {
    const circle = await newCircle(50);
    await joinInApp(circle.code);
    await element(by.id('e2e-circle-leave')).tap();
    await visible('e2e-circle-leave-confirm', 10000);
    await element(by.id('e2e-circle-leave-confirm')).tap();
    await waitFor(element(by.id('e2e-circle-leave'))).not.toExist().withTimeout(15000);
    const mine = await apiGet('/v1/circles', me.accessToken);
    assert.ok(!mine.some((c) => c.id === circle.id));
  });

  (device.getPlatform() === 'android' ? it : it.skip)(
    'çevrimdışı oturumda sayım kaybolmaz: Gönder hata gösterir, bekleyen korunur; ağ gelince toplama eklenir',
    async () => {
      const circle = await newCircle(100);
      await joinInApp(circle.code);
      await openSession();
      await setAirplane(true);
      try {
        await tapN('e2e-circle-session-counter', 3);
        await scrollIntoView('e2e-circle-send');
        await element(by.id('e2e-circle-send')).tap();
        await visible('e2e-circle-session-notice', 15000);
        await waitForTextContaining('e2e-circle-pending-count', /: 3$/, 10000);
      } finally {
        await setAirplane(false);
      }
      await sleep(6000); // bağlantı dönsün
      await sendAndWaitPendingZero();
      await waitForTotal(circle, 3);
    },
  );
});
