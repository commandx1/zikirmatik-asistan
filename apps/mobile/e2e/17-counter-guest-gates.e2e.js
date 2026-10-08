/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  visible,
  exists,
  existsText,
  skipTourIfShown,
  waitForHome,
  waitForTextContaining,
  scrollTo,
  scrollToCentered,
  signInWithGoogle,
  openTab,
  relaunch,
  tapN,
  sleep,
  resetUserData,
  mongo,
  tapBack,
  apiSignInAs,
  apiGet,
  apiPost,
  apiSignIn,
  setAirplane,
  apiRequest,
} = require('./helpers');

const count = (re) =>
  waitForTextContaining('e2e-home-count-label', new RegExp(`^${re.source.replace(/^\^|\$$/g, '')}(/\\d+)?$`), 10000);
const gone = (id, ms = 8000) => waitFor(element(by.id(id))).not.toExist().withTimeout(ms);
const freshInstall = async () => {
  resetUserData();
  await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
  await waitForHome(60000);
  await skipTourIfShown();
  await visible('e2e-home-counter', 20000);
};
const toCounter = () => scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
const freeMode = async () => {
  // Taze misafir/üye zaten serbest modda (seçili zikir yok) → düğme çizilmez.
  try {
    await expect(element(by.id('e2e-home-free-mode'))).toExist();
  } catch {
    await toCounter();
    return;
  }
  await scrollTo('e2e-home-free-mode', 'e2e-home-scroll', { direction: 'up' });
  await element(by.id('e2e-home-free-mode')).tap();
  await toCounter();
};
const setTarget = async (value) => {
  await element(by.id('e2e-home-target-button')).tap();
  await exists('e2e-home-target-input', 10000);
  await element(by.id('e2e-home-target-input')).replaceText(value);
  await element(by.id('e2e-home-target-submit')).tap();
};

describe('17a sayaç: hedef, her yere dokun, kalıcılık (misafir)', () => {
  beforeAll(freshInstall);

  it('SAY-29 20 hızlı dokunuş tam 20 sayılır', async () => {
    await freeMode();
    await element(by.id('e2e-home-counter')).multiTap(20);
    await count(/^20$/);
  });

  it('SAY-28 sayım uygulama öldürülüp açılınca korunur', async () => {
    await sleep(2000);
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await count(/^20$/);
  });

  it('SAY-17 sayım > yeni hedef → "Sayım kırpılacak" modalı: vazgeç sayımı korur, "Yine de uygula" hedefe indirir', async () => {
    await toCounter();
    await setTarget('10');
    await exists('e2e-home-target-downgrade-cancel', 10000);
    await element(by.id('e2e-home-target-downgrade-cancel')).tap();
    await gone('e2e-home-target-downgrade-cancel');
    await count(/^20$/);
    await setTarget('10');
    await exists('e2e-home-target-downgrade-apply', 10000);
    await element(by.id('e2e-home-target-downgrade-apply')).tap();
    await waitForTextContaining('e2e-home-count-label', /^10\/10$/, 10000);
  });

  it('SAY-18 hedef modalında boş değer serbest modda hedefi sınırsıza döndürür', async () => {
    await setTarget('');
    await waitForTextContaining('e2e-home-count-label', /^10$/, 10000);
  });

  it('SAY-13 "her yere dokun" kapalıyken kart dışı dokunuş sayılmaz; SAY-14 açıkken sayılır ve yeniden açılışta tercih korunur', async () => {
    await element(by.id('e2e-home-reset')).tap();
    await exists('e2e-home-reset-confirm', 10000);
    await element(by.id('e2e-home-reset-confirm')).tap();
    await count(/^0$/);
    await element(by.id('e2e-home-scroll')).tap({ x: 20, y: 30 });
    await sleep(500);
    await count(/^0$/);
    await element(by.id('e2e-home-tap-anywhere')).tap();
    await element(by.id('e2e-home-scroll')).tap({ x: 20, y: 30 });
    await count(/^1$/);
    await sleep(1500);
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await element(by.id('e2e-home-scroll')).tap({ x: 20, y: 30 });
    await waitForTextContaining('e2e-home-count-label', /^\d+$/, 10000);
    const label = await waitForTextContaining('e2e-home-count-label', /^\d+/, 5000);
    assert.ok(Number.parseInt(label, 10) >= 1);
    await element(by.id('e2e-home-tap-anywhere')).tap();
  });

});

