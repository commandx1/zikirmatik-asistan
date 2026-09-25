/* global element, by */
// Promo video kaydı: misafir → Koleksiyonlar → bir koleksiyon → bir zikir aç → sayaca ekle.
// Yalnızca apps/promo-video/scripts/record.mjs tarafından tetiklenir.
//
// BİLİNEN SINIR: collection-card.tsx ve koleksiyon detayındaki zikir satırları hiçbir
// testID taşımıyor (apps/mobile/src'ye dokunmadan eklenemedi — bu görevin kısıtı).
// Bu yüzden ilk kart/satır seçimi `atIndex(0)` ile en görünür Pressable eşleşmesine
// dayanıyor; bu, testID'li akışlar kadar sağlam değildir ve gelecekte küçük bir UI
// değişikliğiyle kırılabilir. "Sayaca Ekle" düğmesi gerçek, sabit metin olduğu için
// güvenilir. Bu spec canlı simülatörde doğrulanmadı (bkz. README-short.md "scripted
// pipeline" notu) — pilot-04 klibi bunun yerine kanıtlanmış Quartz manuel yöntemiyle
// çekildi.
const { freshSignIn, openTab, visible } = require('../helpers');

const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));

describe('recording: library', () => {
  it('koleksiyondan bir zikir açar ve sayaca ekler', async () => {
    await freshSignIn();
    await openTab('collections');
    await PAUSE(700);

    // İlk koleksiyon kartı: testID yok, ekrandaki ilk Pressable'a dokun.
    await element(by.type('RCTView')).atIndex(0).tap();
    await PAUSE(900);

    // Koleksiyon detayında ilk zikir satırı.
    await element(by.text(/Sayaca Ekle/)).atIndex(0).tap();
    await PAUSE(1200);
    await visible('e2e-home-counter');
    await PAUSE(1000);
  });
});
