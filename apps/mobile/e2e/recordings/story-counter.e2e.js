/* global element, by, waitFor, device */
// Promo video 1 kaydı ("Sayarken şaşırma"): TAZE MİSAFİR → Koleksiyonlar → "Günlük" filtresi
// → ilk koleksiyon → ilk zikir kartı (Arapça/okunuş/anlam görünür) → "Sayaca Ekle" → sayaca
// hedefe kadar (33×) dokun → tamamlanma animasyonu → uygulamayı sonlandır + yeniden başlat →
// sayı korunmuş halde sayaç. Yalnızca apps/promo-video/scripts/record.mjs tarafından
// tetiklenir (normal `pnpm test:detox:ios` bu klasörü atlar, bkz. ../jest.config.js).
//
// freshSignIn() KULLANILMAZ: o mock-Google girişiyle e2e test hesabına geçer ("Selam, E2E
// Kullanıcı") — bu video taze bir MİSAFİR oturumu göstermeli (üst bilgide test hesabı adı
// görünmemeli).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { waitForHome, skipTourIfShown, openTab } = require('../helpers');

// testID değerleri src/test-ids.ts ile aynı olmalı.
const IDS = {
  filterChip: 'e2e-collection-filter-chip',
  card: 'e2e-collection-card',
  addToCounter: 'e2e-collection-add-to-counter',
  detailScroll: 'e2e-collection-detail-scroll',
  counter: 'e2e-home-counter',
  // screen.tsx: PagerView, bir kategori (sayfa) başına bir FlatList, testID `${scroll}-${key}`
  // (src/test-ids.ts, apps/mobile/e2e/recordings/story-counter.e2e.js için eklendi — bkz. rapor).
  gunlukScroll: 'e2e-collection-scroll-gunluk',
};

// İlk "Günlük" koleksiyonun (gunluk-tesbih) ilk zikri: recommendedCount 33
// (apps/api/scripts/data/gunlukTesbih.mjs) — storyboard'daki "33'te haber verir" buna dayanır.
const TARGET_COUNT = 33;
// Ölçüldü: Detox'un HER .tap() öncesi/sonrası varsayılan senkronizasyon beklemesi (RN JS
// thread boşta mı) tek dokunuş için gerçekte ~2-2.5s wall-clock harcıyor — 700ms bekleme ile
// bile 33 dokunuş 82-94s'ye çıktı (retry yokken de). device.disableSynchronization() bunu
// atlar (buton zaten görünür/sabit; kendi PAUSE'umuz gerçek tempoyu veriyor).
const TAP_DELAY_MS = 300; // ~0.3s/dokunuş ≈ 10s toplam (storyboard)

const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));

