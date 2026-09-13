// Türkiye'nin 81 ili — plaka kodu sırasıyla (01 Adana .. 81 Düzce) — il
// merkezinin yaklaşık koordinatları ile. Yalnızca vakit hesabı (bkz.
// services/prayer-times.ts) için kullanılır; hassas jeodezik bir kaynak
// DEĞİLDİR, il merkezine birkaç km mesafede bir konum kullanır (bu, namaz
// vakitlerini yalnızca saniyeler mertebesinde etkiler — kabul edilebilir).
//
// Kaynak: kamuya açık, yaygın olarak yayımlanan il merkezi enlem/boylam
// değerleri (ör. Türkiye İstatistik Kurumu / OpenStreetMap Nominatim ile
// tutarlı genel amaçlı referanslar). Telif hakkı taşımayan coğrafi olgu
// verisidir.
export type TrProvince = {
  /** ASCII, küçük harf, tireden arınmış kararlı anahtar (ör. "istanbul",
   * "kahramanmaras", "afyonkarahisar") — reminderPrefs.provinceKey burada
   * saklanır. */
  key: string;
  /** Görüntülenecek Türkçe il adı. */
  name: string;
  lat: number;
  lng: number;
};

export const TR_PROVINCES: readonly TrProvince[] = [
  { key: "adana", name: "Adana", lat: 37.0, lng: 35.3213 },
  { key: "adiyaman", name: "Adıyaman", lat: 37.7648, lng: 38.2786 },
  { key: "afyonkarahisar", name: "Afyonkarahisar", lat: 38.7507, lng: 30.5567 },
  { key: "agri", name: "Ağrı", lat: 39.7191, lng: 43.0503 },
  { key: "amasya", name: "Amasya", lat: 40.6499, lng: 35.8353 },
  { key: "ankara", name: "Ankara", lat: 39.9334, lng: 32.8597 },
  { key: "antalya", name: "Antalya", lat: 36.8969, lng: 30.7133 },
  { key: "artvin", name: "Artvin", lat: 41.1828, lng: 41.8183 },
  { key: "aydin", name: "Aydın", lat: 37.856, lng: 27.8416 },
  { key: "balikesir", name: "Balıkesir", lat: 39.6484, lng: 27.8826 },
  { key: "bilecik", name: "Bilecik", lat: 40.1506, lng: 29.9792 },
  { key: "bingol", name: "Bingöl", lat: 38.8855, lng: 40.4966 },
  { key: "bitlis", name: "Bitlis", lat: 38.3938, lng: 42.1232 },
  { key: "bolu", name: "Bolu", lat: 40.7392, lng: 31.6089 },
  { key: "burdur", name: "Burdur", lat: 37.7203, lng: 30.2908 },
  { key: "bursa", name: "Bursa", lat: 40.1885, lng: 29.061 },
  { key: "canakkale", name: "Çanakkale", lat: 40.1553, lng: 26.4142 },
  { key: "cankiri", name: "Çankırı", lat: 40.6013, lng: 33.6134 },
  { key: "corum", name: "Çorum", lat: 40.5506, lng: 34.9556 },
  { key: "denizli", name: "Denizli", lat: 37.7765, lng: 29.0864 },
  { key: "diyarbakir", name: "Diyarbakır", lat: 37.9144, lng: 40.2306 },
  { key: "edirne", name: "Edirne", lat: 41.6771, lng: 26.5557 },
  { key: "elazig", name: "Elazığ", lat: 38.681, lng: 39.2264 },
  { key: "erzincan", name: "Erzincan", lat: 39.75, lng: 39.5 },
  { key: "erzurum", name: "Erzurum", lat: 39.9, lng: 41.27 },
  { key: "eskisehir", name: "Eskişehir", lat: 39.7767, lng: 30.5206 },
  { key: "gaziantep", name: "Gaziantep", lat: 37.0662, lng: 37.3833 },
  { key: "giresun", name: "Giresun", lat: 40.9128, lng: 38.3895 },
  { key: "gumushane", name: "Gümüşhane", lat: 40.4386, lng: 39.5086 },
  { key: "hakkari", name: "Hakkari", lat: 37.5744, lng: 43.7408 },
  { key: "hatay", name: "Hatay", lat: 36.4018, lng: 36.3498 },
  { key: "isparta", name: "Isparta", lat: 37.7648, lng: 30.5566 },
  { key: "mersin", name: "Mersin", lat: 36.8, lng: 34.6333 },
  { key: "istanbul", name: "İstanbul", lat: 41.0082, lng: 28.9784 },
  { key: "izmir", name: "İzmir", lat: 38.4237, lng: 27.1428 },
  { key: "kars", name: "Kars", lat: 40.6013, lng: 43.0975 },
  { key: "kastamonu", name: "Kastamonu", lat: 41.3887, lng: 33.7827 },
  { key: "kayseri", name: "Kayseri", lat: 38.7312, lng: 35.4787 },
  { key: "kirklareli", name: "Kırklareli", lat: 41.7333, lng: 27.2167 },
  { key: "kirsehir", name: "Kırşehir", lat: 39.1425, lng: 34.1709 },
  { key: "kocaeli", name: "Kocaeli", lat: 40.8533, lng: 29.8815 },
  { key: "konya", name: "Konya", lat: 37.8746, lng: 32.4932 },
  { key: "kutahya", name: "Kütahya", lat: 39.4242, lng: 29.9833 },
  { key: "malatya", name: "Malatya", lat: 38.3552, lng: 38.3095 },
  { key: "manisa", name: "Manisa", lat: 38.6191, lng: 27.4289 },
  { key: "kahramanmaras", name: "Kahramanmaraş", lat: 37.5753, lng: 36.9228 },
  { key: "mardin", name: "Mardin", lat: 37.3212, lng: 40.7245 },
  { key: "mugla", name: "Muğla", lat: 37.2153, lng: 28.3636 },
  { key: "mus", name: "Muş", lat: 38.9462, lng: 41.7539 },
  { key: "nevsehir", name: "Nevşehir", lat: 38.6939, lng: 34.6857 },
  { key: "nigde", name: "Niğde", lat: 37.9667, lng: 34.6833 },
  { key: "ordu", name: "Ordu", lat: 40.9839, lng: 37.8764 },
  { key: "rize", name: "Rize", lat: 41.0201, lng: 40.5234 },
  { key: "sakarya", name: "Sakarya", lat: 40.694, lng: 30.4358 },
  { key: "samsun", name: "Samsun", lat: 41.2867, lng: 36.33 },
  { key: "siirt", name: "Siirt", lat: 37.9333, lng: 41.95 },
  { key: "sinop", name: "Sinop", lat: 42.0231, lng: 35.1531 },
  { key: "sivas", name: "Sivas", lat: 39.7477, lng: 37.0179 },
  { key: "tekirdag", name: "Tekirdağ", lat: 40.9833, lng: 27.5167 },
  { key: "tokat", name: "Tokat", lat: 40.3167, lng: 36.55 },
  { key: "trabzon", name: "Trabzon", lat: 41.0027, lng: 39.7168 },
  { key: "tunceli", name: "Tunceli", lat: 39.1079, lng: 39.5401 },
  { key: "sanliurfa", name: "Şanlıurfa", lat: 37.1591, lng: 38.7969 },
  { key: "usak", name: "Uşak", lat: 38.6823, lng: 29.4082 },
  { key: "van", name: "Van", lat: 38.4891, lng: 43.4089 },
  { key: "yozgat", name: "Yozgat", lat: 39.8181, lng: 34.8147 },
  { key: "zonguldak", name: "Zonguldak", lat: 41.4564, lng: 31.7987 },
  { key: "aksaray", name: "Aksaray", lat: 38.3687, lng: 34.036 },
  { key: "bayburt", name: "Bayburt", lat: 40.2552, lng: 40.2249 },
  { key: "karaman", name: "Karaman", lat: 37.1759, lng: 33.2287 },
  { key: "kirikkale", name: "Kırıkkale", lat: 39.8468, lng: 33.5153 },
  { key: "batman", name: "Batman", lat: 37.8812, lng: 41.1351 },
  { key: "sirnak", name: "Şırnak", lat: 37.4187, lng: 42.4918 },
  { key: "bartin", name: "Bartın", lat: 41.6344, lng: 32.3375 },
  { key: "ardahan", name: "Ardahan", lat: 41.1105, lng: 42.7022 },
  { key: "igdir", name: "Iğdır", lat: 39.9167, lng: 44.0333 },
  { key: "yalova", name: "Yalova", lat: 40.65, lng: 29.2667 },
  { key: "karabuk", name: "Karabük", lat: 41.2061, lng: 32.6204 },
  { key: "kilis", name: "Kilis", lat: 36.7184, lng: 37.1212 },
  { key: "osmaniye", name: "Osmaniye", lat: 37.0742, lng: 36.2478 },
  { key: "duzce", name: "Düzce", lat: 40.8438, lng: 31.1565 }
];

export function findProvinceByKey(key: string): TrProvince | undefined {
  const normalized = key.trim().toLowerCase();
  return TR_PROVINCES.find((province) => province.key === normalized);
}
