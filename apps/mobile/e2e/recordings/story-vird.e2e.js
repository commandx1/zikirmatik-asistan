/* global element, by, waitFor, device */
// Promo video 2 kaydı ("Vird"): mock-Google ile giriş (kayıt derlemesi "Ahmet" —
// üstbilgide "E2E Kullanıcı" GÖRÜNMEZ, bkz. .detoxrc.js ios.record) → premium seed →
// vird hub → "Sabah" şablonunu seç → başlat → rehberli seansta gerçek sayım + gerçek
// "Sonraki" geçişi + birkaç "Atla" geçişi, ardından seans ekranını kapat (BİLİNEN SAPMA:
// "gün tamamlandı" banner'ına kadar gitmiyor — bkz. aşağıdaki yorum) → hatırlatma
// ayarları ekranı görünür kalır. Yalnızca apps/promo-video/scripts/record.mjs tarafından
// tetiklenir (bkz. ../jest.config.js testPathIgnorePatterns).
const fs = require('node:fs');
const { freshSignIn, relaunch, waitForHome, skipTourIfShown, visible, scrollTo, seed, dismissNativeReviewPromptIfShown, tapWhenHittable } = require('../helpers');

const IDS = {
  virdEmptyCta: 'e2e-vird-empty-cta',
  homeScroll: 'e2e-home-scroll',
  hub: 'e2e-vird-hub',
  templatesEntry: 'e2e-vird-templates-entry',
  templateCardMorning: 'e2e-vird-template-card-klasik-sabah',
  templateStart: 'e2e-vird-template-start',
  todayStartMorning: 'e2e-vird-today-start-morning',
  session: 'e2e-vird-session',
  sessionCounter: 'e2e-vird-session-counter',
  sessionNext: 'e2e-vird-session-next',
  sessionSkip: 'e2e-vird-session-skip',
  sessionFinish: 'e2e-vird-session-finish',
  sessionClose: 'e2e-vird-session-close',
  todayDone: 'e2e-vird-today-done',
  reminderSettings: 'e2e-vird-reminder-settings',
};

const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));

const markers = {};
function mark(name) {
  markers[name] = Date.now();
}
function writeMarkers() {
  fs.writeFileSync(process.env.STORY_MARKERS_PATH, JSON.stringify({ beats: markers }, null, 2));
}