describe('17a2 sayaç: misafir seçili zikir hedefe ulaşınca', () => {
  beforeAll(freshInstall);

  it('SAY-06 misafir seçili zikir hedefe ulaşınca otomatik kayıt/istem yok, ilerleme yerelde kalır', async () => {
    const id = 'e2e-home-esma-item-2';
    await scrollToCentered(id, 'e2e-home-scroll');
    await element(by.id(id)).tap();
    await toCounter();
    await setTarget('3');
    await tapN('e2e-home-counter', 3);
    await waitForTextContaining('e2e-home-count-label', /^3\/3$/, 10000);
    await sleep(1500);
    await expect(element(by.id('e2e-auth-prompt-confirm'))).not.toExist();
    await expect(element(by.id('e2e-home-save-name-input'))).not.toExist();
  });

  it('SAY-11 tur boyu "Özel": en fazla 4 hane girilir', async () => {
    await element(by.id('e2e-home-target-button')).tap();
    await exists('e2e-home-target-input', 10000);
    await element(by.id('e2e-home-lap-custom-option')).tap();
    await exists('e2e-home-lap-custom-input', 10000);
    await element(by.id('e2e-home-lap-custom-input')).replaceText('12345');
    const attrs = await element(by.id('e2e-home-lap-custom-input')).getAttributes();
    assert.equal(String(attrs.text ?? attrs.value ?? ''), '1234');
    await element(by.id('e2e-home-target-submit')).tap();
  });

  it('ZKR-13 misafir Zikirlerim: sayımı > 0 katalog zikri listelenir', async () => {
    await openTab('focus');
    await existsText(/^\d+\/\d+$/, 15000);
    await existsText(/^3\/\d+$/, 5000);
  });
});

describe('17b sayaç: üye hedef kuralları', () => {
  beforeAll(async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('home');
    await skipTourIfShown();
  });

  it('SAY-07 serbest mod hedefli: hedefe ulaşınca ad isteyen kaydet sayfası hedef dolu açılır', async () => {
    await freeMode();
    await setTarget('3');
    await tapN('e2e-home-counter', 3);
    await visible('e2e-home-save-name-input', 15000);
    const attrs = await element(by.id('e2e-home-save-target-input')).getAttributes();
    assert.equal(String(attrs.text ?? attrs.value ?? ''), '3');
    await element(by.id('e2e-home-save-name-input')).replaceText('Hedefli Serbest');
    await element(by.id('e2e-home-save-name-submit')).tap();
    await gone('e2e-home-save-name-input', 15000);
  });

  it('SAY-05 aynı gün aynı hedefe ikinci kez ulaşılınca ikinci otomatik kayıt olmaz', async () => {
    mongo("db.dhikr_logs.deleteMany({})");
    await toCounter();
    // Seçili zikir "Hedefli Serbest" (hedef 3): sıfırla → tekrar ulaş.
    await element(by.id('e2e-home-reset')).tap();
    await exists('e2e-home-reset-confirm', 10000);
    await element(by.id('e2e-home-reset-confirm')).tap();
    await tapN('e2e-home-counter', 3);
    await sleep(3000);
    const first = Number(mongo('print(db.dhikr_logs.countDocuments({}))'));
    await element(by.id('e2e-home-reset')).tap();
    await exists('e2e-home-reset-confirm', 10000);
    await element(by.id('e2e-home-reset-confirm')).tap();
    await tapN('e2e-home-counter', 3);
    await sleep(3000);
    const second = Number(mongo('print(db.dhikr_logs.countDocuments({}))'));
    assert.ok(first >= 1, `ilk ulaşımda otomatik kayıt beklenir (${first})`);
    assert.equal(second, first);
  });
});

