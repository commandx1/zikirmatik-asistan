/* global element, by, waitFor */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
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
  tapN,
  mongo,
  apiSignIn,
  apiSignInAs,
  apiGet,
  apiPost,
} = require('./helpers');

let me;
const START = /^(Başla|Start)$/;
const balance = async () => (await apiGet('/v1/ai/credits', me.accessToken)).balance;
const waitBalance = async (expected, ms = 15000) => {
  const deadline = Date.now() + ms;
  let last;
  while (Date.now() < deadline) {
    last = await balance();
    if (last === expected) return;
    await sleep(700);
  }
  assert.equal(last, expected);
};
const gone = (id, ms = 10000) => waitFor(element(by.id(id))).not.toExist().withTimeout(ms);
const openGuide = async () => {
  await openTab('aiGuide');
  await exists('e2e-ai-guide-input', 20000);
};
const openChat = async () => {
  await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
  await element(by.id('e2e-ai-chat-entry')).tap();
  await visible('e2e-ai-chat-input', 20000);
};
const tapStart = async () => {
  // Birincil öneri kartındaki "Başla" (günlük Esma kısayolunda da bir "Başla" var).
  const start = element(by.text(START).withAncestor(by.id('e2e-ai-guide-recommendation'))).atIndex(0);
  await waitFor(start).toExist().withTimeout(20000);
  for (let i = 0; ; i += 1) {
    try {
      await start.tap();
      return;
    } catch (err) {
      if (i >= 6) throw err;
      await element(by.id('e2e-ai-guide-scroll')).scroll(200, 'down', NaN, 0.5);
    }
  }
};
const setTarget = async (value) => {
  await element(by.id('e2e-home-target-button')).tap();
  await exists('e2e-home-target-input', 10000);
  await element(by.id('e2e-home-target-input')).replaceText(value);
  await element(by.id('e2e-home-target-submit')).tap();
};
const countLabel = (re, ms = 10000) => waitForTextContaining('e2e-home-count-label', re, ms);
const aiPayload = (freeText) => ({ userId: me.userId, freeText, flowId: randomUUID() });

describe('20 yolculuk 5: AI kullanıcısı', () => {
  beforeAll(async () => {
    await freshSignIn();
    me = await apiSignIn();
    await openGuide();
  });

  it('boş / yalnız boşluk metinde gönder pasif; gerçek niyetle öneri gelir, 1 kredi düşer', async () => {
    await exists('e2e-ai-guide-send-disabled');
    await element(by.id('e2e-ai-guide-input')).replaceText('   ');
    await exists('e2e-ai-guide-send-disabled');
    const before = await balance();
    await element(by.id('e2e-ai-guide-input')).replaceText('Sabah huzur için zikir öner');
    // Çift dokunuş: tek istek, tek kredi.
    await element(by.id('e2e-ai-guide-send')).multiTap(2);
    await waitFor(element(by.id('e2e-ai-guide-recommendation')).atIndex(0)).toExist().withTimeout(60000);
    await waitBalance(before - 1);
    await sleep(2000);
    assert.equal(await balance(), before - 1);
  });

  it('öneri "Başla": hedef önerilen değer; "Kaldığı yerden" mevcut hedefi korur, "Sıfırdan başla" önerilen hedefi uygular (M-06)', async () => {
    // Önerilen hedef metni (kartın kanıt bölümü).
    const label = await element(by.text(/^(Önerilen hedef|Recommended target): \d+$/)).atIndex(0).getAttributes();
    const recommended = Number.parseInt(String(label.text ?? label.label).replace(/\D+/g, ''), 10);
    assert.ok(recommended > 0);

    await tapStart();
    await visible('e2e-home-counter', 20000);
    await countLabel(new RegExp(`^0/${recommended}$`));
    await tapN('e2e-home-counter', 3);
    const differentTarget = recommended === 7 ? '9' : '7';
    await setTarget(differentTarget);
    await countLabel(new RegExp(`^3/${differentTarget}$`));

    await openGuide();
    await tapStart();
    await exists('e2e-home-resume-continue', 15000);
    await element(by.id('e2e-home-resume-continue')).tap();
    await gone('e2e-home-resume-continue');
    await countLabel(new RegExp(`^3/${differentTarget}$`)); // kaldığı yerden: hedef kalır

    await openGuide();
    await tapStart();
    await exists('e2e-home-resume-fresh', 15000);
    await element(by.id('e2e-home-resume-fresh')).tap();
    await gone('e2e-home-resume-fresh');
    await countLabel(new RegExp(`^0/${recommended}$`)); // sıfırdan: önerilen hedef
  });

  it('sohbet: [mock:bilgi] kaynak atıflı yanıt (1 kredi); [mock:error503] hata, kredi değişmez', async () => {
    await openGuide();
    await openChat();
    await visible('e2e-ai-chat-credits', 20000);
    const before = await balance();
    await element(by.id('e2e-ai-chat-input')).replaceText('[mock:bilgi] zikir nedir?');
    await element(by.id('e2e-ai-chat-send')).tap();
    await waitFor(element(by.id('e2e-ai-chat-assistant-message')).atIndex(0)).toExist().withTimeout(45000);
    await existsText(/^Mock Kaynak, (s|pp)\. 12-13$/, 15000);
    await waitBalance(before - 1);

    await element(by.id('e2e-ai-chat-input')).replaceText('[mock:error503] başka soru');
    await element(by.id('e2e-ai-chat-send')).tap();
    await existsText(/.*(Kredin düşülmedi|wasn't charged).*/, 60000);
    await sleep(1500);
    assert.equal(await balance(), before - 1);
  });

  it('eşzamanlı istekler: tek uçuş kuralı (429 AI_REQUEST_IN_FLIGHT) kredi çifte düşmez; günlük ücretsiz sınır 20 (429 AI_DAILY_FREE_LIMIT)', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => apiPost('/v1/ai/recommendations', me.accessToken, aiPayload('Akşam huzur için zikir'))),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.ok(ok >= 1);
    for (const r of rejected) assert.match(String(r.reason), /429.*AI_REQUEST_IN_FLIGHT/);

    // Ücretsiz kalan (hata) çalışmalar ayrı kullanıcıyla: 20 tanesi 503, 21.'si günlük sınır.
    const other = await apiSignInAs('e2e-j5-abuser', 'Kotuye Kullanim');
    const payload = () => ({ userId: other.userId, freeText: '[mock:error503] x', flowId: randomUUID() });
    let limited;
    for (let i = 0; i < 25 && !limited; i += 1) {
      try {
        await apiPost('/v1/ai/recommendations', other.accessToken, payload());
      } catch (err) {
        if (/429/.test(String(err))) limited = String(err);
        else assert.match(String(err), /503/);
      }
    }
    assert.match(limited ?? '', /AI_DAILY_FREE_LIMIT/);
  });

  it('kredi 0: gönderince premium sayfası açılır, yazılan metin korunur', async () => {
    mongo('db.ai_credit_wallets.updateMany({}, {$set: {balance: 0, grantCredits: 0, topupCredits: 0}})');
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await settleOverlays();
    await openGuide();
    await element(by.id('e2e-ai-guide-input')).replaceText('Kredim bitti ama yazdım');
    await element(by.id('e2e-ai-guide-send')).tap();
    await exists('e2e-premium-sheet', 30000);
    await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
    await element(by.id('e2e-premium-close')).tap();
    await gone('e2e-premium-sheet');
    await expect(element(by.id('e2e-ai-guide-input'))).toHaveText('Kredim bitti ama yazdım');
  });
});
