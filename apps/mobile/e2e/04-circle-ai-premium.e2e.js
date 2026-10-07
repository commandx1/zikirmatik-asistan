/* global element, by, waitFor */
const assert = require('node:assert/strict');
const {
  IDS,
  freshSignIn,
  relaunch,
  visible,
  exists,
  existsText,
  tapBack,
  waitForHome,
  scrollTo,
  skipTourIfShown,
  openTab,
  readText,
  seed,
  dismissIfShown,
  apiSignIn,
  apiGet,
  apiPost,
} = require('./helpers');

const openCircleHub = async () => {
  // Günlük Esma "hoş geldin" modalı, tur tamamlandıktan sonra async depolama
  // kontrolüyle gecikmeli açılabilir (skipTourIfShown'ın ilk denemesinden
  // sonra) — ev sayfasını kaydırmadan önce tekrar kontrol et, aksi halde
  // e2e-home-scroll modalın altında kalır ve scrollTo hedefi hiç bulamaz.
  await dismissIfShown(IDS.welcomeLater, 4000);
  await scrollTo('e2e-circle-home-card', 'e2e-home-scroll');
  await element(by.id('e2e-circle-home-card')).tap();
  await exists('e2e-circle-hub');
};

const creditCount = async () => Number.parseInt((await readText('e2e-ai-chat-credits')).replace(/\D+/g, ''), 10);

// Dhikr seç + gönder — create ekranı her zaman picker'ı gösterir; premium kontrolü
// yalnız gönderimde (API CIRCLE_PREMIUM_REQUIRED) devreye girer.
const fillAndSubmitCircleForm = async () => {
  await visible('e2e-circle-pick-dhikr', 10000);
  await element(by.id('e2e-circle-pick-dhikr')).tap();
  await exists('e2e-vird-picker-row', 20000);
  await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
  await element(by.id('e2e-circle-submit')).tap();
};

describe('04 halka + premium + AI sohbet', () => {
  beforeAll(async () => {
    await freshSignIn();
  });

  it('@smoke PRM-01 ücretsiz kullanıcı yeni halkada premium sayfasını görür', async () => {
    // İlk halka artık ücretsiz kullanıcıya da açık (memberLimit 5) — dhikr picker'a
    // doğrudan gidilir, premium sheet görünmez.
    await openCircleHub();
    await element(by.id('e2e-circle-new')).tap();
    await fillAndSubmitCircleForm();

    await visible('e2e-circle-code', 20000);
    // "1/5" — circle:hub.membersCountWithLimit; sayı/limit dilden bağımsız (RegExp).
    // Not: Detox'un native metin eşleştiricisi (Android Espresso withText / iOS predicate)
    // regex'i TAM metne uygular (Pattern.matches) — alt dize değil; ".*" ile tüm metni kapla.
    await existsText(/^1\/5.*/, 20000);

    // İkinci eşzamanlı halka denemesi: detay ekranından hub'a dön (nested stack
    // ekranında tab bar yok → openTab kullanılamaz; PageHeader geri okuna dokun),
    // tekrar "yeni halka" → picker yine açılır (gönderim öncesi kısıtlama yok) ama
    // gönderimde API CIRCLE_PREMIUM_REQUIRED döner → premium sheet açılır.
    await tapBack();
    await exists('e2e-circle-hub');
    await element(by.id('e2e-circle-new')).tap();
    await fillAndSubmitCircleForm();
    await exists('e2e-premium-sheet');
    await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
    await element(by.id('e2e-premium-close')).tap();
    await waitFor(element(by.id('e2e-premium-sheet'))).not.toExist().withTimeout(10000);

    // Temizlik: Home'daki CircleCard aktif bir halka varken "e2e-circle-home-card"
    // yerine testID'siz "devam et" kartına döner (bkz. circle-card.tsx) — bu
    // testID'siz buton için UI'da güvenilir bir dokunma yolu yok, bu yüzden
    // halkayı API üzerinden kapatıyoruz ki sonraki testlerin openCircleHub()'ı
    // (boş durum kartı → e2e-circle-home-card) çalışmaya devam etsin.
    const auth = await apiSignIn();
    const mine = await apiGet('/v1/circles', auth.accessToken);
    const createdCircle = (Array.isArray(mine) ? mine : []).find((c) => c.status === 'active');
    if (createdCircle) {
      await apiPost(`/v1/circles/${createdCircle.id}/close`, auth.accessToken);
    }
  });

  it('premium olunca halka kurar ve 8 haneli kod görür', async () => {
    seed('--premium e2e-user');
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();

    await openCircleHub();
    // isPremium açılışta /v1/users'tan tazelenir; sayfa açılırsa bir kez daha dene.
    await element(by.id('e2e-circle-new')).tap();
    try {
      await visible('e2e-circle-pick-dhikr', 10000);
    } catch {
      console.warn('[04] isPremium açılışta henüz yansımamıştı; yeniden denendi');
      await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
      await element(by.id('e2e-premium-close')).tap();
      await element(by.id('e2e-circle-new')).tap();
      await visible('e2e-circle-pick-dhikr', 10000);
    }

    await element(by.id('e2e-circle-pick-dhikr')).tap();
    await exists('e2e-vird-picker-row', 20000);
    await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
    await element(by.id('e2e-circle-submit')).tap();

    await visible('e2e-circle-code', 20000);
    const code = await readText('e2e-circle-code');
    assert.match(code, /^[A-Z0-9]{8}$/);
  });

  it('AI Rehber öneri verir; AI sohbette mock yanıt alır ve kredi düşer', async () => {
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await openTab('aiGuide');
    // AI Rehber tek-atım öneri: mock runtime + düz find retrieval ($vectorSearch yok).
    await visible('e2e-ai-guide-input');
    await element(by.id('e2e-ai-guide-input')).replaceText('Sabah huzur için zikir öner');
    await element(by.id('e2e-ai-guide-send')).tap();
    await waitFor(element(by.id('e2e-ai-guide-recommendation')).atIndex(0)).toExist().withTimeout(45000);

    // Ekran sonuçlara kayar ve klavye açık kalabilir → sohbet girişi yukarıda; alttan yukarı kaydır.
    await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
    await element(by.id('e2e-ai-chat-entry')).tap();

    await visible('e2e-ai-chat-credits', 20000);
    const before = await creditCount();

    await element(by.id('e2e-ai-chat-input')).replaceText('Sabah için ne okuyayım?');
    await element(by.id('e2e-ai-chat-send')).tap();
    await waitFor(element(by.id('e2e-ai-chat-assistant-message')).atIndex(0)).toExist().withTimeout(30000);
    await expect(element(by.id('e2e-ai-chat-assistant-message')).atIndex(0)).toHaveText('Mock yanıt.');

    // Kredi rozeti Pressable: getAttributes metni accessibilityLabel'dan gelir ("Kalan kredi: N").
    let after = before;
    for (const deadline = Date.now() + 20000; Date.now() < deadline && after !== before - 1; ) {
      await new Promise((r) => setTimeout(r, 500));
      after = await creditCount();
    }
    assert.equal(after, before - 1);
  });
});
