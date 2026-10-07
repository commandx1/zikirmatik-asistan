/* global device, element, by */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  visible,
  exists,
  sleep,
  seed,
  apiSignIn,
  apiGet,
  apiPost,
  apiRequest,
} = require('./helpers');

let me;
let dhikrId;
const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const programs = () => apiGet('/v1/vird/programs', me.accessToken);
const clearPrograms = async () => {
  for (const p of await programs()) await apiRequest('DELETE', `/v1/vird/programs/${p._id}`, { token: me.accessToken });
};
const seedProgram = (title) =>
  apiPost('/v1/vird/programs', me.accessToken, {
    title: { tr: title, en: title },
    kind: 'routine',
    startDate: today(),
    phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId, target: 3 }] } }],
  });
const openHubFresh = async () => {
  await relaunch();
  await waitForHome(60000);
  await skipTourIfShown();
  await device.openURL({ url: 'zikirmatik://vird' });
  await visible('e2e-vird-hub', 20000);
};

describe('13 vird: premium + AI ile oluşturma', () => {
  beforeAll(async () => {
    await freshSignIn();
    seed('--premium e2e-user');
    me = await apiSignIn();
    const d = await apiGet('/v1/dhikrs', me.accessToken);
    dhikrId = (Array.isArray(d) ? d : d.items)[0]._id;
  });

  it('B-20 AI vird: önizlemede Vazgeç taslak bırakmaz; Başlat programı aktifleştirir', async () => {
    await clearPrograms();
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await device.openURL({ url: 'zikirmatik://vird/ai-create' });
    await visible('e2e-vird-ai-free-text', 20000);
    await element(by.id('e2e-vird-ai-free-text')).replaceText('Huzur için sabah virdi');
    await element(by.id('e2e-vird-ai-submit')).tap();
    await exists('e2e-vird-ai-discard', 90000);
    await exists('e2e-vird-ai-start', 20000);
    await element(by.id('e2e-vird-ai-discard')).tap();
    await sleep(2500);
    assert.equal((await programs()).length, 0, 'Vazgeç taslak program bırakmamalı');

    await device.openURL({ url: 'zikirmatik://vird/ai-create' });
    await visible('e2e-vird-ai-free-text', 20000);
    await element(by.id('e2e-vird-ai-free-text')).replaceText('Huzur için akşam virdi');
    await element(by.id('e2e-vird-ai-submit')).tap();
    await exists('e2e-vird-ai-start', 90000);
    await element(by.id('e2e-vird-ai-start')).tap();
    await sleep(4000);
    const list = await programs();
    assert.equal(list.length, 1);
    assert.equal(list[0].status, 'active');
    assert.equal(list[0].source, 'ai');
  });

  it('premium: ikinci program çakışma modalı olmadan da aktifleşir (B-22)', async () => {
    await clearPrograms();
    const a = await seedProgram('Prem A');
    await apiPost(`/v1/vird/programs/${a._id}/activate`, me.accessToken);
    await seedProgram('Prem B');
    await openHubFresh();
    await exists('e2e-vird-program-toggle', 20000);
    await element(by.id('e2e-vird-program-toggle')).atIndex(0).tap();
    await sleep(2500);
    await expect(element(by.id('e2e-vird-swap-pause-and-start'))).not.toExist();
    const list = await programs();
    assert.equal(list.filter((p) => p.status === 'active').length, 2);
  });
});