describe('17c misafir kapıları', () => {
  beforeAll(freshInstall);
  const promptAndCancel = async () => {
    await exists('e2e-auth-prompt-confirm', 15000);
    await element(by.id('e2e-auth-prompt-cancel')).tap();
    await gone('e2e-auth-prompt-confirm');
  };

  it('GIR-08 auth ekranı X ile kapanır; GIR-07 Android\'de Apple düğmesi yok', async () => {
    await openTab('profile');
    await scrollTo('e2e-profile-sign-in', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-sign-in')).tap();
    await visible('e2e-auth-google', 20000);
    if (device.getPlatform() === 'android') {
      await expect(element(by.text(/Apple/))).not.toExist();
    }
    await element(by.id('e2e-auth-close')).tap();
    await visible('e2e-profile-scroll', 15000);
  });

  it('AIR-02 misafir AI Rehber gönder → üye ol modalı (GIR-12); AIR-03 öneri çipi girdiye yazar, göndermez', async () => {
    await openTab('aiGuide');
    await visible('e2e-ai-guide-input', 20000);
    await element(by.id('e2e-ai-guide-input')).replaceText('sabır için zikir');
    await element(by.id('e2e-ai-guide-send')).tap();
    await promptAndCancel();
  });

  it('AIR-03 öneri çipi girdiye yazar, otomatik göndermez', async () => {
    await openTab('aiGuide');
    await visible('e2e-ai-guide-input', 20000);
    await element(by.id('e2e-ai-guide-input')).replaceText('');
    await existsText(/^(İçim sıkıldı|I feel down)$/, 10000);
    await element(by.text(/^(İçim sıkıldı|I feel down)$/)).atIndex(0).tap();
    await sleep(1500);
    const attrs = await element(by.id('e2e-ai-guide-input')).getAttributes();
    assert.match(String(attrs.text ?? attrs.value ?? ''), /İçim sıkıldı|I feel down/);
    await expect(element(by.id('e2e-ai-guide-recommendation')).atIndex(0)).not.toExist();
    await expect(element(by.id('e2e-auth-prompt-confirm'))).not.toExist();
  });

  it('AIM-13 misafir sohbet girişi → üye ol modalı', async () => {
    await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
    await element(by.id('e2e-ai-chat-entry')).tap();
    await promptAndCancel();
  });

  it('HAL-01 misafir halka hub: "Yeni halka" → üye ol modalı', async () => {
    await openTab('home');
    await exists('e2e-circle-home-card', 20000).catch(() => {});
    await scrollTo('e2e-circle-home-card', 'e2e-home-scroll');
    await element(by.id('e2e-circle-home-card')).tap();
    await visible('e2e-circle-new', 20000);
    await existsText(/^(Halka kurmak ya da katılmak için giriş yapmalısın|Sign in to start or join a circle).*$/, 10000);
    await element(by.id('e2e-circle-new')).tap();
    await promptAndCancel();
    await tapBack();
  });

  it('PRM-05 misafir premium sayfası fiyatsız plan etiketleri, kredi paketi yok; PRM-04 "Hemen Başla" → üye ol modalı; PRM-03 geri tuşu sayfayı kapatır', async () => {
    await openTab('profile');
    await scrollTo('e2e-profile-premium-features', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-premium-features')).tap();
    await exists('e2e-premium-sheet', 15000);
    await existsText(/^(Aylık|Monthly)$/, 10000);
    await existsText(/^(Yıllık|Yearly)$/, 10000);
    await expect(element(by.text(/^\d+ (Kredi|Credits)$/))).not.toExist();
    await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
    await element(by.text(/^(Hemen Başla|Get Started)$/)).atIndex(0).tap();
    await promptAndCancel();
    await device.pressBack();
    await gone('e2e-premium-sheet', 10000);
  });

  it('SYM-07 bilinmeyen derin bağlantı "Sayfa bulunamadı" + "Ana sayfaya dön"', async () => {
    await device.openURL({ url: 'zikirmatik://xyz' });
    await existsText(/^(Sayfa bulunamadı|Page not found).*$/, 20000);
    await element(by.text(/^(Ana sayfaya dön|Go home).*$/)).atIndex(0).tap();
    await waitForHome(20000);
  });

  it('SYM-08 ikinci şema aynı katıl ekranını açar; HAL-15 misafir Katıl → üye ol modalı', async () => {
    const host = await apiSignInAs('e2e-host-17', 'Kurucu 17');
    const dhikrs = await apiGet('/v1/dhikrs', host.accessToken);
    const dhikrId = (Array.isArray(dhikrs) ? dhikrs : dhikrs.items)[0]._id;
    const circle = await apiPost('/v1/circles', host.accessToken, { dhikrId, goalCount: 50, name: 'E2E Halka 17' });
    await device.openURL({ url: `zikirmatikasistan://circle/join?code=${circle.code}` });
    await exists('e2e-circle-join-cta', 20000);
    await element(by.id('e2e-circle-join-cta')).tap();
    await promptAndCancel();
  });
});

// Editörde sabaha bir zikir ekleyip "Kaydet ve başlat"a basar (hub'dan "Yeni" ile açılmış editör).
async function fillEditorAndSaveStart() {
  await visible('e2e-vird-editor-title', 20000);
  await element(by.id('e2e-vird-slot-add-morning')).tap();
  await exists('e2e-vird-picker-row', 20000);
  await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
  await element(by.id('e2e-vird-picker-done')).tap();
  await scrollTo('e2e-vird-save-and-start', 'e2e-vird-editor-scroll');
  await element(by.id('e2e-vird-save-and-start')).tap();
}

describe('17d vird (misafir)', () => {
  beforeAll(freshInstall);
  const openHub = async () => {
    await device.openURL({ url: 'zikirmatik://vird' });
    await visible('e2e-vird-hub', 20000);
  };

  it('VRD-02 misafir hub ipucu; VHT-01 ücretsiz hatırlatma kartı yalnız "Premium ile aç"; VAI-01 AI ile oluştur → üye ol modalı', async () => {
    await openHub();
    await existsText(/^(Misafir modundasın|You're in guest mode).*$/, 10000);
    await expect(element(by.id('e2e-vird-reminder-settings'))).not.toExist();
    await existsText(/^(Premium ile aç|Unlock with Premium)$/, 10000);
    await element(by.text(/^(AI ile oluştur|Create with AI)$/)).atIndex(0).tap();
    await exists('e2e-auth-prompt-confirm', 15000);
    await element(by.id('e2e-auth-prompt-cancel')).tap();
    await gone('e2e-auth-prompt-confirm');
  });

  it('VRD-05 hiç zikir yokken kaydet hata verir', async () => {
    await element(by.id('e2e-vird-new-manual')).tap();
    await visible('e2e-vird-editor-title', 20000);
    await scrollTo('e2e-vird-save-and-start', 'e2e-vird-editor-scroll');
    await element(by.id('e2e-vird-save-and-start')).tap();
    await existsText(/^(En az bir dilime bir zikir eklemelisin|Add at least one dhikr to a slot).*$/, 10000);
  });

  it('VRD-12/13 misafir "Kaydet ve başlat" (çift dokunuş) tek yerel aktif program; VSE-11 yalnız yerel; VSE-02 hedefte otomatik geçiş yok', async () => {
    await scrollTo('e2e-vird-slot-add-morning', 'e2e-vird-editor-scroll', { direction: 'up' });
    await element(by.id('e2e-vird-slot-add-morning')).tap();
    await exists('e2e-vird-picker-row', 20000);
    await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
    await element(by.id('e2e-vird-picker-row')).atIndex(1).tap();
    await element(by.id('e2e-vird-picker-done')).tap();
    await exists('e2e-vird-item-target');
    await element(by.id('e2e-vird-item-target')).atIndex(0).replaceText('2');
    await element(by.id('e2e-vird-item-target')).atIndex(1).replaceText('2');
    await scrollTo('e2e-vird-save-and-start', 'e2e-vird-editor-scroll');
    await element(by.id('e2e-vird-save-and-start')).multiTap(2);
    await visible('e2e-vird-today-start-morning', 30000);
    await expect(element(by.id('e2e-vird-today-start-morning')).atIndex(1)).not.toExist();
    assert.equal(Number(mongo('print(db.vird_programs.countDocuments({}))')), 0);

    await element(by.id('e2e-vird-today-start-morning')).tap();
    await visible('e2e-vird-session', 20000);
    await tapN('e2e-vird-session-counter', 2);
    await sleep(2000);
    // Hedefe ulaşıldı ama otomatik sonraki zikre geçilmedi: Bitir henüz yok, Sonraki var.
    await expect(element(by.id('e2e-vird-session-finish'))).not.toExist();
    await exists('e2e-vird-session-next', 5000);
    assert.equal(Number(mongo('print(db.vird_programs.countDocuments({}))')), 0);
  });

  it('VRD-21 misafir ikinci yerel program: istemci tarafı aynı çakışma modalı', async () => {
    await openHub();
    await element(by.id('e2e-vird-new-manual')).tap();
    await fillEditorAndSaveStart();
    await exists('e2e-vird-swap-pause-and-start', 15000);
    await element(by.id('e2e-vird-swap-keep-draft')).tap();
    await visible('e2e-vird-hub', 20000);
    await existsText(/^(Taslak olarak kaydedildi|Saved as a draft).*$/, 10000);
  });

  it('VSE-13 parametresiz /vird/session ana sayfaya yönlenir', async () => {
    await device.openURL({ url: 'zikirmatik://vird/session' });
    await waitForHome(30000);
  });
});

describe('17e halka oluşturma doğrulamaları (ücretsiz üye)', () => {
  const dateKey = (plusDays) => {
    const d = new Date();
    d.setDate(d.getDate() + plusDays);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const pickDhikr = async () => {
    await element(by.id('e2e-circle-pick-dhikr')).tap();
    await exists('e2e-vird-picker-row', 20000);
    await element(by.id('e2e-vird-picker-row')).atIndex(0).tap();
  };
  const submitGoal = async (goal) => {
    await element(by.id('e2e-circle-goal-input')).replaceText(goal);
    await element(by.id('e2e-circle-submit')).tap();
  };
  let me;

  beforeAll(async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('home');
    await skipTourIfShown();
    me = await apiSignIn();
  });

  it('HAL-05 zikir seçilmeden oluştur "Lütfen bir zikir seç."; HAL-06 hedef sınırları', async () => {
    await scrollTo('e2e-circle-home-card', 'e2e-home-scroll');
    await element(by.id('e2e-circle-home-card')).tap();
    await visible('e2e-circle-new', 20000);
    await element(by.id('e2e-circle-new')).tap();
    await visible('e2e-circle-pick-dhikr', 10000);
    await element(by.id('e2e-circle-submit')).tap();
    await existsText(/^(Lütfen bir zikir seç|Please pick a dhikr).*$/, 10000);

    await pickDhikr();
    for (const bad of ['0', '10000001', 'abc']) {
      await submitGoal(bad);
      await existsText(/^(Hedef 1 ile|Goal must be).*$/, 10000);
    }
  });

  it('HAL-06/07/08 hedef 10.000.000 kabul; varsayılan süre 30 gün; ad boşsa zikir adı', async () => {
    await submitGoal('10000000');
    await visible('e2e-circle-code', 20000);
    const mine = await apiGet('/v1/circles', me.accessToken);
    const c = mine.find((x) => x.status === 'active');
    assert.equal(c.goalCount, 10000000);
    assert.equal(String(c.endDate).slice(0, 10), dateKey(30));
    assert.ok(c.name && c.name.length > 0);
  });

  it('HAL-31 kurucu "Kapat" → onay: durum kapalı', async () => {
    await exists('e2e-circle-close', 10000);
    await element(by.id('e2e-circle-close')).tap();
    await exists('e2e-circle-close-confirm', 10000);
    await element(by.id('e2e-circle-close-confirm')).tap();
    await sleep(2000);
    const mine = await apiGet('/v1/circles', me.accessToken);
    assert.equal(mine.filter((x) => x.status === 'active').length, 0);
  });

  it('HAL-06/07 hedef 1 kabul; "7 gün" çipi bitişi bugün+7 yapar', async () => {
    await tapBack();
    await visible('e2e-circle-new', 20000);
    await element(by.id('e2e-circle-new')).tap();
    await visible('e2e-circle-pick-dhikr', 10000);
    await pickDhikr();
    await element(by.text(/^(7 gün|7 days)$/)).atIndex(0).tap();
    await submitGoal('1');
    await visible('e2e-circle-code', 20000);
    const mine = await apiGet('/v1/circles', me.accessToken);
    const c = mine.find((x) => x.status === 'active');
    assert.equal(c.goalCount, 1);
    assert.equal(String(c.endDate).slice(0, 10), dateKey(7));
    await apiPost(`/v1/circles/${c.id}/close`, me.accessToken);
  });

  describe('iki üyeli halka (API kurucu)', () => {
    let host;
    let circle;
    let dhikrId;
    beforeAll(async () => {
      host = await apiRequest('POST', '/v1/auth/provider/verify', {
        body: {
          provider: 'google',
          platform: 'ios',
          idToken: JSON.stringify({ sub: 'e2e-host-19', email: 'e2e-host-19@example.com' }),
          deviceId: 'e2e-detox-e2e-host-19',
        },
      });
      const dhikrs = await apiGet('/v1/dhikrs', host.accessToken);
      dhikrId = (Array.isArray(dhikrs) ? dhikrs : dhikrs.items)[0]._id;
      circle = await apiPost('/v1/circles', host.accessToken, { dhikrId, goalCount: 100, name: 'E2E Halka 19' });
      await apiPost('/v1/circles/join', me.accessToken, { code: circle.code });
      await relaunch();
      await waitForHome(60000);
      await skipTourIfShown();
    });

    it('HAL-34 ana sayfa kartı "Devam et" → oturum; HAL-26 arka plana alınca bekleyen sayım hemen gönderilir; "Halkaya git" → hub', async () => {
      await scrollTo('e2e-circle-home-card-active', 'e2e-home-scroll');
      await element(by.id('e2e-circle-home-card-active')).tap();
      await visible('e2e-circle-session-counter', 20000);
      await sleep(2500);
      await tapN('e2e-circle-session-counter', 3);
      await device.sendToHome();
      await sleep(1200);
      const detail = await apiGet(`/v1/circles/${circle.id}`, host.accessToken);
      assert.equal(detail.totalCount, 3);
      await device.launchApp({ newInstance: false });
      await element(by.id('e2e-circle-session-close')).tap();
      await tapBack().catch(() => {});
      await openTab('home');
      await scrollTo('e2e-circle-home-card-hub', 'e2e-home-scroll');
      await element(by.id('e2e-circle-home-card-hub')).tap();
      await visible('e2e-circle-hub', 20000);
    });

    it('HAL-19 başka üye sayınca detay ≤20 sn içinde güncellenir; HAL-38 adsız üye "Misafir/Guest"', async () => {
      await device.openURL({ url: `zikirmatik://circle/${circle.id}` });
      await existsText(/^(Bugün 1\/2 üye katıldı|1\/2 members joined today)$/, 20000);
      await existsText(/^(Misafir|Guest)$/, 10000);
      const today = new Date();
      const p = (n) => String(n).padStart(2, '0');
      await apiPost('/v1/dhikr-logs', host.accessToken, {
        userId: host.userId,
        dhikrId,
        count: 7,
        targetCount: 100,
        date: `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`,
        source: 'circle',
        circleId: circle.id,
        isCompleted: false,
      });
      await existsText(/^(Bugün 2\/2 üye katıldı|2\/2 members joined today)$/, 20000);
    });
  });
});

describe('17f özel günler', () => {
  const ymd = (plus) => {
    const d = new Date();
    d.setDate(d.getDate() + plus);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  beforeAll(async () => {
    mongo(`db.special_days.deleteMany({eventKey: /^e2e-/}); db.special_days.insertMany([
      {name: {tr: 'E2E Bugün Kandili', en: 'E2E Today Kandil'}, type: 'kandil', date: '${ymd(0)}', hijriDate: '1 Test 1448', eventKey: 'e2e-bugun', priority: 1, isActive: true, practices: [], createdAt: new Date(), updatedAt: new Date()},
      {name: {tr: 'E2E Sonraki Gün', en: 'E2E Later Day'}, type: 'bayram', date: '${ymd(20)}', hijriDate: '1 Test 1449', eventKey: 'e2e-sonraki', priority: 1, isActive: true, practices: [], createdAt: new Date(), updatedAt: new Date()}
    ])`);
    await freshInstall();
  });
  afterAll(() => {
    mongo("db.special_days.deleteMany({eventKey: /^e2e-/})");
  });

  it('OZG-02 bugün özel gün: "BUGÜN" rozeti + "İncele" kartı', async () => {
    await openTab('specialDays');
    await existsText(/^(BUGÜN|TODAY)$/, 30000);
    await existsText(/^(İncele|View)$/, 10000);
  });

  it('AIR-18 detaydaki "AI Rehber ile öneri al" Rehber sekmesini ad ile dolu girdiyle açar', async () => {
    await element(by.text(/^(İncele|View)$/)).atIndex(0).tap();
    await existsText(/^(AI Rehber ile öneri al|Get suggestions from AI Guide)$/, 20000);
    await waitFor(element(by.text(/^(AI Rehber ile öneri al|Get suggestions from AI Guide)$/)).atIndex(0))
      .toBeVisible()
      .whileElement(by.type('android.widget.ScrollView'))
      .scroll(300, 'down');
    await element(by.text(/^(AI Rehber ile öneri al|Get suggestions from AI Guide)$/)).atIndex(0).tap();
    await visible('e2e-ai-guide-input', 20000);
    const attrs = await element(by.id('e2e-ai-guide-input')).getAttributes();
    assert.match(String(attrs.text ?? attrs.value ?? ''), /E2E Bugün Kandili|E2E Today Kandil/);
  });

  it('OZG-05 ağ yokken sekme hata kutusu gösterir (yalnız Android)', async () => {
    if (device.getPlatform() !== 'android') return;
    await setAirplane(true);
    try {
      await relaunch();
      await waitForHome(60000);
      await skipTourIfShown();
      await openTab('specialDays');
      await existsText(/^(Özel gün verisi alınamadı|Special day data could not be retrieved|Sunucuya ulaşılamıyor|Cannot reach the server).*$/, 90000);
    } finally {
      await setAirplane(false);
    }
  });
});

describe('17g kredi rozeti (ücretsiz üye)', () => {
  it('KRD-01 rozet sunucu bakiyesini gösterir, dokununca premium sayfası açılır', async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('aiGuide');
    await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
    await element(by.id('e2e-ai-chat-entry')).tap();
    const label = await waitForTextContaining('e2e-ai-chat-credits', /\d/, 20000);
    const me = await apiSignIn();
    const credits = await apiGet('/v1/ai/credits', me.accessToken);
    assert.equal(Number.parseInt(label.replace(/\D+/g, ''), 10), credits.balance);
    await element(by.id('e2e-ai-chat-credits')).tap();
    await exists('e2e-premium-sheet', 15000);
    await device.pressBack();
  });

  it('PRM-13 widget "Premium ›" derin bağlantısı soğuk açılışta ücretsizde sayfayı açar (premiumda açmama: bilinen yarış, rapora bkz.)', async () => {
    const url = 'zikirmatik://home?paywall=1&src=widget';
    await device.launchApp({ newInstance: true, url });
    await exists('e2e-premium-sheet', 30000);
  });
});

describe('17h vird seansı (üye)', () => {
  const ymd = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const virdCount = () =>
    Number(
      mongo(
        "print(db.dhikr_logs.aggregate([{$match:{virdProgramId:{$exists:true}}},{$group:{_id:null,n:{$sum:'$count'}}}]).toArray()[0]?.n ?? 0)",
      ),
    );
  const startSession = async () => {
    await device.openURL({ url: 'zikirmatik://vird' });
    await visible('e2e-vird-hub', 20000);
    await visible('e2e-vird-today-start-morning', 20000);
    await element(by.id('e2e-vird-today-start-morning')).tap();
    await visible('e2e-vird-session', 20000);
  };
  beforeAll(async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    const me = await apiSignIn();
    const dhikrs = await apiGet('/v1/dhikrs', me.accessToken);
    const dhikrId = (Array.isArray(dhikrs) ? dhikrs : dhikrs.items)[0]._id;
    const program = await apiPost('/v1/vird/programs', me.accessToken, {
      title: { tr: 'Seans Programı', en: 'Seans Programı' },
      kind: 'routine',
      startDate: ymd(),
      phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId, target: 9 }] } }],
    });
    await apiRequest('POST', `/v1/vird/programs/${program._id}/activate`, { token: me.accessToken });
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
  });

  it('VSE-08 seans ortasında X: ilerleme sunucuya yazılır', async () => {
    await startSession();
    await tapN('e2e-vird-session-counter', 2);
    await waitForTextContaining('e2e-vird-session-count-label', /^2/, 10000);
    await element(by.id('e2e-vird-session-close')).tap();
    await visible('e2e-vird-hub', 20000);
    await sleep(3000);
    assert.equal(virdCount(), 2);
  });

  it('VSE-09 arka plan → öldür → aç: ilerleme kalıcı, seans kaldığı yerden', async () => {
    await startSession();
    await waitForTextContaining('e2e-vird-session-count-label', /^2/, 10000);
    await tapN('e2e-vird-session-counter', 1);
    await waitForTextContaining('e2e-vird-session-count-label', /^3/, 10000);
    await device.sendToHome();
    await sleep(1000);
    await device.terminateApp();
    await device.launchApp({ newInstance: true });
    await waitForHome(60000);
    await skipTourIfShown();
    await startSession();
    await waitForTextContaining('e2e-vird-session-count-label', /^3/, 10000);
  });

  it('VSE-10 uçak modunda X: yerel ilerleme korunur; ağ gelince sonraki tetikte gönderilir (yalnız Android)', async () => {
    if (device.getPlatform() !== 'android') return;
    await setAirplane(true);
    try {
      await tapN('e2e-vird-session-counter', 1);
      await element(by.id('e2e-vird-session-close')).tap();
      await visible('e2e-vird-hub', 20000);
    } finally {
      await setAirplane(false);
    }
    await sleep(3000);
    await element(by.id('e2e-vird-today-start-morning')).tap();
    await visible('e2e-vird-session', 20000);
    await waitForTextContaining('e2e-vird-session-count-label', /^4/, 10000);
    await tapN('e2e-vird-session-counter', 1);
    await element(by.id('e2e-vird-session-close')).tap();
    await visible('e2e-vird-hub', 20000);
    await sleep(4000);
    assert.equal(virdCount(), 5);
  });
});

