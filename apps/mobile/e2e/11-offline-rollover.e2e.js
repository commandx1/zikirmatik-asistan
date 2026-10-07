/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  visible,
  exists,
  scrollToCentered,
  scrollTo,
  waitForTextContaining,
  tapN,
  sleep,
  setAirplane,
  adb,
  adbRoot,
  apiSignIn,
  apiGet,
} = require('./helpers');

// Yalnız Android: uçak modu + emülatör saati (adb) gerekir.
const androidIt = device.getPlatform() === 'android' ? it : it.skip;
const count = (n) => waitForTextContaining('e2e-home-count-label', new RegExp(`^${n}(/\\d+)?$`), 15000);
const toCounter = () => scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
const selectEsma = async (n) => {
  const id = `e2e-home-esma-item-${n}`;
  await scrollToCentered(id, 'e2e-home-scroll');
  await element(by.id(id)).tap();
};

// adb shell date: MMDDhhmmYYYY.ss (yerel saat). offsetDays kadar ileri/geri.
const setDeviceDate = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const p = (x) => String(x).padStart(2, '0');
  adb('settings put global auto_time 0');
  adb(`date ${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${d.getFullYear()}.${p(d.getSeconds())}`);
  adb('am broadcast -a android.intent.action.TIME_SET');
};

describe('11 çevrimdışı kayıt + gün dönümü (Android)', () => {
  beforeAll(async () => {
    if (device.getPlatform() === 'android') adbRoot();
    await freshSignIn();
    await selectEsma(2);
    await toCounter();
    await count(0);
  });

  androidIt('B-1 üye çevrimdışı Kaydet: hata bildirimi, sayım korunur; ağ gelince kaydeder', async () => {
    await tapN('e2e-home-counter', 3);
    await count(3);
    await setAirplane(true);
    try {
      await element(by.id('e2e-home-save')).tap();
      await exists('e2e-home-toast', 30000);
      await count(3);
    } finally {
      await setAirplane(false);
    }
    // Ağ geri geldi: elle tekrar Kaydet (bağlantı toparlanana kadar birkaç deneme).
    const { accessToken } = await apiSignIn();
    let saved = false;
    for (let attempt = 0; attempt < 4 && !saved; attempt += 1) {
      await sleep(4000);
      await element(by.id('e2e-home-save')).tap();
      await sleep(3000);
      const logs = await apiGet('/v1/dhikr-logs', accessToken);
      saved = logs.some((l) => l.count === 3);
    }
    assert.ok(saved, 'ağ gelince Kaydet log yazmadı');
    await count(3);
  });

  androidIt('M-01 gün dönümü: dünkü kaydedilmemiş sayım sorulur; "kaydet" sayımı loglar (+ ESM-01 karşılama)', async () => {
    // Kaydedilmemiş yeni sayım ekle (4. dokunuş sonrası 5).
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
    } finally {
      adb('settings put global auto_time 1');
      setDeviceDate(0);
      adb('settings put global auto_time 1');
    }
    // ESM-01: yeni günde günlük Esma karşılaması çıkar.
    await visible('e2e-home-welcome-later', 15000);
    await element(by.id('e2e-home-welcome-later')).tap();
    await toCounter();
    await count(0);
    const { accessToken } = await apiSignIn();
    const logs = await apiGet('/v1/dhikr-logs', accessToken);
    assert.ok(logs.some((l) => l.count === 5), JSON.stringify(logs));
  });
});