describe('recording: story-vird', () => {
  // Varsayılan 180000ms (e2e/recordings/jest.config.js) freshSignIn (~35-70s) + relaunch +
  // seed + gezinme + seans kümülatifiyle sınırda kalıyordu (canlı denemede aşıldı) — bu
  // spec için açıkça uzatılır.
  it('premium kullanıcı sabah şablonunu kurar ve rehberli seansı tamamlar', async () => {
    // freshSignIn() bu derlemenin (.detoxrc.js ios.record) mock-Google adını kullanır
    // ("Ahmet" — EXPO_PUBLIC_DEV_GOOGLE_NAME), "E2E Kullanıcı" HİÇ görünmez.
    await freshSignIn();
    seed('--premium e2e-user');
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await PAUSE(500);

    // --- Beat A: "Vird programını kur" (scene 2 başlangıcı) ---
    mark('A');
    await scrollTo(IDS.virdEmptyCta, IDS.homeScroll);
    await tapWhenHittable(IDS.virdEmptyCta);
    await visible(IDS.hub, 15000);
    await PAUSE(600);

    await element(by.id(IDS.templatesEntry)).tap();
    // Şablon listesi: klasik şablonlar veri kümesinde ÖNCE seed edilir (bkz.
    // CLASSIC_VIRD_TEMPLATE_SPECS, apps/api/scripts/lib/vird-template-seed.mjs) —
    // "klasik-sabah" ilk kartlardan biri, ek kaydırma gerekmedi (canlı denemede
    // gerekirse buraya bir scroll eklenir).
    await visible(IDS.templateCardMorning, 15000);
    await element(by.id(IDS.templateCardMorning)).tap();
    await PAUSE(700);

    await visible(IDS.templateStart, 15000);
    await element(by.id(IDS.templateStart)).tap();
    // Kaydet + aktive et + hub'a dön ("başlatıldı" toast'ı).
    await visible(IDS.hub, 20000);
    await PAUSE(800);

    // --- Beat B: "Rehberli seansta sıradaki zikre sen geçersin" (scene 3) ---
    mark('B');
    await visible(IDS.todayStartMorning, 15000);
    await element(by.id(IDS.todayStartMorning)).tap();
    await visible(IDS.session, 15000);
    await PAUSE(700);

    // İlk zikir (klasik-sabah'ta hedefi 100 — bkz. apps/api/scripts/data/sabahZikirleri.mjs):
    // gerçek sayım (~6 dokunuş, tempolu) kamerada "sayma" hissini verir, ama hedefe
    // ulaşmaz — bu yüzden "Sonraki" burada GÖSTERİLMEZ, geçiş "Atla" ile yapılır.
    await device.disableSynchronization();
    for (let i = 0; i < 6; i += 1) {
      await element(by.id(IDS.sessionCounter)).tap();
      await PAUSE(700);
    }
    await device.enableSynchronization();
    await PAUSE(400);
    await element(by.id(IDS.sessionSkip)).tap();
    await PAUSE(500);

    // İkinci zikir: klasik-sabah'taki küçük hedefli kalemlerden biri (3/7/10 — dataset'e
    // göre değişebilir) — GERÇEK hızda hedefe ulaşana kadar say, gerçek "Sonraki" düğmesi
    // belirsin ve ona dokunulsun (görev notu: "skip run"dan önce en az bir gerçek 'Sonraki'
    // geçişi gerçek hızda görünür olmalı). En fazla 12 dokunuşla dener; ulaşmazsa "Atla"ya
    // düşer (bilinen sapma, ama küçük hedefli kalemler için beklenmez).
    await device.disableSynchronization();
    let reachedNext = false;
    for (let i = 0; i < 12; i += 1) {
      await element(by.id(IDS.sessionCounter)).tap();
      await PAUSE(500);
      try {
        await waitFor(element(by.id(IDS.sessionNext))).toBeVisible().withTimeout(250);
        reachedNext = true;
        break;
      } catch {
        // henüz hedefe ulaşılmadı
      }
    }
    await device.enableSynchronization();
    await PAUSE(400);
    if (reachedNext) {
      await element(by.id(IDS.sessionNext)).tap();
    } else {
      await element(by.id(IDS.sessionSkip)).tap();
    }
    await PAUSE(500);

    // BİLİNEN SAPMA (canlı denemede iki kez doğrulandı, koordinatörün onayıyla): "Atla"
    // (goNext) yalnızca currentIndex'i ilerletir, item'ı TAMAMLANMIŞ işaretlemez — bu yüzden
    // "gün tamamlandı" durumuna salt "Atla" ile ulaşmak yapısal olarak mümkün değil
    // (pickNextIndex her zaman bir sonraki TAMAMLANMAMIŞ item'ı döner; sonunda hiçbiri
    // tamamlanmadığı için "Sonraki"/"Atla" ikisi de kaybolur ama allDone hiç true olmaz —
    // ilk denemede 180s test timeout, ikinci denemede 10s'lik sessionFinish beklemesi
    // zaman aşımına uğradı). Bunun yerine ilk gerçek "Sonraki" geçişinden sonra sınırlı
    // sayıda "Atla" ile birkaç zikir geçişi daha göster, ardından seans ekranını KAPAT —
    // beat "gün tamamlandı" banner'ında değil, seans ekranında sona erer.
    for (let i = 0; i < 3; i += 1) {
      try {
        await element(by.id(IDS.sessionSkip)).tap();
      } catch {
        break;
      }
      await PAUSE(500);
    }
    await PAUSE(500);
    await dismissNativeReviewPromptIfShown(1500);
    await tapWhenHittable(IDS.sessionClose);

    // --- Beat C: "Hatırlatmalar düzenini korur" (scene 4) ---
    mark('C');
    await visible(IDS.hub, 15000);
    // scrollTo() durur durur durmaz (kart %75 görünür eşiğini geçer geçmez) — kart viewport'tan
    // daha uzun (Hatırlatmalar başlığı → 4 dilim anahtarı → sabit saatler → "Konumu kullan"),
    // bu yüzden ilk "görünür" anda alt kısım (buton) hâlâ ekranın dışında kalıyordu (canlı
    // denemede doğrulandı). Ek bir manuel kaydırmayla kart ekranın ortasına doğru iter,
    // ardından uzun bir bekleme: kompozisyonun kaynak penceresinin TAMAMI yerleşmiş kartı
      // yakalasın.
    await scrollTo(IDS.reminderSettings, IDS.hub);
    await element(by.id(IDS.hub)).scroll(220, 'down');
    // 2500ms bir denemede kartın TAM yerleşmesinden (kaydırma momentumu geç sönüyor) sonra
    // yalnızca ~1.4s temiz pencere bırakıyordu (kompozisyonun scene 4 çıktı bütçesi ~2.16s) —
    // uzatıldı, gerçek hızda (rate=1.0, blank-frame hatasına karşı) yeterli marj için.
    await PAUSE(3800);

    mark('end');
    writeMarkers();
  }, 300000);
});