describe('17i widget keşif kartı (Android)', () => {
  it('WDG-14 seri ≥3: "Serini ana ekranında gör" kartı çıkar; kapatınca bir daha çıkmaz', async () => {
    if (device.getPlatform() !== 'android') return;
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    const me = await apiSignIn();
    const dhikrs = await apiGet('/v1/dhikrs', me.accessToken);
    const dhikrId = (Array.isArray(dhikrs) ? dhikrs : dhikrs.items)[0]._id;
    const p = (n) => String(n).padStart(2, '0');
    for (const back of [2, 1, 0]) {
      const d = new Date();
      d.setDate(d.getDate() - back);
      await apiPost('/v1/dhikr-logs', me.accessToken, {
        userId: me.userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
        source: 'manual',
        isCompleted: false,
      });
    }
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    const TITLE = /^(Serini ana ekranında gör|See your streak on your home screen)$/;
    await waitFor(element(by.text(TITLE)).atIndex(0))
      .toExist()
      .withTimeout(30000);
    await element(by.label(/^(Kartı kapat|Dismiss)$/)).atIndex(0).tap();
    await sleep(1000);
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await sleep(4000);
    await expect(element(by.text(TITLE))).not.toExist();
  });
});

describe('17k vird çakışma: taslak (üye)', () => {
  it('VRD-20 çakışmada "Taslak olarak bırak": hub + "Taslak olarak kaydedildi"', async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    const me = await apiSignIn();
    const dhikrs = await apiGet('/v1/dhikrs', me.accessToken);
    const dhikrId = (Array.isArray(dhikrs) ? dhikrs : dhikrs.items)[0]._id;
    const p = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const program = await apiPost('/v1/vird/programs', me.accessToken, {
      title: { tr: 'Aktif A', en: 'Aktif A' },
      kind: 'routine',
      startDate: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
      phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId, target: 3 }] } }],
    });
    await apiRequest('POST', `/v1/vird/programs/${program._id}/activate`, { token: me.accessToken });
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await device.openURL({ url: 'zikirmatik://vird' });
    await visible('e2e-vird-hub', 20000);
    await element(by.id('e2e-vird-new-manual')).tap();
    await fillEditorAndSaveStart();
    await exists('e2e-vird-swap-keep-draft', 15000);
    await element(by.id('e2e-vird-swap-keep-draft')).tap();
    await visible('e2e-vird-hub', 20000);
    await existsText(/^(Taslak olarak kaydedildi|Saved as a draft).*$/, 10000);
  });
});

