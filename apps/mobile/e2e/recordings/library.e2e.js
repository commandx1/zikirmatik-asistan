/* global element, by, waitFor */
// Promo video kaydı: misafir → Koleksiyonlar → "Günlük" filtresi → bir koleksiyon aç →
// bir zikri sayaca ekle. Yalnızca apps/promo-video/scripts/record.mjs tarafından tetiklenir
// (normal `pnpm test:detox:ios` bu klasörü atlar, bkz. ../jest.config.js).
const { freshSignIn, openTab } = require('../helpers');

// testID değerleri src/test-ids.ts ile aynı olmalı.
const IDS = {
  filterChip: 'e2e-collection-filter-chip',
  card: 'e2e-collection-card',
  addToCounter: 'e2e-collection-add-to-counter',
  detailScroll: 'e2e-collection-detail-scroll',
};

const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));
const TAP_PAUSE = 700;

describe('recording: library', () => {
  it('koleksiyondan bir zikir açar ve sayaca ekler', async () => {
    await freshSignIn();
    await openTab('collections');
    await PAUSE(TAP_PAUSE);

    // "Günlük" filtre çipi (COLLECTION_CATEGORIES: all=0, gunluk=1).
    await element(by.id(IDS.filterChip)).atIndex(1).tap();
    await PAUSE(TAP_PAUSE);

    // Görünen ilk koleksiyon kartı.
    await element(by.id(IDS.card)).atIndex(0).tap();
    await PAUSE(TAP_PAUSE);

    // Koleksiyon detayında ilk zikrin "Sayaca Ekle" düğmesi: ekran boyuna göre
    // katlanabilir, gerekirse kaydır.
    await waitFor(element(by.id(IDS.addToCounter)).atIndex(0))
      .toBeVisible()
      .whileElement(by.id(IDS.detailScroll))
      .scroll(300, 'down');
    await element(by.id(IDS.addToCounter)).atIndex(0).tap();
    await PAUSE(TAP_PAUSE);

    await element(by.id('e2e-home-counter')).tap();
    await PAUSE(TAP_PAUSE);
  });
});
