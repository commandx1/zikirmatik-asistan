/* global element, by */
const { freshSignIn, visible, exists, scrollTo } = require('./helpers');

const tapN = async (id, n) => {
  for (let i = 0; i < n; i += 1) await element(by.id(id)).tap();
};

describe('03 vird: manuel program + rehberli seans', () => {
  beforeAll(async () => {
    await freshSignIn();
  });

  it('manuel program kurar, sabah seansını tamamlar, kartta tamamlandı görünür', async () => {
    await scrollTo('e2e-vird-empty-cta', 'e2e-home-scroll');
    await element(by.id('e2e-vird-empty-cta')).tap();

    await visible('e2e-vird-hub');
    await element(by.id('e2e-vird-new-manual')).tap();

    await visible('e2e-vird-editor-title');
    await element(by.id('e2e-vird-editor-title')).replaceText('E2E Vird');

    // Varsayılan dilimler sabah + akşam; yalnız sabaha 2 zikir ekle (akşam boş → programda yok).
    await element(by.id('e2e-vird-slot-add-morning')).tap();
    await exists('e2e-vird-picker-row', 20000);
    await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
    await element(by.id('e2e-vird-picker-row')).atIndex(1).tap();
    await element(by.id('e2e-vird-picker-done')).tap();

    // Hedefleri 2'ye indir: seansta az tap.
    await exists('e2e-vird-item-target');
    await element(by.id('e2e-vird-item-target')).atIndex(0).replaceText('2');
    await element(by.id('e2e-vird-item-target')).atIndex(1).replaceText('2');

    await scrollTo('e2e-vird-save-and-start', 'e2e-vird-editor-scroll');
    await element(by.id('e2e-vird-save-and-start')).tap();

    // Kaydet → hub; bugünkü kart sabah satırıyla.
    await visible('e2e-vird-today-start-morning', 30000);
    await element(by.id('e2e-vird-today-start-morning')).tap();

    await visible('e2e-vird-session');
    await tapN('e2e-vird-session-counter', 2);
    await element(by.id('e2e-vird-session-next')).tap();
    await tapN('e2e-vird-session-counter', 2);

    await visible('e2e-vird-session-finish');
    await element(by.id('e2e-vird-session-finish')).tap();

    await visible('e2e-vird-today-done', 20000);
  });
});
