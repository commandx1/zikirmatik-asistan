/* global element, by, waitFor, device */
// Promo video 3 kaydı ("Halka"): mock-Google ile giriş (kayıt derlemesi "Ahmet" —
// bkz. .detoxrc.js ios.record) → premium seed → halka kur → davet kodu → (ucuz
// bonus) API üzerinden ikinci bir üye katılır → oturumda dokun, toplam yükselir →
// halka detayında üyeler + ilerleme. Yalnızca apps/promo-video/scripts/record.mjs
// tarafından tetiklenir (bkz. ../jest.config.js testPathIgnorePatterns).
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  visible,
  exists,
  scrollTo,
  seed,
  readText,
  tapWhenHittable,
  dismissIfShown,
} = require('../helpers');

const IDS = {
  welcomeLater: 'e2e-home-welcome-later',
  homeScroll: 'e2e-home-scroll',
  circleHomeCard: 'e2e-circle-home-card',
  hub: 'e2e-circle-hub',
  newCircle: 'e2e-circle-new',
  pickDhikr: 'e2e-circle-pick-dhikr',
  pickerSearch: 'e2e-vird-picker-search',
  pickerRow: 'e2e-vird-picker-row',
  submit: 'e2e-circle-submit',
  code: 'e2e-circle-code',
  sessionStart: 'e2e-circle-session-start',
  sessionCounter: 'e2e-circle-session-counter',
  sessionClose: 'e2e-circle-session-close',
};

const API_URL = process.env.E2E_API_URL || 'http://127.0.0.1:3000';
const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));

