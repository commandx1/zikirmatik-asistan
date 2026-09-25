/* global element, by */
// Promo video kaydı: misafir olarak ana sayaca ~12 yavaş dokunuş (Detox `--reuse`
// ile çalıştırılır; uygulama yeniden kurulmaz). Yalnızca apps/promo-video/scripts/record.mjs
// tarafından tetiklenir — normal `pnpm test:detox:ios` bu klasörü atlar (bkz. ../jest.config.js).
const { freshSignIn, visible } = require('../helpers');

const TAP_DELAY_MS = 700;
const TAP_COUNT = 12;

describe('recording: counter', () => {
  it('sayaca yavaşça dokunur', async () => {
    await freshSignIn();
    await visible('e2e-home-counter');
    for (let i = 0; i < TAP_COUNT; i += 1) {
      await element(by.id('e2e-home-counter')).tap();
      await new Promise((r) => setTimeout(r, TAP_DELAY_MS));
    }
  });
});
