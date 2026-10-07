/* global element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  visible,
  exists,
  scrollTo,
  openTab,
  sleep,
  apiSignIn,
  apiGet,
  mongo,
} = require('./helpers');

let me;
const balance = async () => (await apiGet('/v1/ai/credits', me.accessToken)).balance;
const guideSend = async (text) => {
  await visible('e2e-ai-guide-input', 20000);
  await element(by.id('e2e-ai-guide-input')).replaceText(text);
  await visible('e2e-ai-guide-send', 5000);
};
const openGuide = async () => {
  await openTab('aiGuide');
  await visible('e2e-ai-guide-input', 20000);
};
const openChat = async () => {
  await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
  await element(by.id('e2e-ai-chat-entry')).tap();
  await visible('e2e-ai-chat-input', 20000);
};
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

describe('09 AI: hata modları, çift dokunuş, kredi', () => {
  beforeAll(async () => {
    await freshSignIn();
    me = await apiSignIn();
    await openGuide();
  });

  it('MOB-AIR-04 boş girdide gönder pasif, yazınca aktif', async () => {
    await exists('e2e-ai-guide-send-disabled');
    await element(by.id('e2e-ai-guide-input')).replaceText('Huzur için zikir');
    await exists('e2e-ai-guide-send');
    await expect(element(by.id('e2e-ai-guide-send-disabled'))).not.toExist();
    await element(by.id('e2e-ai-guide-input')).replaceText('');
  });

  it('[mock:error503] hata ekranı gösterir, kredi düşmez', async () => {
    const before = await balance();
    await guideSend('[mock:error503] huzur için zikir');
    await element(by.id('e2e-ai-guide-send')).tap();
    await exists('e2e-ai-guide-unavailable', 60000);
    assert.equal(await balance(), before);
  });

  it('[mock:timeout] bekleme durur, hata ekranı gelir, kredi düşmez', async () => {
    const before = await balance();
    await guideSend('[mock:timeout] huzur için zikir');
    await element(by.id('e2e-ai-guide-send')).tap();
    await exists('e2e-ai-guide-unavailable', 90000);
    assert.equal(await balance(), before);
  });

  it('[mock:clarify] netleştirme sorusu gösterir', async () => {
    await guideSend('[mock:clarify] bir şey');
    await element(by.id('e2e-ai-guide-send')).tap();
    await exists('e2e-ai-guide-clarify', 60000);
  });

  it('B-23 Rehber gönder çift dokunuş: tek istek, tek kredi', async () => {
    const before = await balance();
    await guideSend('Sabah huzur için zikir öner');
    await element(by.id('e2e-ai-guide-send')).multiTap(2);
    await waitFor(element(by.id('e2e-ai-guide-recommendation')).atIndex(0)).toExist().withTimeout(60000);
    await waitBalance(before - 1);
    await sleep(2000);
    assert.equal(await balance(), before - 1);
  });

  it('sohbet: [mock:bilgi] kaynaklı yanıt; çift dokunuş tek kredi (B-23)', async () => {
    await openChat();
    await visible('e2e-ai-chat-credits', 20000);
    const before = await balance();
    await element(by.id('e2e-ai-chat-input')).replaceText('[mock:bilgi] zikir nedir?');
    await element(by.id('e2e-ai-chat-send')).multiTap(2);
    await waitFor(element(by.id('e2e-ai-chat-assistant-message')).atIndex(0)).toExist().withTimeout(45000);
    await waitBalance(before - 1);
    await sleep(2500);
    assert.equal(await balance(), before - 1);
  });

  it('kredi 0: premium sayfası açılır, yazılan metin girdide kalır', async () => {
    mongo(
      `db.ai_credit_wallets.updateMany({}, {$set: {balance: 0, grantCredits: 0, topupCredits: 0}})`,
    );
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await openGuide();
    await guideSend('Kredim bitti ama yazdım');
    await element(by.id('e2e-ai-guide-send')).tap();
    await exists('e2e-premium-sheet', 30000);
    await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
    await element(by.id('e2e-premium-close')).tap();
    await waitFor(element(by.id('e2e-premium-sheet'))).not.toExist().withTimeout(10000);
    await expect(element(by.id('e2e-ai-guide-input'))).toHaveText('Kredim bitti ama yazdım');
  });
});
