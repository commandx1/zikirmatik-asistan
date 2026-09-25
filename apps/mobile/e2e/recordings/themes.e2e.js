// Promo video kaydı: misafir → Profil → Tema Seçimi → 3-4 temayı sırayla dener, her birinde
// bekler → sayaca döner. Yalnızca apps/promo-video/scripts/record.mjs tarafından tetiklenir.
//
// BİLİNEN SINIR: theme-grid-section.tsx'teki tema kartları (Pressable) hiçbir testID/label
// taşımıyor (apps/mobile/src'ye dokunmadan eklenemedi — bu görevin kısıtı), bu yüzden tek tek
// tema seçilemiyor; bu spec yalnızca ekrana gidip bekler (kart üstünde elle dokunmayı Quartz
// script'i tamamlar). Bu spec canlı simülatörde doğrulanmadı — pilot-05 klibi kanıtlanmış
// Quartz manuel yöntemiyle çekildi.
const { freshSignIn, openTab, IDS, visible } = require('../helpers');

const PAUSE = (ms) => new Promise((r) => setTimeout(r, ms));

describe('recording: themes', () => {
  it('profile açar (Tema Seçimi satırının testID\'si yok, kalan gezinme manuel)', async () => {
    await freshSignIn();
    await openTab('profile');
    await visible(IDS.tabMore);
    await PAUSE(1500);
  });
});
