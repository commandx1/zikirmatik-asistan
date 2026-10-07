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
  return apiPost('/v1/circles', host.accessToken, { dhikrId, goalCount, name: `E2E Halka ${goalCount}` });
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

describe('07 halka: iki üye', () => {
  beforeAll(async () => {
    host = await apiSignInAs('e2e-host', 'Kurucu Hesap');
    await freshSignIn();
    me = await apiSignIn();
  });

  it('kodla katılır; oturumda sayım toplamı artırır, hedefe ulaşınca sayaç kilitlenir (M-11)', async () => {
    const circle = await newCircle(5);
    await joinInApp(circle.code);
    await existsText(/^2\/5.*/, 20000);
    await openSession();
    await tapN('e2e-circle-session-counter', 3);
    await waitForTextContaining('e2e-circle-session-count-label', /^3/, 10000);
    await tapN('e2e-circle-session-counter', 2);
    await visible('e2e-circle-session-locked', 15000);

    await sleep(3500); // son gönderim
    const detail = await apiGet(`/v1/circles/${circle.id}`, host.accessToken);
    assert.equal(detail.totalCount, 5);
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
    'çevrimdışı oturumda sayım kaybolmaz; ağ gelince toplama eklenir',
    async () => {
      const circle = await newCircle(100);
      await joinInApp(circle.code);
      await openSession();
      await setAirplane(true);
      try {
        await tapN('e2e-circle-session-counter', 3);
        await sleep(4000); // flush denemesi başarısız olur
      } finally {
        await setAirplane(false);
      }
      await sleep(8000); // bağlantı + sonraki flush
      const detail = await apiGet(`/v1/circles/${circle.id}`, host.accessToken);
      assert.equal(detail.totalCount, 3);
    },
  );
});
