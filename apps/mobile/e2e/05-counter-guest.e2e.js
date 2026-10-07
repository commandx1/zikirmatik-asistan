/* global device, element, by, waitFor */
const {
  visible,
  existsText,
  skipTourIfShown,
  waitForHome,
  waitForTextContaining,
  scrollTo,
  scrollToCentered,
  signInWithGoogle,
  openTab,
  tapN,
  sleep,
  resetUserData,
} = require('./helpers');

const count = (re) => waitForTextContaining('e2e-home-count-label', new RegExp(`^${re.source.replace(/^\^|\$$/g, '')}(/\\d+)?$`), 10000);
const toCounter = () => scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
// Esma tablosu hücresi (1 tabanlı sıra): 1 Allah, 2 Er-Rahmân, 3 Er-Rahîm.
const tapEsma = async (n) => {
  const id = `e2e-home-esma-item-${n + 1}`;
  await scrollToCentered(id, 'e2e-home-scroll');
  await element(by.id(id)).tap();
};
const noModal = async (id) => {
  await sleep(800);
  await expect(element(by.id(id))).not.toExist();
};

describe('05 sayaç: misafir kuralları', () => {
  beforeAll(async () => {
    resetUserData();
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await waitForHome();
    await skipTourIfShown();
    await visible('e2e-home-counter');
  });

  it('M-04 sayım 0 iken Kaydet pasif; M-02 1+ sayımda giriş istemi çıkar, sayım korunur', async () => {
    // 0'da Kaydet: dokunuş hiçbir şey açmaz (ne giriş istemi ne ad formu).
    await element(by.id('e2e-home-save')).tap();
    await noModal('e2e-auth-prompt-confirm');
    await expect(element(by.id('e2e-home-save-name-input'))).not.toExist();

    await tapN('e2e-home-counter', 3);
    await count(/^3$/);
    // Misafir Kaydet: yerel zikir adlandırılır, ardından giriş istemi (cihazda kalır) çıkar.
    await element(by.id('e2e-home-save')).tap();
    await visible('e2e-home-save-name-input', 10000);
    await element(by.id('e2e-home-save-name-input')).replaceText('Misafir Zikir');
    await element(by.id('e2e-home-save-name-submit')).tap();
    await visible('e2e-auth-prompt-confirm', 10000);
    await element(by.id('e2e-auth-prompt-cancel')).tap();
    await waitFor(element(by.id('e2e-auth-prompt-confirm'))).not.toExist().withTimeout(5000);
    await count(/^3$/);
  });

  it('M-03 kayıtlı zikirde misafire geçiş uyarısı yok; serbest sayım > 0 iken VAR', async () => {
    // Kayıtlı (kişisel) zikirde 3 sayım → Esma'ya geçiş modalsız, sayım 0.
    await tapEsma(1);
    await noModal('e2e-home-unsaved-cancel');
    await toCounter();
    await count(/^0$/);

    // Serbest moda geç, 3 say, Esma'ya geçerken uyarı çıkar.
    await scrollTo('e2e-home-free-mode', 'e2e-home-scroll', { direction: 'up' });
    await element(by.id('e2e-home-free-mode')).tap();
    await toCounter();
    await tapN('e2e-home-counter', 3);
    await count(/^3$/);
    await tapEsma(1);
    await visible('e2e-home-unsaved-cancel', 10000);
    await element(by.id('e2e-home-unsaved-cancel')).tap();
    await waitFor(element(by.id('e2e-home-unsaved-cancel'))).not.toExist().withTimeout(5000);
    await toCounter();
    await count(/^3$/);

    // Kaydetmeden devam: sayım 0.
    await tapEsma(1);
    await visible('e2e-home-unsaved-discard', 10000);
    await element(by.id('e2e-home-unsaved-discard')).tap();
    await toCounter();
    await count(/^0$/);
  });

  it('M-19 serbest sayım girişte "Serbest" kişisel zikri olarak hesaba taşınır', async () => {
    // Serbest moda dön (seçili zikir sayımı 0 → uyarı yok), 4 say, giriş yap.
    await scrollTo('e2e-home-free-mode', 'e2e-home-scroll', { direction: 'up' });
    await element(by.id('e2e-home-free-mode')).tap();
    await scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
    await tapN('e2e-home-counter', 4);
    await count(/^4$/);

    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('focus');
    await existsText(/^(Serbest|Free).*/, 30000);
  });
});