// tapWhenHittable (helpers.js) uses a bare by.id() match, which fails with "multiple elements"
// for testIDs repeated per list row (addToCounter). Same retry, but atIndex().
async function tapAtIndexWhenHittable(id, index, { retries = 6, delayMs = 300 } = {}) {
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

// Demo durumu (yalnız bu kayıt betiği; uygulama kodu DEĞİŞMEZ): misafir için 5 günlük seri
// (bugün dahil) + düşük lifetimeCount → 33. dokunuşta count-100 rozeti tetiklenmez, üst bilgide
// "Seri 5 gün" görünür. dhikr-store-v1 (zustand persist v5) AsyncStorage manifest'ine yazılır.
const BUNDLE_ID = 'com.zikirmatik_asistan.app';
function localDayKey(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
async function seedDemoStreak() {
  await PAUSE(1500); // persist yazımları diske insin
  await device.terminateApp();
  const dataDir = execFileSync('xcrun', ['simctl', 'get_app_container', device.id, BUNDLE_ID, 'data']).toString().trim();
  const storeDir = path.join(dataDir, 'Library/Application Support', BUNDLE_ID, 'RCTAsyncLocalStorage_V1');
  const manifestPath = path.join(storeDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const key = 'dhikr-store-v1';
  const filePath = path.join(storeDir, crypto.createHash('md5').update(key).digest('hex'));
  let raw = manifest[key];
  if (raw == null && fs.existsSync(filePath)) raw = fs.readFileSync(filePath, 'utf8');
  const prev = raw ? JSON.parse(raw) : { state: {}, version: 5 };
  prev.state = {
    ...prev.state,
    activeDayKeys: [-4, -3, -2, -1, 0].map(localDayKey),
    lifetimeCount: 20,
  };
  manifest[key] = JSON.stringify(prev);
  if (fs.existsSync(filePath)) fs.rmSync(filePath);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  await device.launchApp({ newInstance: true });
  await waitForHome();
}

const markers = {};
function mark(name) {
  markers[name] = Date.now();
}
function writeMarkers() {
  const out = { beats: markers };
  fs.writeFileSync(process.env.STORY_MARKERS_PATH, JSON.stringify(out, null, 2));
}

describe('recording: story-counter', () => {
  it('taze misafir olarak zikir seçer, sayar, kapatıp yeniden açar', async () => {
    // Taze kurulum — freshSignIn() DEĞİL: misafir olarak kalınır.
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await waitForHome();
    await skipTourIfShown();
    await PAUSE(600);
    await seedDemoStreak();
    await PAUSE(600);

    // --- Beat A: "Zikrini seç" (bu, klibin de başlangıcı — record.mjs trimStart = A - 0.3s) ---
    mark('A');
    await openTab('collections');
    await PAUSE(700);

    // "Günlük" filtre çipi (COLLECTION_CATEGORIES: all=0, gunluk=1) — screen.tsx: her kategori
    // PagerView'da ayrı bir sayfa/FlatList; chip'e dokunmak pagerRef.setPage() ile sayfa kaydırma
    // animasyonunu tetikler, yerleşmesi için biraz daha bekle.
    await element(by.id(IDS.filterChip)).atIndex(1).tap();
    await PAUSE(1000);

    // "Günlük" kategorisi TEK koleksiyon değil (gunluk-tesbih, gunluk-sunnet-dualari,
    // aksam-zikirleri, sabah-zikirleri, ev-giris-cikis, ezan-dualari, keffaret-ul-meclis,
    // ozlu-sunnet-dualari, uyku-uyanis, yemek-dualari hepsi category='gunluk') — atIndex(0)
    // API sıralamasına göre hangi kartın geleceğini garanti etmez (bir denemede "Akşam
    // Zikirleri" çıktı, ilk zikri 10× hedefli — storyboard'un "33'te haber verir" iddiasını
    // bozdu). Başlığıyla eşleştir: "Günlük Tesbih ve Zikir" (gunluk-tesbih), ilk zikri
    // (tesbih-subhanallahil-azim-ve-bihamdihi) recommendedCount=33
    // (apps/api/scripts/data/gunlukTesbih.mjs). 10 kart 2 sütun = 5 satır — kaydırma gerekebilir;
    // src/features/collections/screen.tsx'in FlatList'ine testID eklendi (gerçekten eksikti,
    // bkz. rapor) — Günlük sayfasının kendi kaydırılabilir alanıyla hedefe kaydır.
    // PagerView "Tümü" (all) sayfasında da AYNI koleksiyon (aynı başlık metniyle) mevcut —
    // PagerView her iki sayfayı da bellekte tutar. by.text(...).withAncestor(...) denendi,
    // Detox bu ikilide de hiçbir eşleşme bulamadı (metin+ancestor birleşimi bu sürümde
    // güvenilir değil) — bunun yerine testID+ancestor+atIndex kullan: API sırasına göre
    // (curl doğrulandı) "gunluk-tesbih" Günlük kategorisinde 5. kart (index 4).
    const gunlukTesbihCard = element(
      by.id(IDS.card).withAncestor(by.id(IDS.gunlukScroll))
    ).atIndex(4);
    await waitFor(gunlukTesbihCard).toBeVisible().whileElement(by.id(IDS.gunlukScroll)).scroll(300, 'down');
    await gunlukTesbihCard.tap();
    await PAUSE(700);

    // İlk zikrin kartı: Arapça + okunuş + anlam ekranda ~2s dursun.
    await waitFor(element(by.id(IDS.addToCounter)).atIndex(0))
      .toBeVisible()
      .whileElement(by.id(IDS.detailScroll))
      .scroll(300, 'down');
    await PAUSE(2000);

    // addToCounter testID'si listedeki HER zikir kartında var (atIndex şart, tapWhenHittable
    // bare by.id() kullanır ve "multiple elements" ile başarısız olur).
    await tapAtIndexWhenHittable(IDS.addToCounter, 0);
    await PAUSE(700);

    // Sayaç ekranı (ana sayfaya döner, seçilen zikir sayaçta).
    await openTab('home');
    await waitFor(element(by.id(IDS.counter))).toBeVisible().withTimeout(10000);
    await PAUSE(600);

    // --- Beat B: "Tek dokunuşla say, 33'te haber verir" ---
    mark('B');
    await device.disableSynchronization();
    for (let i = 0; i < TARGET_COUNT; i += 1) {
      await element(by.id(IDS.counter)).tap();
      await PAUSE(TAP_DELAY_MS);
    }
    await device.enableSynchronization();
    // Tamamlanma animasyonu ~1.5s oynasın.
    await PAUSE(1500);

    // --- Beat C: "Kaldığın yerden devam" ---
    mark('C');
    await device.terminateApp();
    await PAUSE(500);
    await device.launchApp({ newInstance: false });
    await waitFor(element(by.id(IDS.counter))).toBeVisible().withTimeout(15000);
    // Sayı korunmuş: hedefe ulaşılmış sayaç yeniden gösteriliyor.
    await PAUSE(1200);

    mark('end');
    writeMarkers();
  });
});
