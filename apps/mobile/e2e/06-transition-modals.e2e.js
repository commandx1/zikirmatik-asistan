/* global element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  visible,
  scrollTo,
  scrollToCentered,
  waitForTextContaining,
  tapN,
  sleep,
  apiSignIn,
  apiGet,
} = require('./helpers');

// Hedef varsa etiket "3/100" olur.
const count = (re) => waitForTextContaining('e2e-home-count-label', new RegExp(`^${re.source.replace(/^\^|\$$/g, '')}(/\\d+)?$`), 15000);
const toCounter = () => scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
// Esma tablosu hücresi (1 tabanlı sıra): 1 Allah, 2 Er-Rahmân, 3 Er-Rahîm.
const tapEsma = async (n) => {
  const id = `e2e-home-esma-item-${n + 1}`;
  await scrollToCentered(id, 'e2e-home-scroll');
  await element(by.id(id)).tap();
};
const gone = (id, ms = 5000) => waitFor(element(by.id(id))).not.toExist().withTimeout(ms);

describe('06 sayaç: üye geçiş modalları', () => {
  beforeAll(async () => {
    await freshSignIn();
  });

  it('serbest sayım → geçişte modal: vazgeç korur, "kaydet ve devam" ad formunu açıp loglar', async () => {
    await tapN('e2e-home-counter', 3);
    await count(/^3$/);
    await tapEsma(1);
    await visible('e2e-home-unsaved-cancel', 10000);
    await element(by.id('e2e-home-unsaved-cancel')).tap();
    await gone('e2e-home-unsaved-cancel');
    await toCounter();
    await count(/^3$/);

    await tapEsma(1);
    await visible('e2e-home-unsaved-save-continue', 10000);
    await element(by.id('e2e-home-unsaved-save-continue')).tap();
    await visible('e2e-home-save-name-input', 10000);
    await element(by.id('e2e-home-save-name-input')).replaceText('Gecis Zikri');
    await element(by.id('e2e-home-save-target-input')).replaceText('3');
    await element(by.id('e2e-home-save-name-submit')).tap();
    await gone('e2e-home-save-name-input', 10000);
    await toCounter();
    await count(/^0$/);

    const { accessToken } = await apiSignIn();
    const logs = await apiGet('/v1/dhikr-logs', accessToken);
    assert.ok(logs.find((l) => l.count === 3 && l.customDhikrName === 'Gecis Zikri'), JSON.stringify(logs));
  });

  it('0 sayımda geçişte modal yok (M-04); Sıfırla onayı geri alma noktasını da sıfırlar (M-05)', async () => {
    // Esma A (idx1) seçili, sayım 0 → B'ye geçiş modalsız.
    await tapEsma(2);
    await sleep(800);
    await expect(element(by.id('e2e-home-unsaved-cancel'))).not.toExist();
    await toCounter();
    await count(/^0$/);

    await tapN('e2e-home-counter', 3);
    await count(/^3$/);
    await element(by.id('e2e-home-reset')).tap();
    await visible('e2e-home-reset-cancel', 5000);
    // İptal: sayım korunur.
    await element(by.id('e2e-home-reset-cancel')).tap();
    await gone('e2e-home-reset-cancel');
    await count(/^3$/);
    await element(by.id('e2e-home-reset')).tap();
    await visible('e2e-home-reset-confirm', 5000);
    await element(by.id('e2e-home-reset-confirm')).tap();
    await count(/^0$/);

    // Geçiş + geri dönüş: eski sayı geri gelmez.
    await tapEsma(1);
    await sleep(800);
    await expect(element(by.id('e2e-home-unsaved-cancel'))).not.toExist();
    await tapEsma(2);
    await sleep(800);
    await toCounter();
    await count(/^0$/);
  });

  it('Esma "kaldığı yerden" / "sıfırdan başla" (M-06) ve kayıtla geçiş', async () => {
    // Seçili: Esma idx2. 3 say, idx1'e geçerken "kaydet ve devam" (kayıtlı zikir → ad formu yok).
    await toCounter();
    await tapN('e2e-home-counter', 3);
    await count(/^3$/);
    await tapEsma(1);
    await visible('e2e-home-unsaved-save-continue', 10000);
    await element(by.id('e2e-home-unsaved-save-continue')).tap();
    await gone('e2e-home-unsaved-save-continue', 15000);
    await toCounter();
    await count(/^0$/);

    // Geri dön: ilerlemesi (3) olan zikir → devam/sıfırdan modalı.
    await tapEsma(2);
    await visible('e2e-home-resume-continue', 15000);
    await element(by.id('e2e-home-resume-continue')).tap();
    await gone('e2e-home-resume-continue');
    await toCounter();
    await count(/^3$/);

    await tapEsma(1);
    await sleep(800);
    await expect(element(by.id('e2e-home-unsaved-cancel'))).not.toExist();
    await tapEsma(2);
    await visible('e2e-home-resume-fresh', 15000);
    await element(by.id('e2e-home-resume-fresh')).tap();
    await gone('e2e-home-resume-fresh');
    await toCounter();
    await count(/^0$/);
  });

  it('B-49 serbest kaydet formunda çift dokunuş tek kişisel zikir oluşturur', async () => {
    await scrollTo('e2e-home-free-mode', 'e2e-home-scroll', { direction: 'up' });
    await element(by.id('e2e-home-free-mode')).tap();
    await toCounter();
    await tapN('e2e-home-counter', 2);
    await element(by.id('e2e-home-save')).tap();
    await visible('e2e-home-save-name-input', 10000);
    await element(by.id('e2e-home-save-name-input')).replaceText('Cift Dokunus');
    await element(by.id('e2e-home-save-target-input')).replaceText('5');
    await element(by.id('e2e-home-save-name-submit')).multiTap(2);
    await gone('e2e-home-save-name-input', 10000);
    await sleep(2500);

    const { accessToken } = await apiSignIn();
    const mine = await apiGet('/v1/user-dhikrs', accessToken);
    const same = (Array.isArray(mine) ? mine : mine.items ?? []).filter((d) => JSON.stringify(d).includes('Cift Dokunus'));
    assert.equal(same.length, 1, JSON.stringify(mine));
  });
});