// Bu makinede (paralel Docker/API/xcodebuild yükü altında, canlı denemede doğrulandı) düz
// waitFor(...).toBeVisible() bazen JS thread meşgulken zaman aşımına uğruyor, oysa ekran
// aslında doğru/filtrelenmiş durumda (kayıttan doğrulandı). Görünürlük onayı beklemek yerine
// DOKUNUŞUN KENDİSİNİ tekrar dene (story-counter.e2e.js'teki tapAtIndexWhenHittable ile aynı
// desen) — senkronizasyon takılmasına karşı daha dayanıklı.
async function tapAtIndexWhenHittable(id, index, { retries = 10, delayMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await element(by.id(id)).atIndex(index).tap();
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function apiJson(method, urlPath, { token, body } = {}) {
  const res = await fetch(`${API_URL}${urlPath}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${urlPath} -> ${res.status}: ${JSON.stringify(json)}`);
  return json.data ?? json;
}

// Ana e2e hesabından (e2e-user) FARKLI bir sub — AUTH_ALLOW_INSECURE_TEST_TOKENS
// altında idToken JSON'undaki her claim seti ayrı bir kullanıcı sayılır, bu yüzden
// bu ikinci "cihaz" gerçek bir ikinci üye olarak katılabilir.
async function apiSignInSecondMember() {
  return apiJson('POST', '/v1/auth/provider/verify', {
    body: {
      provider: 'google',
      platform: 'ios',
      idToken: JSON.stringify({ sub: 'e2e-user-2', email: 'e2e-2@example.com', name: 'Fatma' }),
      deviceId: 'e2e-detox-node-2',
    },
  });
}

const markers = {};
function mark(name) {
  markers[name] = Date.now();
}
function writeMarkers() {
  fs.writeFileSync(process.env.STORY_MARKERS_PATH, JSON.stringify({ beats: markers }, null, 2));
}

describe('recording: story-circle', () => {
  // story-vird'de görülen freshSignIn + relaunch + seed kümülatif süresine karşı önlem
  // (bkz. story-vird.e2e.js yorumu) — varsayılan 180000ms'nin üstüne açıkça çıkılır.
  it('premium kullanıcı halka kurar, ikinci üye katılır, oturumda toplam yükselir', async () => {
    await freshSignIn();
    seed('--premium e2e-user');
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await PAUSE(500);

    // --- Beat A: "Zikir Halkası kur" (scene 2 başlangıcı) ---
    mark('A');
    await dismissIfShown(IDS.welcomeLater, 4000);
    await scrollTo(IDS.circleHomeCard, IDS.homeScroll);
    await element(by.id(IDS.circleHomeCard)).tap();
    await exists(IDS.hub, 15000);
    await PAUSE(400);

    await element(by.id(IDS.newCircle)).tap();
    await visible(IDS.pickDhikr, 10000);
    await element(by.id(IDS.pickDhikr)).tap();
    // İlk satır (picker sırasına göre) bir aile videosuna uymayan bir zikir çıkabiliyordu
    // ("Camiden çıkarken İblis'ten Sığınma" — canlı denemede görüldü). Arama katalog
    // transliterasyonuna göre filtreler (vird-dhikr-picker-modal.tsx) — "salavat" kelimesinin
    // kendisi salavat.mjs transliterasyonlarında hiç geçmiyor (hepsi "Allâhümme salli..." ile
    // başlıyor), bu yüzden "salli" arandı (14 salavat kaleminin tümünde var, apps/api/scripts/
    // data/salavat.mjs doğrulandı) — evrensel/aile dostu bir zikre daraltır, ilk sonucu seç.
    // circle-create-screen.tsx'in onAdd'ı seçimde modalı KENDİLİĞİNDEN kapatır (ayrı bir
    // "Bitti" dokunuşu GEREKMEZ — denendi, klavye/sheet yeniden konumlanırken satır
    // dokunuşuyla çakışıp seçimi hiç kaydetmeden modalı kapatıyordu). Satırın gerçekten
    // render/sabit olduğunu doğrulamak için typeText sonrası ayrıca beklenir.
    await exists(IDS.pickerRow, 20000);
    // autoFocus (vird-dhikr-picker-modal.tsx) sheet açılış animasyonuyla yarışıyor — canlı
    // denemede typeText'in (karakter karakter tuş simülasyonu) hiç yazmadığı VEYA yarım
    // yazdığı ("sall") görüldü, muhtemelen animasyon/klavye açılışıyla çakışıyor. replaceText
    // (tek seferde atomik değer ataması — bu dosyada zaten kullanılan bir desen değil ama
    // 03-vird-guided-session.e2e.js'te editorTitle için kullanılıyor) tuş simülasyonu
    // içermediği için bu yarış durumuna girmiyor.
    await visible(IDS.pickerSearch, 5000);
    await element(by.id(IDS.pickerSearch)).tap();
    await PAUSE(400);
    await element(by.id(IDS.pickerSearch)).replaceText('salli');
    await PAUSE(1200);
    const searchText = await readText(IDS.pickerSearch);
    if (!searchText.includes('salli')) {
      await element(by.id(IDS.pickerSearch)).replaceText('salli');
      await PAUSE(1200);
    }
    // Bu makinede (paralel Docker/API/xcodebuild yükü altında, canlı denemede doğrulandı) düz
    // waitFor(...).toBeVisible() JS thread meşgulken zaman aşımına uğrayabiliyor — kayıttan
    // ekranın aslında doğru/filtrelenmiş olduğu doğrulandı. Görünürlük onayı yerine dokunuşun
    // KENDİSİNİ tekrar dene.
    await PAUSE(1000);
    await tapAtIndexWhenHittable(IDS.pickerRow, 0);
    // Seçim başarılıysa modal kapanır (picker testID'leri artık yok); başarısızsa (kaydolmadı)
    // kısa bir yeniden deneme yapılır.
    try {
      await waitFor(element(by.id(IDS.pickerRow))).not.toExist().withTimeout(10000);
    } catch {
      await tapAtIndexWhenHittable(IDS.pickerRow, 0);
      await waitFor(element(by.id(IDS.pickerRow))).not.toExist().withTimeout(10000);
    }
    await PAUSE(400);
    await tapWhenHittable(IDS.submit);

    await visible(IDS.code, 20000);
    const code = await readText(IDS.code);
    await PAUSE(600);

    // Ucuz bonus: ikinci üye API üzerinden katılır (Detox etkileşimi olmadan) —
    // sonraki ekranda üye listesi 2 kişi gösterir.
    try {
      const auth = await apiSignInSecondMember();
      await apiJson('POST', '/v1/circles/join', { token: auth.accessToken, body: { code } });
    } catch (err) {
      console.warn('[story-circle] ikinci üye katılamadı, tek üyeyle sürdürülüyor', err);
    }

    // --- Beat B: "Herkesin çektiği tek bir toplamda birleşir" (scene 3) ---
    mark('B');
    await visible(IDS.sessionStart, 10000);
    await tapWhenHittable(IDS.sessionStart);
    await visible(IDS.sessionCounter, 15000);
    await PAUSE(400);

    // BİLİNEN SAPMA (canlı denemede 3 kez doğrulandı): recordVideo'nun toplam kayıt süresi bu
    // makinede ~97s civarında bir tavana çarpıyor — test içi bekleme UZATILDIKÇA raw dosyanın
    // toplam süresi BÜYÜMÜYOR (97.65s / 97.2s, neredeyse birebir aynı, 4000ms VE 8000ms
    // beklemeyle de). Demek ki geç kalan içerik boşa gidiyor; asıl düzeltme Beat C'ye kadar
    // olan duvar saati bütçesini kısaltmak — dokunuş sayısı ve ara beklemeler azaltıldı, C
    // içeriği tavana çarpmadan ÖNCE gerçekleşsin diye.
    await device.disableSynchronization();
    for (let i = 0; i < 4; i += 1) {
      await element(by.id(IDS.sessionCounter)).tap();
      await PAUSE(600);
    }
    await device.enableSynchronization();
    await PAUSE(400);

    await tapWhenHittable(IDS.sessionClose);

    // --- Beat C: "Halkanın ilerlemesini ve üyelerini tek ekranda görürsün" (scene 4) ---
    mark('C');
    await visible(IDS.code, 15000);
    await PAUSE(1000);

    // BİLİNEN SAPMA (5 canlı denemede doğrulandı, koordinatörün onayıyla): `simctl io
    // recordVideo`, SIGINT ile durdurulduğunda son birkaç saniyeyi (~5-8s, tutarsız/değişken —
    // duvar saati tavanı DEĞİL, doğrulandı: ham süre test uzunluğuyla orantılı büyüyor) tutarlı
    // biçimde kaybediyor. Ne dwell'i uzatmak (4/6/8s) ne de öncesini kısaltmak sorunu
    // gidermedi — kayıp SIGINT'e en yakın parçayı yiyor, o parça hep hedef içerikle çakışıyor.
    // RichVideo01'in kendi relaunch payoff'unda kullandığı aynı çözüm burada da uygulanır
    // (bkz. src/RichVideo.tsx RELAUNCH_SETTLED_IMAGE / SettledImage): video yerine, TAM BU
    // ANDA ayrı bir `simctl io screenshot` ile durağan bir PNG yakalanır — video kaydının
    // kırpılmasından tamamen bağımsız, anlık bir yakalama. RichVideoGeneric.tsx scene 4'te
    // (video 3) bu görüntüyü statik <Img> olarak kullanır.
    const screenshotPath = path.resolve(
      __dirname,
      '../../../promo-video/public/recordings/circle-detail-settled.png'
    );
    execFileSync('xcrun', ['simctl', 'io', 'booted', 'screenshot', screenshotPath]);

    await PAUSE(1200);

    mark('end');
    writeMarkers();
  }, 300000);
});
