/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  settleOverlays,
  visible,
  exists,
  existsText,
  openTab,
  scrollTo,
  waitForTextContaining,
  sleep,
  seed,
  ymd,
  apiSignIn,
  apiSignInAs,
  apiGet,
  apiPost,
} = require('./helpers');

const reopen = async () => {
  await relaunch();
  await waitForHome(60000);
  await skipTourIfShown();
  await settleOverlays();
};
// Profildeki dil satırı MEVCUT dilin adını gösterir ("English" / "Türkçe"); dokununca diğerine geçer.
async function ensureLanguage(target) {
  const current = target === 'en' ? 'Türkçe' : 'English';
  await openTab('profile');
  await scrollTo('e2e-profile-language', 'e2e-profile-scroll');
  try {
    await existsText(new RegExp(`^${current}$`), 3000);
  } catch {
    return; // zaten hedef dilde
  }
  await element(by.id('e2e-profile-language')).tap();
  await existsText(new RegExp(`^${target === 'en' ? 'English' : 'Türkçe'}$`), 10000);
}

describe('20 yolculuk 6: İngilizce kullanıcı', () => {
  let me;
  beforeAll(async () => {
    await freshSignIn();
    seed('--premium e2e-user');
    me = await apiSignIn();
    // Halka katkısı: istatistikte "Circle/Halka" kaynağı için.
    const host = await apiSignInAs('e2e-j6-host', 'Host');
    const d = await apiGet('/v1/dhikrs', host.accessToken);
    const dhikrId = (Array.isArray(d) ? d : d.items)[0]._id;
    const circle = await apiPost('/v1/circles', host.accessToken, { dhikrId, goalCount: 100, name: 'J6 Circle' });
    await apiPost('/v1/circles/join', me.accessToken, { code: circle.code });
    await apiPost('/v1/dhikr-logs', me.accessToken, {
      userId: me.userId,
      dhikrId,
      count: 4,
      targetCount: 100,
      date: ymd(),
      source: 'circle',
      circleId: circle.id,
      isCompleted: false,
    });
    await reopen(); // premium + katkı yansısın
  });

  it('Türkçe\'ye geçince ana ekran Türkçe; İngilizce\'ye dönüp yeniden başlatınca kalıcı', async () => {
    await ensureLanguage('tr');
    await openTab('home');
    await waitForTextContaining('e2e-home-streak', /Seri/, 15000);
    await existsText(/^Er-Rahmân$/, 15000);

    await ensureLanguage('en');
    await reopen();
    await openTab('home');
    await waitForTextContaining('e2e-home-streak', /Streak/, 15000);
    await existsText(/^Ar-Rahman$/, 15000);
  });

  it('istatistik: kaynak dağılımı "Circle", bölüm başlıkları İngilizce', async () => {
    await openTab('stats');
    await existsText(/^Source breakdown$/, 30000);
    await existsText(/^Circle$/, 15000);
    await existsText(/^Total dhikr$/, 15000);
  });

  it('vird şablonları İngilizce adla listelenir', async () => {
    await device.openURL({ url: 'zikirmatik://vird/templates' });
    await exists('e2e-vird-template-card-klasik-sabah', 30000);
    await existsText(/^Morning Dhikrs$/, 15000);
  });

  it('AI sohbet İngilizce: atıf "pp." biçiminde; hata mesajı İngilizce; Rehber zikir adları İngilizce', async () => {
    await reopen();
    await openTab('aiGuide');
    await exists('e2e-ai-guide-input', 20000);
    await element(by.id('e2e-ai-guide-input')).replaceText('Calm morning dhikr please');
    await element(by.id('e2e-ai-guide-send')).tap();
    await waitFor(element(by.id('e2e-ai-guide-recommendation')).atIndex(0)).toExist().withTimeout(60000);
    await existsText(/.*Days of Rajab.*/, 15000);
    await existsText(/^Recommended target: \d+$/, 15000);

    await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
    await element(by.id('e2e-ai-chat-entry')).tap();
    await visible('e2e-ai-chat-input', 20000);
    await element(by.id('e2e-ai-chat-input')).replaceText('[mock:bilgi] what is dhikr?');
    await element(by.id('e2e-ai-chat-send')).tap();
    await waitFor(element(by.id('e2e-ai-chat-assistant-message')).atIndex(0)).toExist().withTimeout(45000);
    await existsText(/^Mock Kaynak, pp\. 12-13$/, 15000);
    await element(by.id('e2e-ai-chat-input')).replaceText('[mock:error503] again');
    await element(by.id('e2e-ai-chat-send')).tap();
    await existsText(/.*wasn't charged.*/, 60000);
    await sleep(500);
    assert.equal(typeof (await apiGet('/v1/ai/credits', me.accessToken)).balance, 'number');
  });
});
