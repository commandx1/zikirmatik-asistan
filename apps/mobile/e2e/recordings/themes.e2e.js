/* global element, by, device, waitFor */
// Promo video kaydı: misafir → deep link ile Tema Seçimi ekranı → sırayla birkaç temayı
// dener, her birinde bekler. Yalnızca apps/promo-video/scripts/record.mjs tarafından
// tetiklenir (normal `pnpm test:detox:ios` bu klasörü atlar, bkz. ../jest.config.js).
const { freshSignIn } = require('../helpers');

// testID değerleri src/test-ids.ts ile aynı olmalı.
const SWATCH_ID = 'e2e-theme-swatch';
const SCROLL_ID = 'e2e-theme-scroll';

const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));
const TAP_PAUSE = 700;
// Denenecek tema kartı index'leri (ThemeGridSection sırasına göre).
const SWATCH_INDEXES = [0, 1, 2, 3];

describe('recording: themes', () => {
  it('tema seçimi ekranında birkaç temayı sırayla dener', async () => {
    await freshSignIn();
    await device.openURL({ url: 'zikirmatik://theme-selector' });

    // "Hazır temalar" ızgarası, sayaç görünümü / tık sesi seçicilerin, "Bazı temalar
    // Premium ile açılır" uyarısının ve önizleme kartının altında — ilk ekranda
    // görünmez. Bir tema seçildiğinde ekran otomatik olarak önizlemeyi göstermek için
    // yukarı kayar (screen.tsx: `scrollTo({ y: 70 })`) — bu yüzden HER dokunuştan önce
    // yeniden kaydırmak gerekir. Sabit miktarlı `.scroll()` tek dokunma hareketi başına
    // farklı mesafe kat ediyor (bazen çok az, bazen liste boyunca çok fazla); bunun
    // yerine hedef kart TAM (%100) görünürlük eşiğine ulaşana kadar kaydır — dokunuş da
    // bu eşiği ister.
    for (const idx of SWATCH_INDEXES) {
      await waitFor(element(by.id(SWATCH_ID)).atIndex(idx))
        .toBeVisible(100)
        .whileElement(by.id(SCROLL_ID))
        .scroll(150, 'down');
      await element(by.id(SWATCH_ID)).atIndex(idx).tap();
      await PAUSE(TAP_PAUSE);
    }
  });
});