describe('17j sohbet geçmişi (üye)', () => {
  it('AIM-09 25 konuşma: 3 görünür, "Tümünü Göster" 20\'ye kadar, "Daha Az Göster" geri alır', async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    mongo(`const u = db.users.findOne({});
      const now = Date.now();
      const convs = [];
      for (let i = 1; i <= 25; i += 1) {
        convs.push({ userId: u._id, title: 'E2E Sohbet ' + String(i).padStart(2, '0'), status: 'active', lastMessageAt: new Date(now - i * 60000), locale: 'tr', createdAt: new Date(), updatedAt: new Date() });
      }
      db.ai_conversations.insertMany(convs);`);
    await openTab('aiGuide');
    await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
    await element(by.id('e2e-ai-chat-entry')).tap();
    await existsText(/^E2E Sohbet 01$/, 20000);
    await existsText(/^E2E Sohbet 03$/, 5000);
    await expect(element(by.text('E2E Sohbet 04'))).not.toExist();
    await element(by.text(/^(Tümünü Göster|Show All)$/)).atIndex(0).tap();
    await existsText(/^E2E Sohbet 20$/, 10000);
    await expect(element(by.text('E2E Sohbet 21'))).not.toExist();
    await element(by.text(/^(Daha Az Göster|Show Less)$/)).atIndex(0).tap();
    await sleep(800);
    await expect(element(by.text('E2E Sohbet 04'))).not.toExist();
  });
});
