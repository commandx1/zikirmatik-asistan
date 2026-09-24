/* global device, element, by, waitFor */
const { visible, waitForHome, signInWithGoogle, continueAsGuest, skipTourIfShown, openTab, relaunch, TAB_IDS } = require('./helpers');

describe('01 giriş + onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
  });

  it('Google (mock) ile giriş yapar, turu geçer, profilde adı gösterir', async () => {
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('profile');
    await waitFor(element(by.id('e2e-profile-name')))
      .toHaveText('E2E Kullanıcı')
      .withTimeout(20000);
  });

  it('yeniden başlatınca oturum korunur', async () => {
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await visible(TAB_IDS.home);
    await expect(element(by.id('e2e-auth-google'))).not.toExist();
  });

  it('misafir olarak devam eder', async () => {
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await continueAsGuest();
    await skipTourIfShown();
    await expect(element(by.id(TAB_IDS.home))).toBeVisible();
  });
});
