/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  visible,
  exists,
  scrollTo,
  sleep,
  apiSignIn,
  apiGet,
  apiPost,
  apiRequest,
  mongo,
} = require('./helpers');

let me;
let dhikrId;
const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const programs = () => apiGet('/v1/vird/programs', me.accessToken);
async function clearPrograms() {
  for (const p of await programs()) {
    await apiRequest('DELETE', `/v1/vird/programs/${p._id}`, { token: me.accessToken });
  }
}
async function seedProgram(title, kind = 'routine') {
  const slots = { morning: [{ dhikrId, target: 3 }] };
  const phases = [{ fromDay: 1, toDay: kind === 'journey' ? 3 : null, slots }];
  return apiPost('/v1/vird/programs', me.accessToken, { title: { tr: title, en: title }, kind, startDate: today(), phases });
}
// Programı API ile hazırladıktan sonra uygulama yeniden başlatılır (hidrasyon) ve hub açılır.
async function openHubFresh() {
  await relaunch();
  await waitForHome(60000);
  await skipTourIfShown();
  await device.openURL({ url: 'zikirmatik://vird' });
  await visible('e2e-vird-hub', 20000);
}

describe('08 vird: ücretsiz sınırlar, çakışma, şablon', () => {
  beforeAll(async () => {
    await freshSignIn();
    me = await apiSignIn();
    const d = await apiGet('/v1/dhikrs', me.accessToken);
    dhikrId = (Array.isArray(d) ? d : d.items)[0]._id;
  });

  it('B-21 çakışma modalı "duraklat ve başlat": eski aktif duraklar, yeni aktifleşir', async () => {
    await clearPrograms();
    const a = await seedProgram('Program A');
    await apiPost(`/v1/vird/programs/${a._id}/activate`, me.accessToken);
    const b = await seedProgram('Program B');
    await openHubFresh();
    await exists('e2e-vird-program-toggle', 20000);
    await element(by.id('e2e-vird-program-toggle')).atIndex(0).tap();
    await visible('e2e-vird-swap-pause-and-start', 10000);
    await element(by.id('e2e-vird-swap-pause-and-start')).tap();
    await waitFor(element(by.id('e2e-vird-swap-pause-and-start'))).not.toExist().withTimeout(15000);
    await sleep(1500);
    const list = await programs();
    assert.equal(list.find((p) => p._id === b._id).status, 'active');
    assert.equal(list.find((p) => p._id === a._id).status, 'paused');
    assert.equal(list.filter((p) => p.status === 'active').length, 1);
  });

  it('M-22 duraklatılmış programı düzenleyip kaydetmek durumu paused bırakır', async () => {
    const paused = (await programs()).find((p) => p.status === 'paused');
    assert.ok(paused);
    await device.openURL({ url: `zikirmatik://vird/editor?programId=${paused._id}` });
    await visible('e2e-vird-editor-title', 20000);
    await element(by.id('e2e-vird-editor-title')).replaceText('Program A (duzenlendi)');
    await scrollTo('e2e-vird-save-and-start', 'e2e-vird-editor-scroll');
    await element(by.id('e2e-vird-save-and-start')).tap();
    await visible('e2e-vird-hub', 20000);
    await sleep(1500);
    // Çakışma modalı açılmadı; durum paused kaldı.
    await expect(element(by.id('e2e-vird-swap-pause-and-start'))).not.toExist();
    const after = (await programs()).find((p) => p._id === paused._id);
    assert.equal(after.status, 'paused');
    assert.equal(after.title.tr, 'Program A (duzenlendi)');
  });

  it('A-23 süresi dolmuş yolculuk: aktifleştirme hata verir, "kopyala ve yeniden başlat" editörü açar', async () => {
    await clearPrograms();
    const j = await seedProgram('Eski Yolculuk', 'journey');
    mongo(`db.vird_programs.updateOne({_id: ObjectId("${j._id}")}, {$set: {endDate: "2020-01-03", startDate: "2020-01-01"}})`);
    await openHubFresh();
    await exists('e2e-vird-program-toggle', 20000);
    await element(by.id('e2e-vird-program-toggle')).atIndex(0).tap();
    await exists('e2e-vird-program-clone-restart', 15000);
    await element(by.id('e2e-vird-program-clone-restart')).tap();
    await visible('e2e-vird-editor-title', 20000);
  });

  it('şablondan kurulum: ücretsiz şablon aktifleşir, premium şablon paywall açar', async () => {
    await clearPrograms();
    await openHubFresh();
    await element(by.id('e2e-vird-templates-entry')).tap();
    await exists('e2e-vird-template-card-klasik-sabah', 20000);
    await element(by.id('e2e-vird-template-card-klasik-sabah')).tap();
    await visible('e2e-vird-template-start', 20000);
    await element(by.id('e2e-vird-template-start')).tap();
    await visible('e2e-vird-hub', 20000);
    await sleep(1500);
    const list = await programs();
    assert.equal(list.length, 1);
    assert.equal(list[0].templateKey, 'klasik-sabah');
    assert.equal(list[0].status, 'active');

    await device.openURL({ url: 'zikirmatik://vird/template/esma-33-gun' });
    // 33 günlük şablon: "Programı başlat" uzun sayfanın altında.
    await exists('e2e-vird-template-start', 20000);
    await waitFor(element(by.id('e2e-vird-template-start')))
      .toBeVisible()
      .whileElement(by.type('com.facebook.react.views.scroll.ReactScrollView'))
      .scroll(400, 'down', NaN, 0.5);
    await element(by.id('e2e-vird-template-start')).tap();
    await exists('e2e-premium-sheet', 15000);
    await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
    await element(by.id('e2e-premium-close')).tap();
  });
});
