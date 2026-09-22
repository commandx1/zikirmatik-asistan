# Zikir ve dua başlıkları — yeniden adlandırma önerileri

Amaç: kullanıcı başlığı görünce **hangi dua olduğunu tanısın**. İslami literatürde ve
Türkiye'de halkın günlük kullanımında dua nasıl anılıyorsa başlık o olsun.

Bu dosya yalnız **öneridir**. Hiçbir veri dosyası değiştirilmedi. Onaylanan satırlar
ayrı bir adımda `apps/api/scripts/data/` altına uygulanacak.

## Adlandırma kuralları (öncelik sırasıyla)

1. **Yerleşik özel isim** varsa başlık odur (Ayetel Kürsi, Seyyidül İstiğfar, Keffaretül Meclis, sure adları, peygamber duaları).
2. **Durum duaları** durum adıyla: "Eve Girerken Okunan Dua". Aynı duruma birden çok dua varsa en meşhuru yalın adı alır.
3. **Adsız dualar** başlangıç sözleriyle: "Duası/Zikri" eki yok, cümle düzeni, ortak girişte bırakılmaz, **≤ ~50 karakter** (kalibrasyon 1 kararı). Çakışmada en meşhur kayıt yalın adı alır, diğerleri ayırt edici kelimeye kadar uzar; bileşik kayıtta başlangıç çakışıyorsa en meşhur bölüm başlık olabilir (kalibrasyon 2-4 kararı).
4. **Ayetler**: dua ayeti → başlangıç; dua olmayan ayet → "Rum Suresi 17-19. Ayetler".
5. **Esmaül Hüsna**: tema setlerinde "Ya Rezzak" biçimi. (Bu dalgada kayıt yok.)
6. **Aynı dua = aynı yalın ad**; koleksiyon/bağlam farkı başlığa girmez. **İstisna (kalibrasyon 17 kararı):** kayıt, literatürde adı olan gerçek bir durumun duasıysa (meclis, tuvalet, yolculuk, vesvese — Hısnul Müslim/El-Ezkar bölümü olan durumlar) durum adını korur; yalnız tematik bir koleksiyona konmuş kopyaysa (tövbe, kaygı, rızık seti) duanın kendi yalın adını/başlangıcını alır.
7. **Başlıktan silinenler**: tekrar sayısı, vakit, gün aralığı (DİKKAT: Recep/Şaban on günlük faz bilgisi yapısal bir alanda yok, yalnız `virtue` metninde — kalibrasyon 44), "(Uzun Form)", "(c.c.)", "—" sonrası alt başlık.
8. **İmla (TR)**: şapka yok (â î û) — Türkçeleşmiş kelimelerde de şapkasız yazılır ve yerleşik ad kullanılır ("Rüku Tesbihi"; kalibrasyon 15 kararı), Arapça terkiplerde kesme/tire yok — **istisna: kalkınca çift ünlü/yanlış okuma doğuran hemze-ayn kesmesi kalır** ("se'eleke", "vada'tü", "a'inni"; ama "eselüke") (kalibrasyon 6 kararı). Türkçe ek kesmesi kalır, düz ASCII `'`.
9. **EN**: aynı mantık; yerleşik İngilizce ad ve aksansız yaygın transliterasyon; **EN'de kesme korunur** (as'aluka, a'udhu).
10. **Diğer gerçek adlar** `tags`'e önerilir (küçük harf, Türkçe). Eski uydurma başlıklarımız tag yapılmaz.

## Güven ölçeği

| Güven | Anlamı |
|---|---|
| yüksek | Dua kesin teşhis edildi ve kural uygulaması tartışmasız. |
| orta | Teşhis kesin ama kural seçimi/imla tartışmalı, ya da yerleşik ad iddiası doğrulanmayı bekliyor. |
| düşük | Ya teşhis ya da adlandırma gerçekten belirsiz; kalibrasyon sorularında karşılığı var. |

## Bu dalgada uygulanan iki ek yorum

- **Uzunluk**: kural 3'ün "ayırt edici kelimeye kadar" şartı, `Allahümme inni euzü bike` /
  `Allahümme inni eselüke` gibi 23-25 karakterlik ortak öneklerde 40 sınırını aşıyor.
  Tamlamayı ortasından kesmemek için birkaç karakter aşıldı; **aşan her başlık not sütununda
  `(N kr)` ile işaretlendi** ve kalibrasyon sorusu 1'de toplandı.
- **Onay sütunu boş bırakıldı** — kullanıcı tarafından doldurulacak (`ok` / yeni öneri / `?`).

---

## Dalga 1 — Günlük

### sabahZikirleri.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| sabah-subhanallah-bihamdihi | Sübhânallâhi ve Bihamdihî (Sabah-Akşam × 100) | Sübhanallahi ve bihamdihi | Subhanallahi wa Bihamdihi (Morning-Evening × 100) | Subhanallahi wa bihamdihi | 3, 7, 8 | yüksek | — | Sayı ve vakit silindi; şapkalar kalktı. Kalibrasyon 2: gunlukTesbih ve sabah-subhane-la-kuvvete ile aynı sözlerle başlıyor. | |
| sabah-ihlas-muavvizeteyn | İhlâs ve Muavvizeteyn (Sabah-Akşam × 3) | İhlas ve Muavvizeteyn | Al-Ikhlas and Al-Mu'awwidhatayn (Morning-Evening × 3) | Al-Ikhlas and Al-Mu'awwidhatayn | 1, 7, 8 | yüksek | muavvizat, üç kul | Yerleşik ad korundu, yalnız sayı/vakit/şapka temizlendi. | |
| sabah-asbahnâ | Sabah ve Akşam Başlangıç Duası | Allahümme bike asbahna | Morning and Evening Opening Supplication | Allahumma bika asbahna | 3 | yüksek | — | Kullanıcının kural 3 örneğiyle birebir. Kayıt hem sabah hem akşam varyantını taşıyor; vakit başlıktan çıktı. | |
| sabah-fitrat-islam | İslâm Fıtratı Üzere Sabah Duası | Asbahna ala fıtratil İslam | Morning Supplication upon the Fitrah of Islam | Asbahna ala fitratil Islam | 3 | yüksek | fıtrat duası | Nesâî, Amelü'l-Yevm 34. Yerleşik özel adı yok, başlangıç sözlerine düşüldü. | |
| sabah-nimet-sukur | Sabah Nimet Şükrü | Allahümme ma asbaha bi min nimetin | Morning Gratitude for Blessings | Allahumma ma asbaha bi min ni'matin | 3, 8 | yüksek | — | Ebû Dâvûd 5073. "ni'metin" → kural 8 ile "nimetin". | |
| sabah-afiyet | Kapsamlı Âfiyet Duası | Allahümme inni eselükel afiyete | Comprehensive Supplication for Well-Being | Allahumma inni as'alukal afiyah | 3, 8 | yüksek | afiyet duası | Ebû Dâvûd 5074. "es'elüke" → "eselüke" (kural 8, kullanıcı örneği). | |
| sabah-bismillah-koruma | Bismillah Koruma Duası (Sabah-Akşam × 3) | Bismillahillezi la yedurru | Bismillah Protection Supplication (Morning-Evening × 3) | Bismillahilladhi la yadurru | 3, 7 | yüksek | — | Kullanıcının kural 3 örneğiyle birebir. | |
| sabah-ya-hayyu-kayyum | Yâ Hayyu Yâ Kayyûm (Sabah-Akşam) | Ya Hayyu Ya Kayyum | Ya Hayyu Ya Qayyum (Morning-Evening) | Ya Hayyu Ya Qayyum | 3, 7, 8 | yüksek | — | Vakit ve şapka silindi. Esma kuralıyla (5) tutarlı olsun diye ikinci "Ya" da büyük (Opus review). | |
| sabah-ilim-rizik-amel | Sabah Namazı Sonrası İlim-Rızık-Amel Duası | Allahümme inni eselüke ilmen nafian | Post-Fajr Supplication for Beneficial Knowledge, Provision, and Acceptable Deeds | Allahumma inni as'aluka ilman nafian | 3, 7 | yüksek | ilmen nafian, sabah namazı sonrası | İbn Mâce 925. Vakit bilgisi timeOfDay/suitableFor'da zaten var. | |
| sabah-mulk-kibriya-azamet | Sabah — Mülk, Kibriya ve Azamet Allah'ındır | Asbahna ve asbahal mülkü lillahi azze ve celle | Morning — Dominion, Majesty, and Greatness Belong to Allah | Asbahna wa asbahal mulku lillahi azza wa jall | 3, 7 | orta | — | (46 kr) sabah-mulk-rabbilalemin ile ilk 32 karakteri aynı; ayırt edici kelime "azze". Kalibrasyon 1 ve 2. | |
| sabah-nimet-afiyet-setr | Sabah — Nimet, Afiyet ve Setr'in Tamamlanması Duası | Allahümme inni asbahtü minke fi nimetin | Morning — Supplication for the Completion of Blessing, Well-Being, and Concealment | Allahumma inni asbahtu minka fi ni'matin | 3, 7 | yüksek | — | Nesâî; El-Ezkar 232. Tam 40 karakter. | |
| sabah-fatires-semavati | Fâtıres Semâvâti — Gökleri ve Yeri Yaratan Sabah Duası | Allahümme fatıres semavati vel ardı | Morning Supplication — O Originator of the Heavens and the Earth | Allahumma fatiras samawati wal ard | 3, 7, 8 | yüksek | — | Ebû Dâvûd 5083; El-Ezkar 209-210. Em dash sonrası alt başlık silindi. | |
| sabah-mulk-rabbilalemin | Sabah — Günün Hayrını, Fethini, Nurunu ve Bereketini İsteme | Asbahna ve asbahal mülkü lillahi Rabbil alemin | Morning — Seeking the Day's Good, Opening, Light, and Blessing | Asbahna wa asbahal mulku lillahi Rabbil alamin | 3, 7 | orta | — | (46 kr) sabah-mulk-kibriya-azamet ile çakışan önek; ayırt edici "Rabbil". Kalibrasyon 1 ve 2. | |
| sabah-afini-fi-bedeni | Beden, İşitme ve Görme Âfiyeti Duası (Sabah-Akşam × 3) | Allahümme afini fi bedeni | Supplication for Well-Being of Body, Hearing, and Sight (Morning-Evening × 3) | Allahumma afini fi badani | 3, 7, 8 | yüksek | — | Ebû Dâvûd 5090; El-Ezkar 220. | |
| sabah-rum-tesbihi | Rum Suresi 17-19 — Kaçırılan Zikirleri Telafi Ayetleri | Rum Suresi 17-19. Ayetler | Surah Ar-Rum 17-19 — Verses of Compensation for Missed Remembrance | Surah Ar-Rum, Verses 17-19 | 4, 7 | yüksek | fesübhanallahi hine tümsune | Dua ayeti değil, tesbih emri içeren ayet → kural 4'ün ikinci biçimi. "Telafi" konu adı uydurma, kalktı. | |
| sabah-subhane-la-kuvvete | Sabah — Havkale ve Meşîet ile Korunma Duası | Sübhanallahi ve bihamdihi la havle | Morning — Protection Through Tasbih and Submission to Allah's Will | Subhanallahi wa bihamdihi la hawla | 3, 7 | orta | — | İbn Sünnî; El-Ezkar 222. Başlangıç sabah-subhanallah-bihamdihi ile aynı, ayırt edici kelimeye ("la havle") uzatıldı. Kalibrasyon 2. | |
| sabah-euzu-billahis-semii-hasr | Haşr Sûresi Son 3 Ayet (× 3) | Haşr Suresi Son Üç Ayet | The Last 3 Verses of Surah Al-Hashr (× 3) | The Last Three Verses of Surah Al-Hashr | 1, 7, 8 | yüksek | hüvallahüllezi, lev enzelna | Türkiye'de en yaygın anılış "Haşr suresinin son üç ayeti"; incipit adı tag'e alındı (kalibrasyon 10). Kayıt ayrıca euzü formülünü de içeriyor, başlık bunu yansıtmıyor (kapsam dışı not). | |
| sabah-fecetil-hayri | Sabah — Ansızın Gelen Hayır Talebi ve Şerden Sığınma | Allahümme inni eselüke min fecetil hayri | Morning — Seeking Sudden Good and Refuge from Sudden Evil | Allahumma inni as'aluka min fuja'atil khayr | 3, 7, 8 | yüksek | — | Ebû Ya'lâ; İbn Sünnî; El-Ezkar 228. Tam 40 karakter. | |
| sabah-rabbiyallahu-tevekkel | Sabah-Akşam Tevekkül Duası — Cenneti Müjdeli | Rabbiyallahu la ilahe illa hu | Morning-Evening Supplication of Reliance — Glad Tidings of Paradise | Rabbiyallahu la ilaha illa huwa | 3, 7 | orta | — | Başlık nameArabic'e göre verildi. transliteration.tr, nameArabic'te olmayan "tevekkeltü alellahi" ibaresini araya sokuyor (kapsam dışı not). Metin aksam-hasbiyallah ile neredeyse birebir; fark yalnız ilk kelime. | |
| sabah-vehebtü-nefsi | Sabah — Nefs ve Şerefi Allah'a Bağışlama Duası | Allahümme inni kad vehebtü nefsi | Morning — Supplication of Entrusting One's Self and Honor to Allah | Allahumma inni qad wahabtu nafsi | 3, 7 | yüksek | — | Ebû Dâvûd; El-Ezkar 235. | |
| sabah-mumin-ayetulkursi | Mümin Suresi İlk 3 Ayet + Ayetü'l-Kürsî (Sabah-Akşam) | Mümin Suresi İlk Üç Ayet ve Ayetel Kürsi | First 3 Verses of Surah Ghafir (Al-Mu'min) + Ayat al-Kursi (Morning-Evening) | First Three Verses of Surah Ghafir and Ayat al-Kursi | 1, 6, 7, 8 | orta | gafir suresi, bakara 255 | Bileşik kayıt; "Ayetel Kürsi" kural 6'daki yalın ada uyduruldu ama kayıt salt Ayetel Kürsi olmadığı için bileşik başlık korundu. Tam 40 karakter. | |
| sabah-keseli-heremi-sıgınma | Tembellik, Yaşlılık ve Dünya Fitnesinden Sığınma (Sabah-Akşam) | Allahümme inni euzü bike minel keseli | Refuge from Laziness, Old Age, and Worldly Trial (Morning-Evening) | Allahumma inni a'udhu bika minal kasali | 3, 7 | yüksek | — | Müslim 2723. ozlu dosyasındaki "minel aczi" kayıtlarından ayırt edici kelimeyle ayrışıyor. | |

Değişmeyen: 0 kayıt.

### aksamZikirleri.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| aksam-emsena | Akşam Duası | Emseyna ve emsel mülkü lillah | Evening Supplication | Amsayna wa amsal mulku lillah | 3 | yüksek | — | Müslim 2723. "Akşam Duası" tek bir duayı işaret edemeyecek kadar genel; kural 3'e düşüldü. Bu duanın sabah karşılığı veri setinde yok (kapsam dışı not). | |
| aksam-kelimâtillah | Akşam Korunma Duası | Euzü bikelimatillahit tammati | Evening Protection Supplication | A'udhu bikalimatillahit tammat | 3, 8 | yüksek | kelimatüt tammat | Müslim 2708. Vakte bağlı değil, her an okunur; "Akşam" başlıktan çıktı. | |
| aksam-arş-melekleri | Tevhide Şahitlik Duası | Allahümme inni emseytü üşhidüke | Supplication Bearing Witness to Tawhid | Allahumma inni amsaytu ushhiduka | 3 | yüksek | — | Ebû Dâvûd 5069. Metin akşama özgü ("emseytü"); sabah varyantı ("asbahtü") ayrı kayıt olarak yok. | |
| aksam-razi-oldum | İman ve Razılık Duası | Raditü billahi Rabben | Supplication of Faith and Contentment | Raditu billahi Rabban | 3, 8 | orta | rıza duası | Ebû Dâvûd 5072; Tirmizî 3389. Şapka kalkınca "Radîtü" → "Raditü"; okunuş kaybı kalibrasyon 5'te. | |
| aksam-hasbiyallah | Hasbiyallah Duası | Hasbiyallahu la ilahe illa hu | Hasbiyallah Supplication | Hasbiyallahu la ilaha illa huwa | 3, 6 | orta | hasbiyallah, tevbe 129 | Tevbe 9:129 ayeti, Ebû Dâvûd 5081 ile zikir olarak. Veri setinde bu duanın 8 farklı adla geçen kopyaları var; kural 6 gereği ortak yalın ad burada belirleniyor — kalibrasyon 6. | |
| aksam-ezan-duasi | Akşam Ezanı Duası | Allahümme haza ikbalü leylike | Evening Adhan Supplication | Allahumma hadha iqbalu laylika | 3 | orta | akşam ezanı duası | Ebû Dâvûd 530. Aynı metin ezanDualari/ezan-kamet-arasi-serbest-dua kaydında da var; kural 6 çatışması kalibrasyon 8'de. | |

Değişmeyen: 1 kayıt (aksam-namaz-tehlil — "Akşam Namazı Sonrası Tehlil" kural 2'ye uygun bir durum adı; şapka, sayı, em dash yok).

### uyku-uyanis.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| uyanis-bismike-ahya-hamd | Uyku ve Uyanış İkiz Duası | Bismikellahümme ahya ve emut | Twin Supplication for Sleep and Waking | Bismika Allahumma ahya wa amut | 3 | orta | elhamdülillahillezi ahyana | Buhârî 6312. Kayıt iki ayrı duayı (yatarken + uyanınca) taşıyor; başlık ilkinin başlangıcı. Bileşik kayıt sorusu kalibrasyon 3'te. | |
| uyanis-hamd-ruh | Uyanınca Ruhu Geri Veren Allah'a Hamd | Elhamdülillahillezi radde aleyye ruhi | Praise for Allah Who Restores the Soul Upon Waking | Alhamdulillahilladhi radda alayya ruhi | 3 | yüksek | — | Tirmizî 3401. | |
| uyanis-tehlil-gece-af | Uyanınca Tehlil (Günahların Affı) | Gece Uyanınca Okunan Tehlil | Tahlīl Upon Waking (Forgiveness of Sins) | Tahlil Upon Waking at Night | 2, 7 | orta | tehlil | Buhârî 6325. Metin, aksam-namaz-tehlil ile neredeyse aynı (orada fazladan "yuhyi ve yümit"); ikisi de durum adıyla ayrıştırıldı — kalibrasyon 9. Parantez içi alt başlık silindi. | |
| uyku-ayetel-kursi | Âyetel Kürsî (Yatmadan Önce) | Ayetel Kürsi | Āyat al-Kursī (Before Sleep) | Ayat al-Kursi | 1, 6, 7, 8 | yüksek | bakara 255 | Kullanıcının kural 1 ve 9 örneğiyle birebir. Vakit ve şapkalar silindi. | |
| uyku-bismike-rabbi-yatak | Yatağa Uzanırken Dua | Bismike Rabbi vada'tü cenbi | Supplication Upon Lying Down in Bed | Bismika Rabbi wada'tu janbi | 3, 8 | orta | — | Buhârî 6320; Müslim 2714. "vada'tü" → "vadatü"; çift ünlü sorusu kalibrasyon 6'da. | |
| uyku-eslemtu-nefsî | Nefsimi Sana Teslim Ettim (Yatmadan Önce Son Dua) | Allahümme eslemtü nefsi ileyke | I Have Surrendered Myself to You (Final Supplication Before Sleep) | Allahumma aslamtu nafsi ilayka | 3, 7 | yüksek | — | Buhârî 6311; Müslim 2710. Türkçe meal başlığı ve parantez silindi. | |
| uyku-tesbih-33-34 | Yatmadan Önce Tesbih (33-33-34) | Hz. Fatıma Tesbihi | Tasbīḥ Before Sleep (33-33-34) | The Tasbih of Fatimah | 1, 7 | orta | yatmadan önce tesbih, 33-33-34 | Buhârî 6318 / Müslim 2727 = Hz. Fatıma'nın hizmetçi istemesi üzerine öğretilen tesbih; hadis teşhisi kesin. Türkiye'de bu adın yaygınlığı teyit edilmeli — kalibrasyon 11. | |
| uyku-kafir-suresi | Kâfirûn Sûresi (Yatmadan Önce) | Kafirun Suresi | Sūrat al-Kāfirūn (Before Sleep) | Surah Al-Kafirun | 1, 7, 8 | yüksek | — | Sure adı; vakit ve şapkalar silindi. | |
| uyku-istigfar-kayyum | Yatmadan Önce İstiğfar (× 3) | Estağfirullahellezi la ilahe illa hu | Istighfār Before Sleep (× 3) | Astaghfirullahalladhi la ilaha illa huwa | 3, 7 | yüksek | — | Tirmizî 3397. Sayı ve vakit silindi. | |

Değişmeyen: 0 kayıt.

### yemekDualari.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| yemek-besmele | Yemekte Besmele | Yemek Besmelesi | Bismillah Before Eating | Bismillah Before Eating | 1, 2 | yüksek | — | Türkçede yerleşik kalıp. Hısnu'l-Muslim bölüm adı "Yemekten Önce Yapılan Dua"; iki kayıt aynı durumda, en yaygını besmele. EN değişmiyor. | |
| yemek-baslangic-duasi | Yemek Başlangıcı Duası | Allahümme barik lena fima razaktena | Supplication at the Beginning of a Meal | Allahumma barik lana fima razaqtana | 3 | yüksek | sofra duası | İbnü's-Sünnî 457. Halk arasında "sofra duası" olarak bilinir, tag'e önerildi. | |
| yemek-sonrasi-hamd | Yemekten Sonra Hamd Duası (Uzun) | Elhamdülillahi kesiren tayyiben | Extended Praise Supplication After Eating | Alhamdulillahi kathiran tayyiban | 3, 7 | orta | — | Buhârî 5458. "(Uzun)" kural 7 ile silindi. Aynı durumdaki üç kayıttan en meşhuru değil; kalibrasyon 4. | |
| yemek-sonrasi-muslimiin | Yemekten Sonra Kısa Hamd | Yemekten Sonra Okunan Dua | Brief Praise Supplication After Eating | Dua After Eating | 2 | orta | elhamdülillahillezi etamena | Ebû Dâvûd 3850. Türkiye'de yemekten sonra en çok okunan metin; kural 2 gereği durumun yalın adını aldı. Kalibrasyon 4. | |
| yemek-sonrasi-gunah-affeder | Yemek Sonrası Günahları Affettiren Dua | Elhamdülillahillezi etameni haza | Supplication After Eating That Expiates Sins | Alhamdulillahilladhi at'amani hadha | 3, 8 | orta | — | Tirmizî 3458. Fazilet ifadesi başlıktan çıktı (virtue alanında zaten var). Kalibrasyon 4. | |
| yemek-iftar-ev-sahibine | İftar Ev Sahibine Dua | İftar Verene Okunan Dua | Supplication for the Host at Iftar | Dua for the One Who Provides Iftar | 2 | yüksek | eftare indekümüs saimun, misafir duası | Ebû Dâvûd 3854. Hısnu'l-Muslim'de "Oruçluya İftar Yemeği Verenin Duası" başlığıyla geçiyor. | |
| yemek-ikram-edene-karsilik | İkram Edene Karşılık Dua | İkram Edene Okunan Dua | Supplication for One Who Has Offered Food or Drink | Dua for the One Who Offers Food or Drink | 2 | yüksek | — | Müslim 2055. Yalnız kural 2'nin standart biçimine getirildi. | |

Değişmeyen: 0 kayıt.

### evGirisCikis.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| ev-cikis-bismillah-tevekkul | Evden Çıkarken Duası | Evden Çıkarken Okunan Dua | Supplication for Leaving the House | Dua When Leaving the Home | 2, 9 | yüksek | — | Hısnu'l-Muslim bölüm adı "Evden Çıkarken". EN kullanıcının kural 9 örneğindeki kalıba getirildi. | |
| ev-giris-bismillah | Eve Girerken Duası | Eve Girerken Okunan Dua | Supplication for Entering the House | Dua When Entering the Home | 2, 9 | yüksek | — | Kullanıcının kural 2 ve 9 örnekleriyle birebir. | |
| cami-giris-nur-duasi | Camiye Giderken Nur Duası | Nur Duası | Supplication of Light on the Way to the Mosque | The Dua of Light | 1, 7 | orta | camiye giderken okunan dua | Buhârî 6316; Müslim 763. Literatürde yerleşik adı "duâü'n-nûr / Nur duası"; bağlam kural 7 ile başlıktan çıktı. Alternatif kural 2 adı kalibrasyon 12'de. | |
| cami-giris-rahmet | Camiye Girerken Duası | Camiye Girerken Okunan Dua | Supplication for Entering the Mosque | Dua When Entering the Mosque | 2 | yüksek | — | Müslim, Mesâcid 68. Aynı durumdaki iki kayıttan meşhur olanı → yalın durum adı. | |
| cami-cikis-dua | Camiden Çıkarken Duası | Camiden Çıkarken Okunan Dua | Supplication for Leaving the Mosque | Dua When Leaving the Mosque | 2 | yüksek | — | Ebû Dâvûd 465; Hısnu'l-Muslim nr. 21. Aynı durumdaki iki kayıttan meşhur olanı. | |
| cami-cikis-iblis-koruma | Camiden Çıkarken İblis'ten Sığınma | Allahümme inni euzü bike min İblise | Seeking Refuge from Iblis upon Leaving the Mosque | Allahumma inni a'udhu bika min Iblis | 3 | yüksek | camiden çıkarken | El-Ezkar 91. Durumun yalın adı cami-cikis-dua'ya gittiği için kural 3'e düşüldü. | |

Değişmeyen: 1 kayıt (cami-giris-cikis-besmele-salavat — "Camiye Girerken ve Çıkarken Besmele ve Salavat" hem durumu hem içeriği doğru veriyor, yasaklı işaret yok).

### gunlukSunnetDualari.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| elbise-giyerken-hamd | Elbise Giyerken Hamd Duası | Elbise Giyerken Okunan Dua | Supplication for Putting On Clothing | Dua When Putting On Clothing | 2 | yüksek | — | Hısnu'l-Muslim bölüm adı "Elbise Giyerken" (nr. 5). | |
| yeni-elbise-giyerken-dua | Yeni Elbise Giyerken Dua | Yeni Elbise Giyerken Okunan Dua | Supplication for Wearing New Clothing | Dua When Wearing New Clothing | 2 | yüksek | — | Hısnu'l-Muslim bölüm adı "Yeni Elbise Giyerken" (nr. 6). | |
| yeni-elbise-giyen-icin-dua | Yeni Elbise Giyen Kimse İçin Dua | Yeni Elbise Giyen Kimse İçin Okunan Dua | Supplication for One Wearing New Clothing | Dua for One Wearing New Clothing | 2 | yüksek | — | Hısnu'l-Muslim bölüm adı "Yeni Elbise Giyen Kimse İçin" (nr. 7). Bu dua elbiseyi giyene değil, onu görene aittir. | |
| tuvalete-girmeden-once-dua | Tuvalete Girmeden Önce Dua | Tuvalete Girerken Okunan Dua | Supplication Before Entering the Restroom | Dua When Entering the Restroom | 2 | yüksek | — | Kullanıcının kural 2 örneğiyle birebir. | |
| tuvaletten-ciktiktan-sonra-dua | Tuvaletten Çıktıktan Sonra Dua | Tuvaletten Çıktıktan Sonra Okunan Dua | Supplication After Leaving the Restroom | Dua After Leaving the Restroom | 2 | yüksek | gufranek | Hısnu'l-Muslim bölüm adı "Tuvaletten Çıktıktan Sonra" (nr. 11). | |
| abdest-sonrasi-sehadet-dua | Abdest Sonrası Şehadet ve Dua | Abdestten Sonra Okunan Dua | Testimony of Faith and Supplication After Ablution | Dua After Ablution | 2 | yüksek | — | Hısnu'l-Muslim bölüm adı "Abdestten Sonra" (nr. 13-14). | |
| aksirirken-elhamdulillah | Aksırırken Hamd | Aksırınca Okunan Hamd | Praising Allah While Sneezing | Dua When Sneezing | 2 | yüksek | — | Hısnu'l-Muslim "Aksırınca Yapılan Dua"; El-Ezkar 760. Aksıranın kendi söylediği kısım. | |
| aksirma-teshmit-cevabi | Teşmite Cevap — Yehdîkümullah | Teşmite Verilen Cevap | Response to Tashmit — Yahdikumullah | Response to Tashmit | 2, 7, 8 | orta | yehdikümullah | Buhârî 6225; El-Ezkar 754. Em dash sonrası alt başlık tag'e taşındı. | |

Değişmeyen: 0 kayıt.

### gunlukTesbih.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| tesbih-subhanallahil-azim-ve-bihamdihi | Dile Kolay, Mizanda Ağır İki Kelime | Sübhanallahi ve bihamdihi sübhanallahil azim | Two Words Light on the Tongue, Heavy on the Scale | Subhanallahi wa bihamdihi subhanallahil azim | 3 | orta | — | (44 kr) Buhârî 6405; Müslim 2694. Eski başlık hadis mealinden türetilmiş uydurma ad. sabah-subhanallah-bihamdihi ile çakışmamak için ikinci cümleye kadar uzatıldı. Kalibrasyon 1 ve 2. | |
| tesbih-dortlu-zikir | Allah'a En Sevimli Dört Söz | Sübhanallah vel hamdülillah | The Four Words Most Beloved to Allah | Subhanallah wal-hamdulillah | 3 | düşük | bakiyatı salihat, dörtlü zikir | Müslim 2137/2695. Dört kelimenin literatürdeki adı "el-bâkıyâtü's-sâlihât" ama bazı rivayetlerde beşinci olarak "la havle" de var; kural 1'e güvenmedim, kural 3'e düştüm. Kalibrasyon 13. | |
| tesbih-bedevi-compound | Tüm Formülleri Birleştiren Zikir | La ilahe illallahu vahdehu la şerike leh, Allahu ekber | The Dhikr That Combines All the Formulas | La ilaha illallahu wahdahu la sharika lah, Allahu akbar | 3 | düşük | bedevi zikri | (54 kr) Müslim 2695. Başlangıcı sade tehlille birebir aynı; yalın "La ilahe illallahu vahdehu la şerike leh" başlığını 2. dalgadaki namazSonrasi tehliline saklamak için ayırt edici kelimeye ("Allahu ekber") uzatıldı. Kalibrasyon 1 ve 2. | |

Değişmeyen: 0 kayıt.

### ezanDualari.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| ezan-muezzine-tekrar | Müezzini Tekrarlama — Hayye'ye La Havle ile Karşılık | Ezanı Tekrarlarken Okunan Dua | Repeating the Muezzin — Answering the Call to Prayer with La Hawla | Dua While Repeating After the Muezzin | 2, 7 | orta | havkale, la havle vela kuvvete illa billah | Buhârî 611; Müslim 383. Em dash sonrası alt başlık silindi; içerik "hayye ale's-salah"a verilen karşılık, bu ayrıntı virtue/meaning alanlarında var. | |
| ezan-sehadet-sonrasi-raditu | Ezanda Şehadetten Sonra Razı Oldum Duası | Ezanda Şehadetten Sonra Okunan Dua | After the Shahada in the Adhan — The Supplication of Contentment (Raditu) | Dua After the Shahada in the Adhan | 2, 7 | yüksek | raditü billahi rabben | Müslim 386; Hısnu'l-Müslim nr. 23. Metnin bir bölümü aksam-razi-oldum ile örtüşüyor ama kayıt daha uzun ve ezana özgü; durum adı verildi. | |
| ezan-sonrasi-vesile-duasi | Ezan Sonrası Vesile Duası | Vesile Duası | The Supplication of Al-Wasilah After the Adhan | Dua of al-Wasilah | 1, 7 | yüksek | ezan duası, makamı mahmud | Buhârî 614. Türkiye'de yerleşik adı doğrudan "vesile duası"; bağlam kural 7 ile silindi. | |
| ezan-kamet-arasi-serbest-dua | Ezan ile Kamet Arası — Duanın Kabul Vakti | Ezan ile Kamet Arasında Okunan Dua | Between the Adhan and the Iqamah — The Time of Answered Supplication | Dua Between the Adhan and the Iqamah | 2, 7 | orta | müstecap vakit | Tirmizî 212; Ebû Dâvûd 521. nameArabic'i aksam-ezan-duasi ile aynı metin; kaydın konusu ise dua değil, duanın kabul vakti. Kural 6 çatışması kalibrasyon 8'de. | |

Değişmeyen: 0 kayıt.

### keffaretulMeclis.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| meclis-istigfar-100 | Oturumda İstiğfar Duası | Her Oturumda Okunan Dua | Supplication for Seeking Forgiveness in a Gathering | Dua Recited in Every Gathering | 2 | yüksek | rabbiğfir li ve tub aleyye | Buhârî 6307; Hısnu'l-Muslim bölüm adı "Her Oturumda Yapılan Dua"; El-Ezkar "Mecliste Oturanın Duası". | |
| meclis-keffaret | Keffâretü'l-Meclis Duası | Keffaretül Meclis | Kaffarat al-Majlis (Expiation for the Gathering) | Kaffarat al-Majlis | 1, 3, 8 | yüksek | — | Kullanıcının kural 1 örneğiyle birebir; "Duası" eki ve kesmeler kalktı. | |

Değişmeyen: 0 kayıt.

### ozluSunnetDualari.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| ozlu-huda-takva-iffet-gina | Hidayet, Takva, İffet ve Gönül Zenginliği Duası | Allahümme inni eselükel hüda vet tüka | Supplication for Guidance, Taqwa, Chastity, and Self-Sufficiency | Allahumma inni as'alukal huda wat tuqa | 3, 8 | yüksek | — | Müslim 2721; El-Ezkâr 1150. | |
| ozlu-bagisla-merhamet-afiyet-rizik | Dört Talep Duası — Bağışla, Merhamet Et, Âfiyet Ver, Rızık Ver | Allahümmeğfir li verhamni | The Four Requests Supplication — Forgiveness, Mercy, Well-Being, and Provision | Allahummaghfir li warhamni | 3, 7 | yüksek | — | Müslim 2697; El-Ezkâr 1151. Em dash sonrası meal listesi silindi. | |
| ozlu-kalpleri-yonlendiren | Kalpleri Yönlendiren Allah — İtaat Duası | Allahümme musarrifel kulub | O Turner of Hearts — Supplication for Obedience | Allahumma musarrifal qulub | 3, 7 | yüksek | — | Müslim 2654; El-Ezkâr 1152. | |
| ozlu-hata-cehalet-israf-magrfet | Kapsamlı Mağfiret Duası — Üç Dörtlü Af | Allahümmeğfir li hatieti ve cehli | Comprehensive Supplication for Maghfirah — Three Layers of Pardon | Allahummaghfir li khati'ati wa jahli | 3, 7 | yüksek | — | Buhârî 6398; Müslim 2719. ozlu-bagisla... ile çakışmamak için ayırt edici kelimeye uzatıldı. | |
| ozlu-yaptigim-yapmadim-serian | Yapılanın ve Yapılmayanın Şerrinden Sığınma | Allahümme inni euzü bike min şerri ma amiltü | Seeking Refuge from the Evil of What Was Done and Left Undone | Allahumma inni a'udhu bika min sharri ma amiltu | 3 | orta | — | (44 kr) Müslim 2716; El-Ezkâr 1157. Kalibrasyon 1. | |
| ozlu-nimetin-zevalinden-siginma | Nimetin Zevalinden ve Allah'ın Gazabından Korunma | Allahümme inni euzü bike min zevali nimetike | Protection from the Loss of Blessing and Allah's Wrath | Allahumma inni a'udhu bika min zawali ni'matika | 3, 8 | orta | — | (44 kr) Müslim 2739; El-Ezkâr 1158. Kalibrasyon 1. | |
| ozlu-takva-nesip-faydali-ilim | Üçlü Kapsamlı Dua — Âcizlik, Takvâ ve Faydalı İlim | Allahümme ati nefsi takvaha | Three-Part Comprehensive Supplication — Incapacity, Taqwa, and Beneficial Knowledge | Allahumma ati nafsi taqwaha | 3, 7 | düşük | allahümme inni euzü bike minel aczi, ilmin la yenfa | Müslim 2722; El-Ezkâr 1159. Kayıt üç ayrı duayı topluyor ve başlangıcı ozlu-acz-kesel... ile çakışıyor; başlık en meşhur ikinci bölümden alındı. Kural 3 istisnası — kalibrasyon 3. | |
| ozlu-ya-mukallibel-kulub-sebbit | Kalbi Dinde Sabit Kılma Duası | Ya mukallibel kulub sebbit kalbi | Supplication for Keeping the Heart Firm upon the Religion | Ya muqallibal qulub thabbit qalbi | 3 | yüksek | — | Tirmizî 3522; El-Ezkâr 1175. Çok okunan dua, başlangıç sözleriyle zaten tanınıyor. | |
| ozlu-hz-davudun-sevgi-duasi | Hz. Dâvûd'un Sevgi Duası | Hz. Davud'un Sevgi Duası | The Love Supplication of Dawud (peace be upon him) | The Love Supplication of Prophet Dawud | 1, 8 | yüksek | — | Tirmizî 3490; El-Ezkâr 1177. Peygamber duası → kural 1. Yalnız şapkalar kalktı, Türkçe ek kesmesi kaldı. | |
| ozlu-peygamber-dualari-tum-ozeti | Peygamber Dualarının Tüm Özeti | Allahümme inni eselüke min hayri ma se'eleke | The Comprehensive Summary of the Prophet’s Supplications | Allahumma inni as'aluka min khayri ma sa'alaka | 3, 8 | orta | — | (43 kr) Tirmizî 3521; El-Ezkâr 1181. Eski başlık editoryal. "se'eleke" → "seeleke" çift ünlüsü kalibrasyon 6'da. ozlu-hayrin-hepsi... ile yakın önek. | |
| ozlu-rabbi-ainni-kapsamli-kulluk | Kapsamlı Kulluk Duası — Rabbi A'innî | Rabbi a'inni ve la tüin aleyye | Comprehensive Supplication of Servitude — Rabbi A'inni | Rabbi a'inni wa la tu'in alayya | 3, 7, 8 | yüksek | — | Ebû Dâvûd 1510; El-Ezkâr 1183. Em dash ve kesmeler kalktı. | |
| ozlu-hayrin-hepsi-serrin-hepsi | Tüm Hayrı İsteme ve Tüm Şerden Sığınma Duası | Allahümme inni eselüke minel hayri kullihi | Supplication for All Good and Refuge from All Evil | Allahumma inni as'aluka minal khayri kullihi | 3 | orta | — | (42 kr) İbn Mâce 3846; El-Ezkâr 1185. Kalibrasyon 1. | |
| ozlu-rabbena-atina-haseneten | Dünya ve Ahirette İyilik Duası | Rabbena atina | Supplication for Good in This World and the Hereafter | Rabbana atina | 4 | orta | rabbena duası, bakara 201 | Bakara 2:201; Buhârî 6389. Kullanıcının kural 4 örneğiyle birebir. Kehf 10 "Rabbena atina min ledünke rahmeten" sonraki dalgada çıkarsa çakışır — kalibrasyon 7. | |
| ozlu-acz-kesel-cubn-herem-kabir-fitne | Âcizlik, Tembellik, Korkaklık, İhtiyarlık ve Kabir Azabından Sığınma | Allahümme inni euzü bike minel aczi | Seeking Refuge from Incapacity, Laziness, Cowardice, Old Age, and the Punishment of the Grave | Allahumma inni a'udhu bika minal ajzi | 3 | orta | — | Buhârî 2823; Müslim 2706. "minel aczi" ile başlayan iki kayıttan daha meşhuru olduğu için yalın başlangıcı aldı (kural 2'nin tie-break'i kural 3'e taşındı) — kalibrasyon 2. | |
| ozlu-magfiratul-evsa | Affın Günahlardan Büyük Olduğunun İkrarı | Allahümme mağfiratüke evsau min zünubi | Acknowledging that Allah’s Forgiveness Is Greater than One’s Sins | Allahumma maghfiratuka awsa'u min dhunubi | 3, 8 | yüksek | — | El-Ezkâr 1187 (Câbir b. Abdillah); hasen. | |

Değişmeyen: 0 kayıt.

---

## Dalga 2 — Namaz ve dua

Kurallar ve "Karara bağlananlar" kutusu birebir uygulandı. 1. dalgada adı belirlenmiş
metinler (Ayetel Kürsi, Estağfirullahellezi…, Ya Hayyu Ya Kayyum) aynı başlığı aldı ve
not sütununda `1. dalga: <key> ile aynı` biçiminde işaretlendi.

### namazDualari.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| namaz-iftitah-subhaneke | İftitah Duası — Sübhâneke | Sübhaneke | Opening Supplication — Subhanaka | Subhanaka | 1, 7, 8 | yüksek | iftitah duası, sena | Ebû Dâvûd/Tirmizî/İbn Mâce; Hısnu'l-Muslim nr. 28. Türkiye'de ilmihal adı doğrudan "Sübhâneke"; em dash sonrası alt başlık ve şapka kalktı. Hısnu'l-Muslim bölüm adı "(Tekbirden Sonra) İftitah Duası" tag'e alındı. | |
| namaz-iftitah-veccehtu | İftitah Duası — Veccehtu (Uzun Form) | Veccehtü vechiye lillezi fatara | Opening Supplication — Wajjahtu (Extended Form) | Wajjahtu wajhiya lilladhi fatara | 3, 7 | orta | iftitah duası | Müslim 771; Ebû Dâvûd 760. Yalın "İftitah Duası" adı Sübhaneke'ye ait olduğu için kural 3'e düşüldü; "(Uzun Form)" ve em dash silindi. | |
| namaz-ruku-subhane-rabbiyel-azim | Rükû Duası — Sübhâne Rabbiyel-Azîm | Rüku Tesbihi | Ruku Supplication — Subhana Rabbiyal-Azim | Tasbih of Ruku | 1, 7, 8 | yüksek | sübhane rabbiyel azim | **Kalibrasyon 15 kararı:** yerleşik ad şapkasız yazılarak başlık oldu, başlangıç sözleri tag'e indi. Önceki not: Hısnu'l-Muslim nr. 33 ("Rükûda Yapılan Dua"). Türkiye'deki yerleşik ad "rükû tesbihi" ama kural 8 şapkayı yasaklayınca "Ruku Tesbihi" yanlış okunuyor; başlık metnin kendisine verildi, ad tag'e alındı — kalibrasyon 15. | |
| namaz-ruku-subhaneke-rabbena | Rükû Duası — Tesbih ve İstiğfar | Sübhaneke Allahümme Rabbena ve bihamdike | Ruku Supplication — Glorification and Seeking Forgiveness | Subhanaka Allahumma Rabbana wa bihamdika | 3, 7, 8 | yüksek | — | Buhârî 4967; Müslim 484; Hısnu'l-Muslim nr. 34. Başlangıcı "Sübhaneke" ile çakıştığı için ayırt edici kelimeye uzatıldı (kalibrasyon 2). Tire kalktı. | |
| namaz-ruku-secde-subbutun-kuddus | Rükû ve Secdede — Sübbûhün Kuddûsün | Sübbuhün kuddusün | In Ruku and Sujud — Subbuhun Quddusun | Subbuhun quddusun | 3, 7, 8 | orta | — | Müslim 487; El-Ezkar 134. Kaydın kendi transliterasyonundaki ünlü uyumu korundu ("Sübbuhün", "Sübbuhun" değil); devamı ("Rabbül melaiketi ver ruh") başlığa girmedi. | |
| namaz-ruku-secde-zilceberut | Rükû ve Secdede — Sübhâne Zilceberûti | Sübhane zilceberuti | In Ruku and Sujud — Subhana Dhil-Jabarut | Subhana dhil jabarut | 3, 7, 8 | yüksek | — | Ebû Dâvûd 873; Nesâî 1048; El-Ezkar 148. "Sübhane Rabbiyel azim"den ikinci kelimede ayrışıyor. | |
| namaz-tasmia-tahmid | Tasmia ve Tahmid — Rükûdan Doğrulurken | Semiallahu limen hamideh | Tasmi' and Tahmid — Rising from Ruku | Sami'allahu liman hamidah | 3, 7 | yüksek | tesmi, tahmid, rabbena lekel hamd | Buhârî 796; Müslim 406; Hısnu'l-Muslim nr. 38-39 ("Rükûdan Doğrulurken"). Bileşik kayıt; başlık ilk bölümün başlangıcı, ikinci bölüm tag'e önerildi (kalibrasyon 3). | |
| namaz-secde-subhane-rabbiyel-ala | Secde Duası — Sübhâne Rabbiyel-A'lâ | Secde Tesbihi | Prostration Supplication — Subhana Rabbiyal-A'la | Tasbih of Sujud | 1, 7, 8 | yüksek | sübhane rabbiyel ala | **Kalibrasyon 15 kararı:** yerleşik ad başlık oldu, başlangıç sözleri tag'e indi. Önceki not: Hısnu'l-Muslim nr. 41 ("Secdede Yapılan Dua"). Rükû tesbihiyle aynı gerekçe: yerleşik ad tag'e alındı — kalibrasyon 15. | |
| namaz-iki-secde-arasi-rabbigfir | İki Secde Arası Duası | İki Secde Arasında Okunan Dua | Supplication Between the Two Prostrations | Dua Between the Two Prostrations | 2, 9 | yüksek | — | Hısnu'l-Muslim nr. 49 ("İki Secde Arasındaki Oturuşta"). Durumda tek kayıt → yalın durum adı. Başlangıcı ("Allahümmeğfir li verhamni") 1. dalga ozlu-bagisla-merhamet-afiyet-rizik başlığıyla birebir çakıştığı için kural 3 kullanılmadı. | |
| namaz-secde-gunahlarin-bagisilmasi | Secdede Günahların Bağışlanması Duası | Allahümmeğfir li zenbi külleh | Prostration Supplication for the Forgiveness of Sins | Allahummaghfir li dhanbi kullah | 3 | yüksek | — | Müslim 483; Hısnu'l-Muslim nr. 46. 1. dalga "Allahümmeğfir li verhamni" başlığından üçüncü kelimede ayrışıyor. | |
| namaz-teshehud-tahiyyat | Teşehhüd (Tahiyyat) | Ettehiyyatü | Tashahhud (Tahiyyat) | Tashahhud | 1, 7 | yüksek | teşehhüd, tahiyyat | Buhârî 831; Müslim 402; Hısnu'l-Muslim nr. 52. Hanefi ilmihal geleneğinde dua doğrudan "Ettehiyyâtü" diye anılır; parantezli niteleme tag'e taşındı. | |
| namaz-selamdan-once-kabir-fitne-istiaze | Selâmdan Önce Dört Şeyden Sığınma Duası | Allahümme inni euzü bike min azabil kabri | Before the Salam — Seeking Refuge from Four Trials | Allahumma inni a'udhu bika min adhabil qabr | 3, 7 | yüksek | — | (41 kr) Buhârî 832; Müslim 588; Hısnu'l-Muslim nr. 55. Sayı nitelemesi ("Dört Şeyden") silindi. | |
| namaz-selamdan-once-kesel-magram-istiaze | Selâmdan Önce — Tembellik, Yaşlılık, Günah ve Borçtan Sığınma | Allahümme fe inni euzü bike minel keseli | Before the Salam — Seeking Refuge from Laziness, Old Age, Sin, and Debt | Allahumma fa-inni a'udhu bika minal kasali | 3, 7 | orta | — | Müslim 589. 1. dalga sabah-keseli-heremi-sıgınma başlığından yalnız "fe" ile ayrılıyor; ayırt edici kelimeye ("vel me'semi") uzatmak 51 karakter ediyor — kalibrasyon 16. | |
| namaz-selamdan-once-inni-zalemtu | Selâmdan Önce Mağfiret Duası — İnnî Zalemtü | Allahümme inni zalemtü nefsi | Before the Salam — Supplication of Forgiveness (Innee Zalamtu) | Allahumma inni zalamtu nafsi | 3, 7, 8 | yüksek | — | Buhârî 834; Müslim 2705; Hısnu'l-Muslim nr. 57 (Hz. Ebû Bekir'e öğretilen dua). | |
| namaz-selamdan-once-zikredinme-yardim | Selâmdan Önce — Zikir, Şükür ve İbadet İçin Yardım | Allahümme a'inni ala zikrike | Before the Salam — Seeking Help for Remembrance, Gratitude, and Worship | Allahumma a'inni ala dhikrika | 3, 7, 8 | yüksek | — | Ebû Dâvûd 1522; Nesâî 1303; Hısnu'l-Muslim nr. 59. Kural 8 istisnası: "a'inni" kesmesi korundu (1. dalga ozlu-rabbi-ainni-kapsamli-kulluk ile aynı tercih). | |
| namaz-selamdan-sonra-estagfirullah-entes-selam | Selâmdan Sonra İlk Zikir — Estağfirullah + Entes-Selâm | Allahümme entes selamü ve minkes selam | First Remembrance After the Salam — Astaghfirullah and Antas-Salam | Allahumma antas salamu wa minkas salam | 3, 7 | orta | — | Müslim 591; Hısnu'l-Muslim nr. 66. Bileşik kayıt (üç istiğfar + selam duası); "Estağfirullah" tek başına ayırt edici olmadığı için en meşhur ikinci bölüm başlık yapıldı (kalibrasyon 3). Sayı ve em dash silindi. | |

Değişmeyen: 0 kayıt.

### namazSonrasiZikir.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| namaz-sonrasi-33-tesbih-paketi | Namaz Sonrası 33'lük Tesbih Zinciri | Namaz Tesbihatı | The Post-Prayer Chain of Thirty-Three Tasbih | The Post-Prayer Tasbihat | 1, 7 | orta | tesbihat, 33-33-33 | Müslim 597; Buhârî 843; Hısnu'l-Muslim bölüm adı "Namazdan Sonra Yapılan Dualar". Türkiye'de yerleşik ad "tesbihat"; kayıt 33'lükler + tehlilden oluşuyor, camideki tesbihat ise Ayetel Kürsi ve duayı da kapsıyor — kalibrasyon 22. | |
| namaz-sonrasi-ayetel-kursi | Namaz Sonrası Âyetel Kürsî | Ayetel Kürsi | Ayat al-Kursi After Prayer | Ayat al-Kursi | 1, 6, 7, 8 | yüksek | bakara 255 | 1. dalga: uyku-ayetel-kursi ile aynı metin, aynı başlık (kural 6). Nesâî, Amelü'l-Yevm 100. Bağlam nitelemesi ve şapkalar silindi. | |
| namaz-sonrasi-la-ilahe-mania | Namaz Sonrası La İlahe + La Mania Duası | La ilahe illallahu vahdehu la şerike leh | The La Ilaha and La Mani'a Supplication After Prayer | La ilaha illallahu wahdahu la sharika lah | 3, 7 | orta | la mania lima a'tayte | Buhârî 844; Müslim 593; Hısnu'l-Muslim nr. 67. 1. dalga tesbih-bedevi-compound notunda bu yalın tehlil başlığı bu kayda ayrılmıştı. Kayıt tehlilin ardından "la mania" bölümünü de taşıyor, başlık bunu yansıtmıyor (kapsam dışı not). | |

Değişmeyen: 0 kayıt.

### vitrKunutu.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| vitr-kunut-hdini-fimen | Vitir Kunut Duası — Temel Form | Allahümmehdini fimen hedeyt | Witr Qunut Supplication — Essential Form | Allahummahdini fiman hadayt | 3, 7 | yüksek | vitir kunutu | Ebû Dâvûd 1425; Tirmizî 464; Hısnu'l-Muslim nr. 116 (Hz. Hasan'a öğretilen kunut). Türkiye'deki yerleşik "Kunut Duası" adı Hanefi ilmihalindeki iki metne ait olduğu için bu kayda verilmedi. | |
| vitr-kunut-euzu-biridake | Vitir Kunut Duası — Senden Sana Sığınma | Allahümme inni euzü biridake | Witr Qunut Supplication — Seeking Refuge in You from You | Allahumma inni a'udhu biridaka | 3, 7, 8 | yüksek | vitir kunutu | Müslim 486; Hısnu'l-Muslim nr. 117. Terkip tiresi kaldırılıp birleştirildi ("bi-ridâke" → "biridake"), 1. dalga "Euzü bikelimatillahit tammati" ile aynı tercih. | |
| vitr-kunut-iyyake-nabudu | Vitir Kunut Duası | Kunut Duaları | Witr Qunut Supplication | The Qunut Supplications | 1, 2 | yüksek | kunut duası, allahümme inna nesteinüke, allahümme iyyake nabüdü | Beyhakî 2/211 (Hz. Ömer'den sahih mevkuf); Hısnu'l-Muslim nr. 118. Kayıt Hanefi ilmihalindeki iki kunut duasını tek metinde topluyor (önce "iyyake nabüdü", sonra "inna nesteinüke") → çoğul yalın ad. Aynı durumdaki en meşhur kayıt olduğu için yalın adı aldı (kural 2). | |
| vitr-selamdan-sonra-subhanelmelikil-kuddus | Vitir Selâmından Sonra Zikir | Sübhanel melikil kuddus | Dhikr After the Witr Salam | Subhanal malikil quddus | 3, 7, 8 | orta | vitir selamından sonra | Nesâî 1699; Hısnu'l-Muslim nr. 119. Hısnu'l-Muslim bölüm adı "Vitirde Selâmdan Sonra"; metnin kendisi bu sözlerle anıldığı için kural 3 tercih edildi — kalibrasyon 12 ile aynı tercih. | |

Değişmeyen: 0 kayıt.

### istihareDuasi.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| istihare-allahümme-estehiruke | İstihare Duası | İstihare Duası | Istikhara Supplication (Prayer for Seeking Guidance) | Istikhara Supplication | 2, 7, 9 | yüksek | — | Buhârî 1162; Hısnu'l-Muslim bölüm adı "İstihare Duası". TR başlık zaten kurala uygun, değişmiyor; yalnız EN'deki parantezli niteleme kural 7 ile silindi. | |
| istihare-allahümme-hir-li | Kısa İstihare Duası | İstihare Duası: Allahümme hır li | Short Istikhara Supplication | Istikhara Supplication: Allahumma khir li | 2, 3 | orta | — | Tirmizî 3516 (zayıf). Aynı durumdaki ikinci kayıt; "İstihare Duası" özel isim kadar kısa bir durum adı olduğu için karar kutusundaki "Durum Adı: başlangıç" biçimi uygulandı. | |

Değişmeyen: 0 kayıt.

### tovbeIstigfar.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| istigfar-rabbigfirli | Rabbim Bağışla ve Tövbemi Kabul Et | Rabbiğfir li ve tüb aleyye | My Lord, Forgive Me and Accept My Repentance | Rabbighfir li wa tub alayya | 3 | orta | — | Ebû Dâvûd 1516; Tirmizî 3434. Eski başlık Türkçe meal. nameArabic, 1. dalga meclis-istigfar-100 ile birebir aynı; orada durum adı ("Her Oturumda Okunan Dua") verilmişti — kural 6 çatışması kalibrasyon 17. | |
| istigfar-hayyel-kayyum | Hayy ve Kayyum Olan Allah'a İstiğfar | Estağfirullahellezi la ilahe illa hu | Seeking Forgiveness from Allah, the Ever-Living and the Self-Sustaining | Astaghfirullahalladhi la ilaha illa huwa | 3, 6 | yüksek | — | 1. dalga: uyku-istigfar-kayyum ile aynı metin, aynı başlık. Ebû Dâvûd 1517; Tirmizî 3577. | |
| istigfar-yunus-duasi | Hz. Yûnus'un Tövbe Duası | Hz. Yunus'un Duası | The Repentance Supplication of the Prophet Yūnus (peace be upon him) | The Supplication of Prophet Yunus | 1, 8 | yüksek | zünnun duası, enbiya 87 | Enbiyâ 21/87; Tirmizî 3500. Peygamber duası → kural 1 (kural 4'ün önünde). Şapkalar, EN aksanları ve parantezli niteleme kalktı; Türkçe ek kesmesi kaldı. | |
| istigfar-rabbena-zalemna | Hz. Âdem ve Havvâ'nın Tövbe Duası | Hz. Adem ve Havva'nın Tövbe Duası | The Repentance Supplication of the Prophet Ādam and Hawwā' (peace be upon them) | The Repentance Supplication of Prophet Adam and Hawwa | 1, 8 | yüksek | araf 23, rabbena zalemna enfüsena | A'râf 7/23. Peygamber duası → kural 1. Yalnız şapkalar, EN aksanları ve parantez kalktı. | |
| istigfar-gunluk | Günlük İstiğfar | Estağfirullahe ve etubü ileyh | Daily Istighfar | Astaghfirullaha wa atubu ilayh | 3, 7 | yüksek | — | Buhârî 6307; Müslim 2702. "Günlük" nitelemesi silindi; üstteki istiğfardan ikinci kelimede ayrışıyor. | |

Değişmeyen: 0 kayıt.

### salavat.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| SALAVAT-I ŞERİFE | Mevlid Salavatı | Salavatı Şerife | Mawlid Salawat | Salawat al-Sharifa | 1, 8 | orta | mevlid salavatı | Metin standart kısa salavat ("Allahümme salli ala seyyidina Muhammedin ve ala ali seyyidina Muhammed"); key de bunu söylüyor. Eski başlık metinle örtüşmüyordu, gerçek bir kullanım olduğu için tag'e alındı — kalibrasyon 19. | |
| SELLIM_BARIK | Salavat-ı Şerife (Salli Sellim Barik) | Allahümme salli ve sellim ve barik | Salawat al-Sharifa (Salli Sellim Barik) | Allahumma salli wa sallim wa barik | 3, 7 | orta | salli sellim barik | Yalın "Salavatı Şerife" adı üstteki metne gitti; bu kayıt "ve sellim ve barik" fazlasıyla ayrışıyor (kural 2 tie-break'i kural 3'te, kalibrasyon 2). Parantezli niteleme tag'e taşındı. | |
| MUNCIYE | Salât-ı Tüncîna (Salât-ı Münciye) | Salatı Münciyye | Salat al-Tunjina (Salat al-Munjiya — The Delivering Prayer) | Salat al-Munjiyya | 1, 7, 8 | orta | tüncina, salatı tüncina | TDV İslâm Ansiklopedisi madde adı "Salât-ı Münciyye"; "Tüncînâ" halk arasındaki ikinci ad, tag'e alındı. Parantezli çeviri silindi. Ek biçimi kalibrasyon 18. | |
| salavat-ibrahimiyye | Salavât-i İbrahimiyye | Salavatı İbrahimiyye | Salawat al-Ibrahimiyya | Salawat al-Ibrahimiyya | 1, 8 | yüksek | allahümme salli, allahümme barik, salli barik | Buhârî 3370; Müslim 405-406. Namazda okunan salli-barik; yerleşik ad korundu, şapka ve terkip tiresi düzeltildi. EN değişmiyor. | |
| salavat-cuma-cok-getir | Cuma Günü Salavat | Cuma Günü Okunan Salavat | Friday Salawat | Salawat Recited on Friday | 2, 9 | orta | — | Ebû Dâvûd 1531; İbn Mâce 1636. Metin ("Allahümme salli ve sellim ala nebiyyina Muhammed") SELLIM_BARIK ile ilk dört kelimede çakıştığı için durum adı tercih edildi; kayıt zaten cuma gününe bağlı. | |
| salavat-kiyamette-yakin | Kısa Günlük Salavat | Allahümme salli ala Muhammedin | Short Daily Salawat | Allahumma salli ala Muhammadin | 3, 7 | orta | — | Tirmizî 484 (hasen). Bu önekle başlayan kayıtların en sahihi olduğu için yalın başlangıcı aldı; metnin devamı ("ve ala ali Muhammedin ve sellim") Salavatı İbrahimiyye'nin ilk cümlesiyle örtüştüğü için uzatma ayırt edicilik kazandırmıyor — kalibrasyon 2. | |
| KEMALILLAHI | Kema Lillahi Salavatı | Salatı Kemaliyye | Salawat Kama Lillahi (As Befits the Perfection of Allah) | Salat al-Kamaliyya | 1, 7, 8 | orta | adede kemalillahi | Metin, salavat mecmualarında "Salât-ı Kemâliyye" adıyla geçen "…adede kemâlillâhi ve kemâ yelîku bi-kemâlih" salavatı. Kaydın kaynağı yalnız "Salavat mecmuaları" dediği için güven orta. | |
| DELAIL_HAYRAT | Delailü'l-Hayrat Dengi Salavat | Allahümme salli ala seyyidina Muhammedin | Salawat Equivalent to Dala'il al-Khayrat | Allahumma salli ala sayyidina Muhammadin | 3 | düşük | — | (40 kr) Yerleşik özel ad bulunamadı; "Delâilü'l-Hayrât" bir salavat kitabının adı, bu metnin adı değil. Ortak önek 40 karakteri doldurduğu için ayırt edici bölüme ("salaten tadilü cemia salevati") ulaşılamadı — kalibrasyon 16. | |
| NUR_ZATIYYE | Nur-u Zatiyye Salavatı | Nuru Zatiyye Salavatı | Salawat al-Nur al-Zatiyya (The Light of the Divine Essence) | Salawat al-Nur al-Zatiyya | 1, 7, 8 | orta | salatı nuriyye | Salavat mecmualarında "Nûr-ı Zâtî / Nûriyye" adıyla geçer. Yalnız terkip tiresi ve EN'deki parantezli çeviri kalktı. | |
| SALAVAT_FATIH | Salavat-ı Fatih | Salatı Fatih | Salawat al-Fatih (The Opening Salawat) | Salat al-Fatih | 1, 7, 8 | yüksek | — | Türkiye'de ve tarikat geleneğinde yerleşik ad "Salât-ı Fâtih"; terkip tiresi ve parantezli çeviri silindi. | |
| RUYADA_GORME_SALAVATI | Rüyada Görme Salavatı | Allahümme salli ala ruhi seyyidina Muhammedin | Salawat for Seeing the Prophet in a Dream | Allahumma salli ala ruhi sayyidina Muhammadin | 3 | orta | rüyada görme salavatı | (45 kr) Eski başlık mecmualardaki gerçek anılışı yansıttığı için tag'e alındı. Metin SABAN_SALAVATI ile yalnız "seyyidina" farkıyla aynı; ayırt edici kelimeye ("ruhi") kadar uzatıldı — kalibrasyon 17. | |
| TEFRICIYE_SALAVATI | Salavat-ı Tefriciyye | Salatı Nariye | Salawat al-Tafrijiyya (The Relief-Bringing Salawat) | Salat al-Nariyah | 1, 7, 8 | orta | salatı tefriciyye, tefriciye | **Opus review:** ajan "Salatı Tefriciyye" önermişti; onaylı planda kural 1 örneği "Salatı Nariye" ve halk arasında (4444 Nariye) bu ad daha yaygın → başlık Nariye, Tefriciyye tag. Ters tercih için onay sütununa yazın. Terkip tiresi ve parantezli çeviri silindi. Ek biçimi kalibrasyon 18. | |
| SABAN_SALAVATI | Şaban Salavat-ı Şerifi — Ruh, Ceset ve Kabir Salavat | Allahümme salli ala Muhammedin fil ervah | Sha'ban Salawat al-Sharif — The Salawat of Soul, Body, and Grave | Allahumma salli ala Muhammadin fil arwah | 3, 7 | orta | şaban salavatı | Şaban bilgisi dhikrDay/özel gün alanlarında zaten var; em dash sonrası alt başlık silindi. RUYADA_GORME_SALAVATI ile aynı metin — kalibrasyon 17. | |

Değişmeyen: 1 kayıt (HZ_FATIMA_SALAVATI — "Hz. Fatıma'nın Salavatı" mecmualardaki yerleşik adı veriyor; şapka, sayı, em dash, parantez yok, EN'de de aksan yok).

### mubinDuasi.mjs

Öneri yok.

Değişmeyen: 1 kayıt (mubin-duasi-tesbih — "Mübin Duası" kural 1'e uygun kısa bir özel ad, yasaklı işaret taşımıyor. Adın metinle örtüştüğü doğrulanamadı, bu yüzden değiştirilmedi de — kalibrasyon 20).

### imanSaglamligi.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| iman-suphe-euzu-billah | İman Şüphesi Anında — Allah'a Sığınma | İmanda Şüpheye Düşünce Okunan Dua | At the Moment of Doubt in Faith — Seeking Refuge in Allah | Dua When in Doubt About Faith | 2, 7 | yüksek | euzü billahi mineş şeytanir racim, istiaze | Buhârî 3276; Müslim 132. Hısnu'l-Muslim bölüm adı "İmanda Şüpheye Düşen Kimsenin Duası". Aynı durumdaki iki kayıttan meşhur olanı → yalın durum adı; metnin kendisi tag'e. | |
| iman-suphe-amentu-billahi | İman Şüphesi Anında — İman İkrarı | Amentü billahi ve rusülih | At the Moment of Doubt in Faith — Affirmation of Belief | Amantu billahi wa rusulih | 3, 7, 8 | yüksek | — | Müslim 134. Durumun yalın adı üstteki kayda gittiği için kural 3. Türkiye'de "Âmentü" denince akla gelen amentü metni bu değil; başlık "ve rusülih" ile ayrışıyor. | |
| iman-suphe-hadid-3 | İman Şüphesi Anında — Hadid Suresi 3. Ayet | Hadid Suresi 3. Ayet | At the Moment of Doubt in Faith — Surah Al-Hadid, Verse 3 | Surah Al-Hadid, Verse 3 | 4, 7 | yüksek | hüvel evvelü vel ahir | Ebû Dâvûd 5110; Hadîd 57/3. Dua ayeti değil → kural 4'ün ikinci biçimi; durum bilgisi başlıktan çıktı (suitableFor'da var). | |
| iman-namaz-vesvese-euzu | Namaz ve Kur'an Okurken Gelen Vesvese | Namazda Vesvese Anında Okunan Dua | Whispered Doubt (Waswasa) While Praying or Reciting the Qur'an | Dua When Whispers Come During Prayer | 2, 7 | orta | vesvese duası | Müslim 2203 (Osman b. Ebi'l-Âs rivayeti); Hısnu'l-Muslim bölüm adı "Vesvese Karşısında Yapılan Dua". nameArabic iman-suphe-euzu-billah ile birebir aynı, durum adıyla ayrıştırıldı — kalibrasyon 17. Eski başlık dua adı değil konu etiketiydi. | |

Değişmeyen: 0 kayıt.

### kaygiKriz.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| sikinti-insirah-suresi | İnşirah Suresi | İnşirah Suresi | Surah Ash-Sharh (Al-Inshirah) | Surah Al-Inshirah | 1, 7 | yüksek | şerh suresi, elem neşrah | Sure adı; TR başlık zaten kurala uygun, değişmiyor. EN'deki parantezli ikinci ad tag'e taşındı (1. dalga "Surah Al-Kafirun" biçimi). | |
| sikinti-la-ilahe-illallahul-azimul-halim | Kriz ve Keder Anı Tevhid Zikri | La ilahe illallahül azimül halim | Tawhid Dhikr for Times of Crisis and Grief | La ilaha illallahul azimul halim | 3 | yüksek | kerb duası, sıkıntı duası | Buhârî; Müslim; Hısnu'l-Muslim bölüm adı "Sıkıntı Anında Yapılan Dua" (duâü'l-kerb). Dosyadaki 30'u aşkın kayıt aynı temada olduğu için durum adı tek bir duayı işaret edemezdi (1. dalga aksam-emsena gerekçesi) → kural 3. | |
| sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi | Gece Panik ve Vesvese Sığınma Duası | Euzü bikelimatillahit tammati min gadabihi | Night Panic and Whispering Refuge Supplication | A'udhu bikalimatillahit tammati min ghadabih | 3, 7 | yüksek | — | (42 kr) Tirmizî, Daavât 94. 1. dalga aksam-kelimâtillah farklı rivayet ("min şerri ma halak"); ortak önek ayırt edici kelimeye ("gadabihi") uzatıldı — kalibrasyon 2. | |
| sikinti-inna-lillahi-ve-inna-ileyhi-raciun | Musibet ve Teslimiyet Duası | İnna lillahi ve inna ileyhi raciun | Supplication of Calamity and Submission | Inna lillahi wa inna ilayhi raji'un | 3 | yüksek | istirca, musibet duası, bakara 156 | Bakara 2/156; Müslim (Ümmü Seleme); Ebû Dâvûd 3119. Literatürdeki terim adı "istircâ" tag'e alındı. | |
| sikinti-ya-uddeti-inde-siddeti | Şiddet ve Kurbette İmdad Duası | Ya uddeti inde şiddeti | Supplication for Aid in Hardship and Distress | Ya uddati inda shiddati | 3 | orta | — | Kaydın kaynağı yalnız "İmam Cafer-i Sadık Sıkıntı Duası"; hadis kaynağı ve yerleşik Türkçe özel ad bulunamadı → kural 3 (kapsam dışı not). | |
| sikinti-allahu-allahu-rabbi | Tevhid ile Panik Yatıştırma Zikri | Allahu Allahu Rabbi la üşrikü bihi | Tawhid Dhikr for Calming Panic | Allahu Allahu Rabbi la ushriku bihi | 3 | yüksek | — | Ebû Dâvûd; Nesâî (sıkıntı anında söylenen zikir). Eski başlık editoryal; korku-huvellahu-rabbi ile ilk kelimede ayrışıyor. | |
| sikinti-ya-muahhir | Yâ Mu'ahhir | Ya Muahhir | Ya Mu'akhkhir | Ya Mu'akhkhir | 5, 8 | yüksek | — | Tema setindeki esma zikri. Şapka ve hemze kesmesi kalktı; "Muahhir" çift ünlü ya da yanlış okuma doğurmuyor. EN değişmiyor. | |
| sikinti-ya-muksit | Yâ Muksit | Ya Muksit | Ya Muqsit | Ya Muqsit | 5, 8 | yüksek | — | Yalnız şapka kalktı. EN değişmiyor. | |
| sikinti-ya-zulcelali-vel-ikram | Yâ Zülcelâli Ve'l-İkrâm | Ya Zülcelali vel İkram | Ya Dhal-Jalali Wal-Ikram | Ya Dhal-Jalali wal-Ikram | 5, 8 | orta | — | Şapkalar ve terkip kesmesi kalktı. Opus review: esma özel adı olduğu için "İkram" büyük (99'luk listedeki "Zül Celali vel İkram" ile tutarlı). | |
| sikinti-ya-rauf | Yâ Rauf | Ya Rauf | Ya Ra'uf | Ya Ra'uf | 5, 8 | yüksek | — | Yalnız şapka kalktı. EN değişmiyor. | |
| sikinti-ya-mumin | Yâ Mü'min | Ya Mümin | Ya Mu'min | Ya Mu'min | 5, 8 | yüksek | — | Şapka ve kesme kalktı; "mümin" Türkçede zaten kesmesiz yazılır. EN değişmiyor. | |
| sikinti-ya-muheymin | Yâ Müheymin | Ya Müheymin | Ya Muhaymin | Ya Muhaymin | 5, 8 | yüksek | — | Yalnız şapka kalktı. EN değişmiyor. | |
| sikinti-ya-halik | Yâ Hâlık | Ya Halık | Ya Khaliq | Ya Khaliq | 5, 8 | yüksek | — | Yalnız şapkalar kalktı. EN değişmiyor. | |
| sikinti-ya-muizz | Yâ Muizz | Ya Muizz | Ya Mu'izz | Ya Mu'izz | 5, 8 | yüksek | — | Yalnız şapka kalktı. EN değişmiyor. | |
| sikinti-ya-metin | Yâ Metîn | Ya Metin | Ya Matin | Ya Matin | 5, 8 | yüksek | — | Yalnız şapkalar kalktı. EN değişmiyor. | |
| sikinti-ya-selam-ya-latif-ya-vedud | Yâ Selâm, Yâ Latîf, Yâ Vedûd | Ya Selam Ya Latif Ya Vedud | Ya Salam, Ya Latif, Ya Wadud | Ya Salam Ya Latif Ya Wadud | 5, 8 | yüksek | — | Karar kutusu: birden çok isimde her "Ya" büyük (1. dalga "Ya Hayyu Ya Kayyum" biçimi); virgüller kalktı. | |
| sikinti-rahmeteke-ercu | Rahmetine Sığınma Duası | Allahümme rahmeteke ercu | Supplication of Hope in Allah's Mercy | Allahumma rahmataka arju | 3 | yüksek | — | Ebû Dâvûd, Edeb; Ahmed, Müsned. Aynı hadis ailesinden olan "Ya Hayyu Ya Kayyum" kaydından farklı rivayet ve farklı başlangıç. | |
| sikinti-ya-hayyu-ya-kayyum | Yâ Hayyü Yâ Kayyûmü İstiğâsesi | Ya Hayyu Ya Kayyum | Invocation of Ya Hayyu Ya Qayyum | Ya Hayyu Ya Qayyum | 5, 6, 8 | orta | istigase | 1. dalga: sabah-ya-hayyu-kayyum ile aynı hadis; bu kayıt aynı metnin kısaltılmışı → kural 6 gereği aynı başlık. İki kayıt aynı başlığı taşıyacak — kalibrasyon 21. | |
| sikinti-bismillahi-ala-nefsi | İlahi Zamana Razı Olma Duası | Bismillahi ala nefsi ve mali ve dini | Supplication of Contentment with Divine Timing | Bismillahi ala nafsi wa mali wa dini | 3 | yüksek | — | Taberânî; İbnü's-Sünnî. Eski başlık editoryal; 1. dalga "Bismillahillezi la yedurru" ile ikinci kelimede ayrışıyor. | |
| sikinti-kadderallahu | Kader Teslimiyet Zikri | Kadderallahu ve ma şae feale | Dhikr of Submission to Divine Decree | Qaddarallahu wa ma sha'a fa'al | 3 | yüksek | — | Müslim, Kader. Hadiste "keşke" demeye karşı öğretilen söz; eski başlık editoryal. | |
| sikinti-hasbiye-tertibi | Hasbiye Tertibi | Hasbiyer Rabbü minel ibad | The Hasbiya Litany | Hasbiyar Rabbu minal ibad | 3 | orta | hasbiye, hasbiyallah | Süyûtî, Câmiu's-Sağîr. Bileşik vird; içinde hem "Hasbiyallahu ve nimel vekil" hem "Hasbiyallahu la ilahe illa hu" geçiyor ama kayıt bunların hiçbiriyle başlamadığı için karar kutusundaki iki yalın addan biri verilmedi (kalibrasyon 14 kararıyla tutarlı). | |
| sikinti-huvellezi-sekine | Sekine Ayeti | Fetih Suresi 4. Ayet | The Verse of Sakinah (Tranquility) | Surah Al-Fath, Verse 4 | 4, 7 | orta | sekine ayeti | Fetih 48/4. Dua ayeti değil → kural 4'ün ikinci biçimi; yaygın anılışı tag'e alındı — kalibrasyon 10 ile aynı tercih. **Opus notu:** kural 4 kararı alınırken "Sekine Ayeti" yerleşik ad örneği sayılmıştı; ancak Kur'an'da altı sekine ayeti var ve bu ad tek ayeti göstermiyor. "Sekine Ayeti" kalsın derseniz onay sütununa yazın. | |
| sikinti-ahyini-teveffeni | Hayır Olan Olanla Razı Olma Duası | Allahümme ahyini ma kanetil hayatü | Supplication of Contentment with What Is Best | Allahumma ahyini ma kanatil hayatu | 3 | yüksek | — | Buhârî; Müslim, Zikr. Eski başlıkta yazım hatası vardı (kapsam dışı not). | |
| sikinti-ya-allah-estagfirullah | Gece İstiğfarı | Ya Allahu ya Allahu estağfirullahe | Night Seeking of Forgiveness | Ya Allahu ya Allahu astaghfirullaha | 3, 7 | orta | — | Kaynak alanı belirsiz ("Hadis Kaynakları; Tergîb-üs-Salât"); doğrulanabilir yerleşik ad yok → kural 3. Vakit nitelemesi silindi (timeOfDay'de var). | |
| sikinti-rabbena-efrig-sabran | Sabır Yağdırma Duası | Rabbena efriğ aleyna sabran | Supplication for the Outpouring of Patience | Rabbana afrigh alayna sabran | 4 | yüksek | araf 126 | A'râf 7/126. Dua ayeti → kural 4'ün birinci biçimi (başlangıç sözleri). | |
| sikinti-inni-abduk-ibnu-abduk | Üzüntü ve Keder Duası — Kur'an'ı Kalbin Baharı Kıl | Allahümme inni abdük | Supplication of Sorrow and Grief — Make the Quran the Spring of My Heart | Allahumma inni abduk | 3, 7 | yüksek | hemm ve hüzün duası | Ahmed 1/391; Hısnu'l-Muslim nr. 120; bölüm adı "Üzüntü ve Keder Anında Yapılan Dua". Aynı bölümdeki iki kayıt eşit meşhur olduğu için ikisi de kural 3 aldı. Em dash sonrası meal silindi. | |
| sikinti-kerimul-azim | Ali'ye Öğretilen Sıkıntı Zikri | La ilahe illallahül kerimül azim | The Dhikr of Distress Taught to Ali | La ilaha illallahul karimul azim | 3 | yüksek | — | El-Ezkar 361; Hâkim; İbn Sünnî. "La ilahe illallahül azimül halim" kaydından dördüncü kelimede ayrışıyor. | |
| korku-huvellahu-rabbi | Korku Anı Tevhid Zikri | Hüvellahu Allahu Rabbi la şerike lehu | Tawhid Dhikr for Moments of Fear | Huwallahu Allahu Rabbi la sharika lahu | 3, 7 | yüksek | — | El-Ezkar 367; Taberânî. El-Ezkar bölümü "Korkup Dehşete Kapılan"; aynı bölümdeki tehlike kaydı durum adını aldığı için bu kayıt kural 3'e düştü. Virgüller kalktı. | |
| tehlike-bismillah-havkale | Tehlike Anında Besmeleli Havkale | Tehlike Anında Okunan Dua | Supplication in Times of Danger with the Basmalah and Hawqalah | Dua in Times of Danger | 2, 9 | orta | havkale, la havle vela kuvvete illa billah | El-Ezkar 370; İbn Sünnî 356. Başlangıcı besmele olduğu için kural 3 ayırt edici olmazdı → durum adı. | |
| korku-topluluktan-nuhurihim | Bir Topluluktan Korunma Duası | Bir Topluluktan Korkunca Okunan Dua | Supplication for Protection from a Hostile Group | Dua When Fearing a Group of People | 2, 9 | yüksek | — | Ebû Dâvûd 1537; El-Ezkar 371; Hısnu'l-Muslim bölüm adı "Bir Topluluktan Korkan Kimse". | |
| sikinti-inni-euzu-minel-hemmi | Sekiz Şeyden Sığınma Duası — Kaygı ve Keder | Allahümme inni euzü bike minel hemmi | Supplication of Refuge from Eight Afflictions — Anxiety and Grief | Allahumma inni a'udhu bika minal hammi | 3, 7 | yüksek | — | Buhârî 6369; Ebû Dâvûd 1555; Hısnu'l-Muslim nr. 121. 1. dalgadaki "minel keseli" ve "minel aczi" kayıtlarından ayırt edici kelimeyle ayrışıyor. Sayı nitelemesi ve em dash silindi. | |
| kaygi-ud-uni-estecib-lekum | Ud'ûnî Estecib Lekum — Dua Kabulü Ayeti | Mümin Suresi 60. Ayet | The Verse of the Response to Supplication | Surah Ghafir, Verse 60 | 4, 7, 8 | yüksek | udüni estecib leküm, gafir 60 | Mü'min (Gâfir) 40/60. İlahî hitap, dua ayeti değil → kural 4'ün ikinci biçimi. Sure adı 1. dalga sabah-mumin-ayetulkursi ile aynı ("Mümin" TR, "Ghafir" EN). | |

Değişmeyen: 0 kayıt.

## Dalga 3 — Hayat ve koruma

Bu dalga 17 dosyadaki **171 kaydı** kapsıyor (plan "~167" diyordu; gerçek sayı 171,
dosya bazlı dağılım özet tablosunda). Kurallar, "Karara bağlananlar" kutusu ve 1-2.
dalgada verilmiş başlıklar birebir uygulandı; önceki dalgalarda adı belirlenmiş her
metin aynı başlığı aldı ve not sütununda `N. dalga: <key> ile aynı` biçiminde işaretlendi.

### hastalıkVeŞifa.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| sifa-ezhibil-bese | Ezhibi'l-Be'se Duası | Hasta Ziyaretinde Okunan Dua | Adhhib al-Ba's Supplication | Dua When Visiting the Sick | 2 | yüksek | ezhibil bese | Buhârî, Merdâ 20; Müslim, Selâm 46; Hısnu'l-Muslim bölüm adı "Hasta Ziyaretinde Hastaya Yapılan Dua" (s. 78). Aynı durumdaki beş kayıttan en meşhuru → yalın durum adı; diğer dördü kural 3'e düştü. | |
| sifa-bismillahi-turbetu | Turbetü Ardınâ Duası | Bismillahi türbetü ardına | Turbat Ardina (Our Earth's Soil) Supplication | Bismillahi turbatu ardina | 3, 8 | yüksek | rukye | Buhârî, Tıbb 38; Müslim, Selâm 54. Şapkalar ve "Duası" eki kalktı. | |
| sifa-euzu-bi-izzetillah | Eûzü bi-izzetillâhi Duası | Euzü bi izzetillahi ve kudretihi | A'udhu bi-'Izzatillah (I Seek Refuge in Allah's Might) Supplication | A'udhu bi-'izzatillahi wa qudratih | 3, 8 | orta | ağrı duası | Müslim 2202; Hısnu'l-Muslim "Bedende Ağrı/Sancı Hissedilince" (s. 111). Terkip birleştirilince "biizzetillahi" çift ünlü doğurduğu için iki kelime bırakıldı (kural 8 istisnası). Durum adı yerine kural 3 seçildi; dosyada 19 kayıt aynı temada, durum adı tek duayı işaret etmezdi. | |
| sifa-eselullahel-azime | Es'elullâhe'l-Azîm Duası | Eselullahel azime Rabbel arşil azim | As'alullah al-'Azim (I Ask Allah, the Mighty) Supplication | As'alullahal 'Azim Rabbal 'Arshil 'Azim | 3, 8 | yüksek | yedi kez okunan şifa duası | Ebû Dâvûd, Cenâiz 8; Tirmizî, Tıbb 32. Hasta ziyareti yalın adı sifa-ezhibil-bese'ye gittiği için kural 3. "es'elüke" → "eselüke" tercihiyle aynı imla. | |
| sifa-bismillahi-arkike | Bismillâhi Arkîke Rukyesi | Bismillahi arkike | Bismillahi Arqika (In the Name of Allah I Recite Over You) Ruqyah | Bismillahi arqika | 3, 7, 8 | yüksek | rukye, nazar | Müslim, Selâm 40 (2186). Cebrail'in Hz. Peygamber'e okuduğu rukye; "Rukyesi" eki kalktı, tag'e alındı. | |
| sifa-enni-messeniyeddurru | Ennî Messeniyed-Durru Duası (Hz. Eyyûb) | Hz. Eyyub'un Duası | Anni Massaniyad-Durr Supplication (Prophet Job's Prayer) | The Supplication of Prophet Ayyub | 1, 7, 8 | yüksek | enbiya 83, messeniyed durru | Enbiyâ 21/83. Peygamber duası → kural 1 (kural 4'ün önünde), 2. dalga `istigfar-yunus-duasi` ile aynı tercih. Veri setinde ikinci bir Hz. Eyyûb duası yok, yalın adı aldı. Parantezli niteleme silindi. | |
| sifa-euzu-berasi-cunun | Berasi ve'l-Cunûn Duası | Allahümme inni euzü bike minel berasi | Refuge from Leprosy and Madness Supplication | Allahumma inni a'udhu bika minal baras | 3 | yüksek | — | Ebû Dâvûd, Salât 367; Nesâî, İstiâze 36. 1-2. dalgadaki "minel aczi / minel keseli / minel hemmi" kayıtlarından ayırt edici kelimeyle ayrışıyor. | |
| sifa-afiyete-dunya-ahiret | Âfiyete fi'd-Dünyâ ve'l-Âhirah Duası | Allahümme inni eselükel afiyete fid dünya | Supplication for Well-Being in This World and the Hereafter | Allahumma inni as'alukal afiyata fid dunya | 3, 8 | orta | afiyet duası | (41 kr) Ebû Dâvûd, Edeb 110; Tirmizî, Deavât 85. 1. dalga `sabah-afiyet` başlığı "Allahümme inni eselükel afiyete" ile çakıştığı için ayırt edici kelimeye uzatıldı (kalibrasyon 2). | |
| sifa-bismillahi-davini | Dâvinî bi-Devâike Duası | Allahümme davini bidevaike | Dawini bi-Dawa'ik (Treat Me with Your Remedy) Supplication | Allahumma dawini bi-dawa'ik | 3, 8 | orta | — | Heysemî, Mecmeu'z-Zevâid X/180. Metin besmeleyle başlıyor; besmele ayırt edici olmadığı için başlık ikinci cümleden alındı (2. dalga `tehlike-bismillah-havkale` gerekçesiyle aynı yönde). | |
| sifa-la-bese-tahur | Lâ Be'se Tahûrun Duası | La bese tahurun inşaallah | La Ba'sa Tahur (No Harm, It Is Purifying) Supplication | La ba'sa tahurun in sha Allah | 3, 8 | yüksek | — | Buhârî, Merdâ 10, 14. Hasta ziyaretindeki ikinci meşhur söz; yalın durum adı ezhibil-bese'ye gittiği için kural 3. | |
| sifa-bismillahi-masaallah | Bismillâhi Mâ Şâallah Duası | Bismillahi maşaallah la kuvvete illa billah | Bismillahi Ma Sha'Allah Supplication | Bismillahi ma sha Allah la quwwata illa billah | 3, 6, 8 | orta | sühreverdi virdi | (43 kr) Sühreverdî, Avârifü'l-Maârif. Aynı metin `dogalAfetlerdenKorunma/afet-bismillahi-ma-saallah-tertibi` ve `koruyucu/afet-bismillahi-ma-saallah-la-kuvvete` kayıtlarında da var; üçü de bu başlığı alıyor (kural 6). Nispet başlığa alınmadı, tag'e önerildi. | |
| sifa-isfi-abdek | Hasta Ziyaretinde Okunacak Şifa Duası | Allahümmeşfi abdeke | Healing Supplication to Recite When Visiting the Sick | Allahummashfi abdak | 3 | yüksek | — | El-Ezkar nr. 406; Ebû Dâvûd, Tıb. Yalın durum adı sifa-ezhibil-bese'ye gittiği için kural 3'e düşürüldü. | |
| sifa-sefallahu-sekameke | Hz. Peygamberin Hastaya Okuduğu Şifa Duası | Şefallahu sekameke | Healing Supplication the Prophet Recited for the Sick | Shafallahu saqamak | 3 | yüksek | — | El-Ezkar nr. 413; İbn Sünni, Amelü'l-Yevm nr. 393. Aynı durumdaki beşinci kayıt → kural 3. | |
| sifa-uizuke-billahil-ehad | Hastalıktan Korunma Duası — İhlâs Özü | Uizüke billahil ehadis samed | Supplication for Protection from Illness — Essence of Surah Al-Ikhlas | U'idhuka billahil ahadis samad | 3, 7, 8 | orta | — | El-Ezkar nr. 414; İbn Sünni nr. 392 (Hz. Osman rivayeti). Em dash sonrası alt başlık silindi; metin besmeleyle başladığı için başlık ikinci kelimeden alındı. | |
| sifa-bismillahil-kebir-irkin | Ateşli Hastalık ve Baş Ağrısı Duası | Bismillahil kebir euzü billahil azim | Supplication for Fever and Headache | Bismillahil kabir a'udhu billahil 'azim | 3 | orta | sıtma duası | El-Ezkar nr. 416; İbn Sünni. Başlık nameArabic'e göre verildi; transliterasyon "neûzü" diyor, Arapça "eûzü" (kapsam dışı not). | |
| sifa-eınni-gamerâtil-mevt | Ölüm Sıkıntısında Yardım İsteme Duası | Allahümme e'inni ala gameratil mevti | Supplication for Help Amid the Agonies of Death | Allahumma a'inni ala gamaratil mawt | 3, 8 | yüksek | sekeratül mevt | El-Ezkar nr. 430; Tirmizî, Daavât. Kural 8 istisnası: "e'inni" kesmesi korundu (2. dalga `namaz-selamdan-once-zikredinme-yardim` ile aynı tercih). | |
| sifa-elhikni-birrefik | Son Nefeste Hz. Peygamberin Duası | Allahümmeğfir li verhamni ve elhıkni | The Prophet's Supplication at His Last Breath | Allahummaghfir li warhamni wa alhiqni | 3 | orta | refiki ala | El-Ezkar nr. 431; Buhârî, Merdâ 19; Müslim, Selâm 46. 1. dalga `ozlu-bagisla-merhamet-afiyet-rizik` başlığı "Allahümmeğfir li verhamni" ile birebir çakıştığı için ayırt edici kelimeye uzatıldı (kalibrasyon 2). | |
| sifa-seyyidul-istigfar | Seyyidü'l-İstiğfar | Seyyidül İstiğfar | Sayyid al-Istighfar (The Master Supplication for Forgiveness) | Sayyid al-Istighfar | 1, 7, 8 | yüksek | — | Buhârî, Deavât 2. Kullanıcının kural 1 örneğiyle birebir; yalnız kesmeler ve parantezli çeviri kalktı. | |
| sifa-lekad-caekum-rasulun | Tevbe Suresi 128. Ayet — Şefaat ve Bela Korunma | Tevbe Suresi 128. Ayet | Surah At-Tawbah, Verse 128 — Intercession and Protection from Calamity | Surah At-Tawbah, Verse 128 | 4, 7 | yüksek | lekad caeküm rasulün | Tevbe 9/128. Dua ayeti değil → kural 4'ün ikinci biçimi; em dash sonrası konu adı silindi. | |

Değişmeyen: 0 kayıt.

### rizikMulkTertipleri.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| rizik-kombinasyon-ya-gani-ya-mugni | Ya Gani Ya Muğnî | Ya Gani Ya Muğni | Ya Ghani Ya Mughni | Ya Ghani Ya Mughni | 5, 8 | yüksek | — | Karar kutusu örneğiyle birebir: birden çok isimde her "Ya" büyük, şapka yok. EN değişmiyor. | |
| rizik-kombinasyon-ya-fettah-ya-malikel-mulk | Ya Fettâh Ya Mâlikü'l-Mülk | Ya Fettah Ya Malikel Mülk | Ya Fattah Ya Malik al-Mulk | Ya Fattah Ya Malikal Mulk | 5, 8 | yüksek | — | Karar kutusu: esma özel adları büyük ("Ya Malikel Mülk"); terkip kesmesi ve şapkalar kalktı. | |
| rizik-vakia-suresi-gece | Vâkıa Suresi (Gecelik Vird) | Vakıa Suresi | Surah Al-Waqi'ah (Nightly Recitation) | Surah Al-Waqi'ah | 1, 6, 7, 8 | yüksek | — | Sure adı. Karar kutusu: aynı sure iki tertip kaydında geçiyorsa ikisi de yalın sure adını alır (kural 6); parantezli vakit nitelemesi silindi. | |
| rizik-vakia-suresi-41-gun | Vâkıa Suresi (41 Günlük Tertip) | Vakıa Suresi | Surah Al-Waqi'ah (41-Day Recitation) | Surah Al-Waqi'ah | 1, 6, 7, 8 | yüksek | — | Üstteki kayıtla aynı başlık; gün sayısı ve "Tertip" nitelemesi kural 7 ile silindi. İki kayıt aynı adla görünecek (kalibrasyon 21 ile aynı durum). | |
| rizik-fatiha-seher-41 | Fâtiha Suresi (Seher Tertibi) | Fatiha Suresi | Surah Al-Fatihah (Pre-Dawn Recitation) | Surah Al-Fatihah | 1, 7, 8 | yüksek | — | Sure adı; vakit ve tertip nitelemesi silindi (timeOfDay alanında zaten var). | |
| rizik-kadr-suresi | Kadr Suresi | Kadir Suresi | Surah Al-Qadr | Surah Al-Qadr | 1 | yüksek | kadr suresi | Diyanet ve TDV imlasında sure adı "Kadir sûresi"; EN değişmiyor. | |
| rizik-fatir-29-30 | Fâtır 29-30 Ticaret Ayetleri | Fatır Suresi 29-30. Ayetler | Surah Fatir 29-30, the Verses of the Never-Failing Trade | Surah Fatir, Verses 29-30 | 4, 7, 8 | yüksek | len tebur | Fâtır 35/29-30. Dua ayeti değil → kural 4'ün ikinci biçimi; "Ticaret Ayetleri" konu adı uydurma, kalktı. | |
| RIZIK_EBU_UMAME | Ebû Ümâme Duası | Allahümme inni euzü bike minel hemmi | The Supplication of Abu Umamah | Allahumma inni a'udhu bika minal hammi | 3, 6, 8 | yüksek | — | **2. dalga: `sikinti-inni-euzu-minel-hemmi` ile aynı metin, aynı başlık.** Ebû Dâvûd 1555; Hısnu'l-Muslim nr. 121. "Ebû Ümâme" ravi adı, duanın yerleşik adı değil → başlığa alınmadı. | |
| rizik-hz-muaz-borc-duasi | Muâz b. Cebel'e Öğretilen Borç Duası | Allahümme malikel mülki tütil mülke | The Debt Supplication Taught to Mu'adh ibn Jabal | Allahumma malikal mulki tu'til mulka | 3 | orta | muaz b. cebel borç duası | Taberânî, el-Mu'cemü'l-Kebîr. Aynı metin `hayirliEv/HZ_MUAZ_MULK_DUASI` kaydında da var; ikisi de bu başlığı alıyor (kural 6). Nispet yerleşik ad sayılmadığı için tag'e alındı. | |
| rizik-la-ilahe-illallahul-melikul-hakkul-mubin | Lâ İlâhe İllallâhu'l-Melikü'l-Hakku'l-Mübîn | La ilahe illallahul melikül hakkul mübin | La Ilaha Illallahul-Malikul-Haqqul-Mubin | La ilaha illallahul malikul haqqul mubin | 3, 8 | orta | temcid zikri | (40 kr) Kaynak "geleneksel temcid zikirleri"; doğrulanabilir hadis kaynağı yok → kural 3. 2. dalgadaki "La ilahe illallahül azimül halim" ve "…kerimül azim" başlıklarından dördüncü kelimede ayrışıyor. | |
| rizik-hz-suleyman-mulk-duasi | Hz. Süleyman'ın Mülk Duası | Hz. Süleyman'ın Duası | Solomon's Supplication for Dominion | The Supplication of Prophet Sulayman | 1, 7 | yüksek | sad 35 | Sâd 38/35. Peygamber duası → kural 1. Veri setinde ikinci bir Hz. Süleyman duası yok, yalın adı aldı. Aynı metin `hayirliEv/SAD_35` kaydında da var, aynı başlık (kural 6). | |
| rizik-ya-zul-celali-vel-ikram | Ya Zül Celâli vel İkrâm | Ya Zülcelali vel İkram | Ya Dhal-Jalali wal-Ikram | Ya Dhal-Jalali wal-Ikram | 5, 6, 8 | yüksek | — | **2. dalga: `sikinti-ya-zulcelali-vel-ikram` ile aynı başlık.** Şapkalar kalktı, terkip birleşti. EN değişmiyor. | |
| rizik-kfini-bihalali-an-harami | Helal Rızık ve Borçtan Kurtuluş Duası | Allahümmekfini bihalalike an haramike | Supplication for Lawful Provision and Freedom from Debt | Allahummakfini bi-halalika an haramik | 3, 6 | yüksek | helal rızık duası | Tirmizî, Deavât 121 (3563). Aynı metin `isHayatiKariyer/is-allahumme-ikfini-bi-helalike` ve `hayirliEv/HZ_ALI_HELAL_RIZIK` kayıtlarında da var; üçü de bu başlığı alıyor (kural 6). | |
| rizik-carsiya-girerken-istiaze | Çarşıda Yanlış İşten Korunma Duası | Çarşıya Girerken Okunan Dua | Supplication for Protection from Wrongdoing in the Marketplace | Dua When Entering the Marketplace | 2, 6 | yüksek | — | Tirmizî, Deavât 47 (3428); Hısnu'l-Muslim bölüm adı "Çarşı ve Pazara Girerken" (s. 99). Karar kutusunda açıkça sayılan durum-adı istisnası. | |
| rizik-talak-men-yettekillah | Beklenmedik Rızık Ayeti | Talak Suresi 2-3. Ayetler | The Verse of Unforeseen Provision | Surah At-Talaq, Verses 2-3 | 4, 7 | yüksek | men yettekıllahe yecal lehu mahrecen | Talâk 65/2-3. Karar kutusu örneğiyle birebir; "Beklenmedik Rızık Ayeti" uydurma konu adı, kalktı. | |
| rizik-nuh-istigfar-rizk | Hz. Nuh'un İstiğfar ve Rızık Ayeti | Nuh Suresi 10-12. Ayetler | Prophet Noah's Verse of Seeking Forgiveness and Provision | Surah Nuh, Verses 10-12 | 4, 7 | yüksek | istağfiru rabbeküm | Nûh 71/10-12. Hz. Nûh'un kavmine hitabı; dua değil → kural 4'ün ikinci biçimi. Dosyadaki tek Hz. Nûh duası `haksizlikVeMulkKoruma/haksizlik-fedea-rabbehu-magluban`, o kayıt kural 1 aldı. | |

Değişmeyen: 0 kayıt.

### hayirliEvlatZikirleri.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| evlat-rabbi-la-tezerni | Hz. Zekeriya Duası | Hz. Zekeriya'nın Duası | Supplication of Prophet Zechariah | The Supplication of Prophet Zakariyya | 1, 8 | orta | enbiya 89, rabbi la tezerni ferden | Enbiyâ 21/89. Peygamber duası → kural 1. Dosyada ikinci bir Hz. Zekeriyyâ duası var (`evlat-rabbi-heb-li-min-ledunke`, Âl-i İmrân 38); Türkiye'de "Hz. Zekeriyyâ'nın duası" denince en çok bu ayet anıldığı için yalın adı bu kayda verildi, diğeri başlangıç sözlerine düştü — kalibrasyon 23. | |
| evlat-rabbi-heb-li-min-ledunke | Temiz Nesil Duası | Rabbi heb li min ledünke | Supplication for Pure Offspring | Rabbi hab li min ladunka | 1, 3 | orta | hz. zekeriya duası, al-i imran 38 | Âl-i İmrân 3/38. Bu da Hz. Zekeriyyâ'nın duası; aynı peygamberin ikinci duası olduğu için karar kutusu gereği çakışma başlangıç sözleriyle çözüldü — kalibrasyon 23. | |
| evlat-rabbi-heb-li-mine-salihin | Hz. İbrahim'in Evlat Duası | Rabbi heb li mines salihin | Supplication of Prophet Abraham for Offspring | Rabbi hab li minas salihin | 1, 3 | orta | hz. ibrahim duası, saffat 100 | Sâffât 37/100. Dosyada/dalgada ikinci bir Hz. İbrâhim duası var (`evlilikHuzur/evlilik-ibrahim-40-41`); ikisi de başlangıç sözlerine düştü, "Hz. İbrahim'in Duası" yalın adı hiçbirine verilmedi — kalibrasyon 24. Üstteki "Rabbi heb li min ledünke"den dördüncü kelimede ayrışıyor. | |
| evlat-rabbena-heb-lena-min-ezvacina | Aile ve Zürriyet Duası | Rabbena heb lena min ezvacina | Supplication for Family and Offspring | Rabbana hab lana min azwajina | 4, 6 | yüksek | furkan 74, ibadurrahman duası | Furkân 25/74. Dua ayeti → kural 4'ün birinci biçimi. Aynı ayet `evlilikHuzur/evlilik-furkan-74` kaydında da var, aynı başlık (kural 6). | |
| evlat-inne-rabbeke-huvel-hallakul-alim | Hâllâk ve Alîm Esması Ayeti | Hicr Suresi 86. Ayet | Verse of the Divine Names Al-Khallaq and Al-Alim | Surah Al-Hijr, Verse 86 | 4, 7, 8 | yüksek | hallakul alim | Hicr 15/86. Dua değil → kural 4'ün ikinci biçimi; "Esması Ayeti" editoryal konu adı, kalktı. | |
| evlat-fallahu-huvel-veliyyu-ve-huve-yuhyi | Veliyy ve Muhyî Ayeti | Şura Suresi 9. Ayet | Verse of the Divine Names Al-Waliyy and Al-Muhyi | Surah Ash-Shura, Verse 9 | 4, 7, 8 | yüksek | — | Şûrâ 42/9. Dua değil → kural 4'ün ikinci biçimi. | |
| evlat-huvel-lahul-haliqul-bariu | Hâlık-Bârî Esma Ayeti | Haşr Suresi 24. Ayet | Verse of the Divine Names Al-Khaliq and Al-Bari | Surah Al-Hashr, Verse 24 | 4, 7, 8 | yüksek | hüvellahül halikul bari | Haşr 59/24. Dua değil → kural 4'ün ikinci biçimi. 1. dalga `sabah-euzu-billahis-semii-hasr` Haşr'ın son üç ayetini (22-24) taşıyor; bu kayıt yalnız 24. ayetin bir bölümü (kapsam dışı not). | |
| evlat-estagfirullah-el-azim-el-lezi | Hayy Kayyûm İstiğfarı | Estağfirullahellezi la ilahe illa hu | Seeking Forgiveness Through Al-Hayy and Al-Qayyum | Astaghfirullahalladhi la ilaha illa huwa | 3, 6 | yüksek | — | **1. dalga: `uyku-istigfar-kayyum` ile aynı metin, aynı başlık** (2. dalga `istigfar-hayyel-kayyum` de aynı). Ebû Dâvûd 1517; Tirmizî 3577. | |
| evlat-bismillah-allahumme-cennibnes-seytan | Birliktelik Öncesi Korunma Duası | Allahümme cennibneş şeytane | Supplication for Protection Before Intimacy | Allahumma jannibnash shaytan | 3 | yüksek | — | Müslim, Nikâh 11; Hısnu'l-Muslim "Hanımıyla Birlikte Olmadan Önce". Metin besmeleyle başlıyor, besmele ayırt edici olmadığı için başlık ikinci cümleden alındı. | |
| evlat-allahummecalni-zurriyyeten-tayyibeten | Temiz ve İtaatkâr Nesil Duası | Allahümmecal li min ledünke zürriyyeten | Supplication for Pure and Obedient Offspring | Allahummaj'al li min ladunka dhurriyyatan | 3 | düşük | — | Kaynak yalnız "Bilal Eren, Açıklamalı Büyük Dua Hazinesi"; hadis kaynağı ve yerleşik ad yok → kural 3. Başlık nameArabic'e göre ("Allahümmec'al lî"); transliterasyon "Allâhümmec'alnî" diyor (kapsam dışı not). | |
| evlat-ya-musavvir | Yâ Musavvir | Ya Musavvir | O Al-Musawwir (The Fashioner) | Ya Musawwir | 5, 7, 8 | yüksek | — | Tema setindeki esma zikri → kural 5 biçimi; şapka ve parantezli çeviri kalktı. | |
| evlat-ya-bari | Yâ Bâri' | Ya Bari | O Al-Bari (The Originator) | Ya Bari' | 5, 7, 8 | yüksek | — | Şapkalar kalktı; "Bari" kesmesiz de doğru okunuyor (kural 8), EN'de kesme korundu (kural 9). | |
| evlat-ya-mubdi | Yâ Mübdi' | Ya Mübdi | O Al-Mubdi (The Originator) | Ya Mubdi' | 5, 7, 8 | yüksek | — | Aynı gerekçe; "Mübdi" kesmesiz doğru okunuyor. | |
| evlat-es-samed | Es-Samed | Ya Samed | As-Samad | Ya Samad | 5, 8 | orta | es samed | Aynı setteki diğer beş esma kaydı "Yâ …" biçiminde; bu kaydın nameArabic'i yalın "الصمد". Kural 5'in "Ya Rezzak" biçimi uygulandı, eski biçim tag'e alındı — kalibrasyon 25. | |

Değişmeyen: 1 kayıt (`evlat-rabbi-inni-nezertu` — "Hz. Meryem'in Annesinin Duası" Âl-i İmrân 3/35'teki nispeti doğrudan Kur'an'dan alıyor; şapka, sayı, parantez, em dash yok, EN'de de aksan yok).

### evlilikHuzur.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| evlilik-rum-21 | Rum Suresi Evlilik Ayeti | Rum Suresi 21. Ayet | Marriage Verse of Surah Ar-Rum | Surah Ar-Rum, Verse 21 | 4, 7 | yüksek | meveddet ayeti | Rûm 30/21. Karar kutusu örneğiyle birebir: dua olmayan ayet → sure + ayet numarası. | |
| evlilik-furkan-74 | Göz Aydınlığı Duası | Rabbena heb lena min ezvacina | Supplication for Comfort of the Eyes | Rabbana hab lana min azwajina | 4, 6 | yüksek | furkan 74, kurrate ayün | Furkân 25/74. Dua ayeti → başlangıç sözleri. `hayirliEvlatZikirleri/evlat-rabbena-heb-lena-min-ezvacina` ile aynı metin, aynı başlık (kural 6). | |
| evlilik-ellif-beyne-kulubina | Kalpleri Birleştirme Duası | Allahümme ellif beyne kulubina | Supplication for Uniting the Hearts | Allahumma allif bayna qulubina | 3, 6 | yüksek | kunut duası | Ebû Dâvûd, Salât; Taberânî. `barismaVeSulh/barisma-ellif-beyne-kulubina` ile aynı dua (bu kayıt daha uzun: "ve barik lena… ve tüb aleyna" fazlası var); ikisi de bu başlığı alıyor (kural 6). | |
| evlilik-nisa-128 | Sulh Ayeti | Nisa Suresi 128. Ayet | Verse of Reconciliation | Surah An-Nisa, Verse 128 | 4, 7 | yüksek | vessulhu hayr | Nisâ 4/128. Karar kutusu: "Sulh Ayeti" uydurma konu adı, kalkıyor. | |
| evlilik-ali-imran-31 | Muhabbet Ayeti | Al-i İmran Suresi 31. Ayet | Verse of Love | Surah Aal-i Imran, Verse 31 | 4, 7 | yüksek | ayetül mahabbe | Âl-i İmrân 3/31. Dua değil, ilahî hitap → kural 4'ün ikinci biçimi. Sure adının şapkasız yazımı karar kutusundaki "Al-i İmran 173" ile aynı. | |
| evlilik-araf-89-ftah | Adaletle Hükmet Duası | Rabbenaftah beynena ve beyne kavmina | Supplication for a Just Verdict | Rabbanaftah baynana wa bayna qawmina | 4, 6 | yüksek | araf 89 | A'râf 7/89 (Hz. Şuayb'ın duası). Dua ayeti → başlangıç. `barismaVeSulh/barisma-rabbena-ftah-beynena` ile aynı metin, aynı başlık (kural 6). Peygamber duası olmasına rağmen kural 1 kullanılmadı: "Hz. Şuayb'ın Duası" Türkiye'de yerleşik bir anılış değil. | |
| evlilik-kasas-24 | Hz. Musa'nın Muhtaçlık Duası | Rabbi inni lima enzelte ileyye | Prophet Musa's Supplication of Need | Rabbi inni lima anzalta ilayya | 1, 3 | orta | hz. musa duası, kasas 24 | Kasas 28/24. Hz. Mûsâ'nın ikinci duası; "Hz. Musa'nın Duası" yalın adı Tâhâ 25-28 kaydına gittiği için çakışma başlangıç sözleriyle çözüldü (karar kutusu) — kalibrasyon 24. | |
| evlilik-ibrahim-40-41 | Hz. İbrahim'in Nesil Duası | Rabbicalni mukimes salati | Prophet Ibrahim's Supplication for Righteous Offspring | Rabbij'alni muqimas salati | 1, 3 | orta | hz. ibrahim duası, ibrahim 40 | İbrâhîm 14/40-41. Aynı peygamberin ikinci duası (`hayirliEvlatZikirleri/evlat-rabbi-heb-li-mine-salihin`) olduğu için başlangıç sözlerine düşüldü — kalibrasyon 24. | |
| evlilik-bakara-237-fadl | Fadlı Unutmayın Ayeti | Bakara Suresi 237. Ayet | Verse of Not Forgetting Graciousness | Surah Al-Baqarah, Verse 237 | 4, 7 | yüksek | — | Bakara 2/237. Dua değil → kural 4'ün ikinci biçimi. | |
| evlilik-nisa-19 | Güzel Geçim ve Sabır Ayeti | Nisa Suresi 19. Ayet | Verse of Kind Companionship and Patience | Surah An-Nisa, Verse 19 | 4, 7 | yüksek | veaşiruhünne bil maruf | Nisâ 4/19. Dua değil → kural 4'ün ikinci biçimi. | |
| evlilik-tevbe-129 | Yüz Çevrildikten Sonra Tevekkül Ayeti | Hasbiyallahu la ilahe illa hu | Verse of Reliance upon Being Turned Away From | Hasbiyallahu la ilaha illa huwa | 6 | orta | tevbe 129 | **Karar 14:** Tevbe 129 → "Hasbiyallahu la ilahe illa hu"; 1. dalga `aksam-hasbiyallah` ile aynı başlık. Bu kayıt ayetin "Fe in tevellev fe kul" girişini de taşıyor, başlık bunu yansıtmıyor (kapsam dışı not). Aynı başlık `ofkeKontrol/ofke-hasbiyallahu` ve `hasettenKorunma/haset-hasbiyallahu` kayıtlarına da verildi. | |
| evlilik-isra-25-evvabun | Evvâbîn Affı Ayeti | İsra Suresi 25. Ayet | Verse of Forgiveness for Those Who Turn Back | Surah Al-Isra, Verse 25 | 4, 7, 8 | yüksek | evvabin | İsrâ 17/25. Dua değil → kural 4'ün ikinci biçimi. | |
| evlilik-zifaf-hayra-dua | Zifaf Öncesi — Eşin Hayrına Dua | Zifaf Gecesi Okunan Dua | Before the Wedding Night — Supplication for the Spouse's Good | Dua on the Wedding Night | 2, 7 | yüksek | — | Ebû Dâvûd, Nikâh 44-45 (2160); El-Ezkar nr. 810; Hısnu'l-Muslim bölüm adı "Evlenen Kimsenin Yapacağı Dua" (s. 93). Durumda tek kayıt → yalın durum adı; em dash sonrası alt başlık silindi. | |
| evlilik-hubbeke-muaz | Muâz b. Cebel'in Hubb Duası | Allahümme inni eselüke hubbeke | Mu'adh ibn Jabal's Supplication of Love | Allahumma inni as'aluka hubbaka | 3 | yüksek | muaz b. cebel duası | Tirmizî, Deavât; Nevevî, Riyâzü's-Sâlihîn. Nispet yerleşik ad sayılmadığı için tag'e alındı. 1. dalgadaki "Allahümme inni eselüke…" kayıtlarından "hubbeke" ile ayrışıyor. | |

Değişmeyen: 0 kayıt.

### sinavVeYazili.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| sinav-rabbi-edhilni | Sınav Duası | Rabbi edhilni müdhale sıdkın | Supplication for Examinations | Rabbi adkhilni mudkhala sidqin | 4 | yüksek | isra 80 | İsrâ 17/80. Dua ayeti → kural 4'ün birinci biçimi. "Sınav Duası" uydurma konu adı; ayetin sınavla ilgisi yok, giriş-çıkış duası. | |
| sinav-rabbisrahli-sadri | Hz. Mûsâ'nın Duası | Hz. Musa'nın Duası | The Supplication of Prophet Musa (peace be upon him) | The Supplication of Prophet Musa | 1, 7, 8 | yüksek | taha 25, rabbişrah li sadri | Tâhâ 20/25-28. Karar kutusundaki kural 1 örneğiyle birebir. Yalın ad bu metne verildi (Türkiye'de "Hz. Mûsâ'nın duası" denince akla gelen budur); Kasas 24 kaydı başlangıç sözlerine düştü. Aynı metin `hayirliEv/TAHA_25_28` kaydında da var, aynı başlık (kural 6). | |
| sinav-rabbi-yessir | Kolaylık Duası | Rabbi yessir vela tuassir | Supplication for Ease | Rabbi yassir wa la tu'assir | 3 | orta | — | Kaynak alanı bunun hadisten türetilmiş şahsî bir dua formu olduğunu söylüyor (Buhârî 69 "yessirû velâ tuassirû"); yerleşik ad yok, "Kolaylık Duası" editoryal → kural 3. | |
| sinav-sekine-fetih | Sekîne ve Feth Terkibi (Geleneksel) | Sekine ve Feth Terkibi | The Composition of Sakinah and Fath (Traditional) | The Composition of Sakinah and Fath | 7, 8 | orta | sekine duası | Kaynak alanı "doğrudan nebevî hadis senedi yoktur" diyor ve Hz. Ali'ye nispet ediyor; nispet başlığa alınmadı. Mecmualardaki "Sekîne duası" 19 harfli tertiptir, bu kayıt dört bölümlü farklı bir terkip olduğu için yalın "Sekine Duası" adı verilmedi, tag'e alındı — kalibrasyon 26. | |
| sinav-ya-hayyu-ya-kayyum | Yâ Hayyü Yâ Kayyûm | Ya Hayyu Ya Kayyum | Ya Hayyu Ya Qayyum | Ya Hayyu Ya Qayyum | 5, 6, 8 | yüksek | istigase | **1. dalga: `sabah-ya-hayyu-kayyum`, 2. dalga: `sikinti-ya-hayyu-ya-kayyum` ile aynı başlık.** Tirmizî 3524. EN değişmiyor. | |
| sinav-allahumme-la-sehle | Zorluğu Kolaylaştırma Duası | Allahümme la sehle illa ma cealtehü | Supplication for Making Difficulty Easy | Allahumma la sahla illa ma ja'altahu | 3 | yüksek | — | İbn Hibbân nr. 2427; İbnü's-Sünnî nr. 351. Eski başlık meal; kural 3'e düşüldü. | |
| sinav-estovdiuke-ilim | İlmi Emanet Duası | Allahümme inni estevdiuke | Supplication for Entrusting Knowledge | Allahumma inni astawdi'uka | 3 | orta | ilim emaneti duası | Kaynak "ed-Dürretü'l-harîde 1/53", geleneksel ilim geleneği; hadis kaynağı yok → kural 3. `yolculukDualari/yolculuk-estevdiullah-dine` ("Estevdiullahe…") ile ilk kelimede ayrışıyor. | |
| sinav-rabbi-zidni-ilmen | Rabbi Zidnî İlmen | Rabbi zidni ilmen | Rabbi Zidni Ilma | Rabbi zidni ilma | 4, 8 | yüksek | taha 114 | Tâhâ 20/114. Karar kutusu örneğiyle birebir; yalnız şapka ve büyük harf düzeni düzeltildi. | |
| sinav-senukriuke-fela-tensa | Senukriuke Felâ Tensâ | A'la Suresi 6. Ayet | Sanuqri'uka fala tansa | Surah Al-A'la, Verse 6 | 4, 8 | yüksek | senukriüke fela tensa | A'lâ 87/6. Dua değil, ilahî hitap → kural 4'ün ikinci biçimi. Kural 8 istisnası: "A'la" kesmesi korundu, kalkınca "ala" yanlış okunuyor. | |
| sinav-allahumme-hirli | Doğru Tercih Duası | Allahümme hır li vehter li | Supplication for the Right Choice | Allahumma khir li wakhtar li | 3, 6 | orta | istihare duası | Tirmizî 3516. **2. dalga `istihare-allahümme-hir-li` ile aynı metin.** Karar 17: o kayıt gerçek istihare durumunun duası olduğu için "İstihare Duası: Allahümme hır li" adını korudu; bu kayıt tematik sınav setine konmuş kopya olduğu için duanın kendi başlangıç sözlerini aldı. | |
| sinav-nun-vel-kalemi | Nûn Vel-Kalemi | Kalem Suresi 1. Ayet | Nun wal-Qalam | Surah Al-Qalam, Verse 1 | 4, 8 | yüksek | nun vel kalemi | Kalem 68/1. Dua değil, kasem → kural 4'ün ikinci biçimi. | |
| sinav-yuktel-hikmete | Hikmet Ayeti | Bakara Suresi 269. Ayet | The Verse of Wisdom | Surah Al-Baqarah, Verse 269 | 4, 7 | yüksek | hikmet ayeti | Bakara 2/269. Dua değil → kural 4'ün ikinci biçimi; yaygın anılış tag'e alındı (kalibrasyon 10 ile aynı tercih). | |

Değişmeyen: 1 kayıt (`sinav-bismillahi-ve-subhanellahi` — "Tesbih ve Havkale Terkibi" kaydın bileşik içeriğini doğru tarif ediyor, uydurma bir ad değil; şapka, sayı, parantez, em dash yok. Başlangıcı besmele olduğu için kural 3 ayırt edici olmazdı, 2. dalga `tehlike-bismillah-havkale` gerekçesiyle aynı yönde).

### isHayatiKariyer.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| is-allahumme-inni-eselukes-sebate | Sebat ve Rüşd Duası | Allahümme inni eselükes sebate fil emri | Supplication for Steadfastness and Guidance | Allahumma inni as'alukas thabata fil amri | 3, 8 | yüksek | sebat duası | (39 kr) Tirmizî, Deavât 23 (Şeddâd b. Evs rivayeti). 1. dalgadaki "Allahümme inni eselükel hüda vet tüka" ve "…el afiyete" başlıklarından ayırt edici kelimeyle ayrışıyor. | |
| is-allahumme-ikfini-bi-helalike | Helal Rızık ve İstiğna Duası | Allahümmekfini bihalalike an haramike | Supplication for Lawful Provision and Contentment | Allahummakfini bi-halalika an haramik | 3, 6 | yüksek | helal rızık duası | Tirmizî, Deavât 121. `rizikMulkTertipleri/rizik-kfini-bihalali-an-harami` ve `hayirliEv/HZ_ALI_HELAL_RIZIK` ile aynı metin, aynı başlık (kural 6). | |
| is-allahumme-ya-ganiyyu-ya-hamidu | İmam-ı Azam'dan Bereket ve Helal Rızık Duası | Allahümme ya Ganiyyü ya Hamidü | Supplication of Blessing and Lawful Provision from Imam al-A'zam | Allahumma ya Ghaniyyu ya Hamidu | 3, 6 | orta | bereket duası | İmâm-ı Âzam nispeti literatürde doğrulanamadı → başlığa alınmadı (karar kutusu). `hayirliEv/GAZALI_ZENGINLIK` aynı duanın ikinci rivayeti (orada fazladan "yâ Fe'âlü limâ yürîd", sonunda "ekfinî" yerine "ağninî"); ortak önek 40 karakteri aşmadan ayırt edici kelimeye ulaşılamadığı için ikisi de aynı başlığı alıyor (kural 6) — kalibrasyon 27. | |
| is-yusuf-54-56-kariyer-tertibi | Yûsuf Sûresi 54-56 Kariyer ve Makam Ayetleri | Yusuf Suresi 54-56. Ayetler | Surah Yusuf 54-56, Verses of Career and Position | Surah Yusuf, Verses 54-56 | 4, 7, 8 | yüksek | — | Yûsuf 12/54-56. Dua değil, kıssa anlatımı → kural 4'ün ikinci biçimi; "Kariyer ve Makam" konu adı ve "Tertibi" nitelemesi kalktı. | |
| is-ibrahim-7-sukur-bereket | İbrâhîm Sûresi 7. Ayet Şükür ve Artış Ayeti | İbrahim Suresi 7. Ayet | Surah Ibrahim, Verse 7 — Verse of Gratitude and Increase | Surah Ibrahim, Verse 7 | 4, 7, 8 | yüksek | lein şekertüm leezidenneküm | İbrâhîm 14/7. Dua değil → kural 4'ün ikinci biçimi; ikinci konu adı ve em dash silindi. | |
| is-ya-rafi-kariyer-yukselis | Yâ Râfi' | Ya Rafi | Ya Rafi' | Ya Rafi' | 5, 8 | yüksek | — | Tema setindeki esma zikri → kural 5. Şapkalar ve kesme kalktı; "Rafi" kesmesiz doğru okunuyor. EN'de kesme korundu (kural 9). | |

Değişmeyen: 0 kayıt.

### hayirliEv.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| MUMINUN_29 | Mü'minûn Suresi 29. Ayeti (Bereketli Yerleşim Yakarışı) | Rabbi enzilni münzelen mübareken | Surah Al-Mu'minun, Verse 29 (Supplication for a Blessed Dwelling) | Rabbi anzilni munzalan mubarakan | 4, 7, 8 | yüksek | müminun 29 | Mü'minûn 23/29 (Hz. Nûh'un duası). Dua ayeti → kural 4'ün birinci biçimi; parantezli konu adı silindi. Kural 1 kullanılmadı, dalgada ikinci bir Hz. Nûh duası var. | |
| AL_I_IMRAN_26 | Âl-i İmrân Suresi 26. Ayeti (Mülk İsteme Ayeti) | Kulillahümme malikel mülki | Surah Aal-i-Imran, Verse 26 (The Verse of Seeking Sovereignty) | Qulillahumma malikal mulki | 4, 7, 8 | orta | al-i imran 26, mülk ayeti | Âl-i İmrân 3/26. "Kul" emriyle başlayan dua ayeti → kural 4'ün birinci biçimi. `HZ_MUAZ_MULK_DUASI` ile aynı sözlerle devam ediyor ama ilk kelimede ayrışıyor. | |
| HZ_MUAZ_MULK_DUASI | Hz. Muaz'ın Borç ve Mülk Duası | Allahümme malikel mülki tütil mülke | Mu'adh's Supplication for Freedom from Debt and Sovereignty | Allahumma malikal mulki tu'til mulka | 3, 6 | orta | muaz b. cebel borç duası | Taberânî, el-Mu'cemü's-Sağîr 1/202; Hâkim 1/721. `rizikMulkTertipleri/rizik-hz-muaz-borc-duasi` ile aynı dua, aynı başlık (kural 6); nispet tag'e alındı. | |
| MESKEN_GENISLIGI | Mesken Genişliği ve Bereket Duası | Allahümmeğfir li zenbi ve vessi li fi dari | Supplication for an Expanded Home and Provision | Allahummaghfir li dhanbi wa wassi' li fi dari | 3 | yüksek | — | (42 kr) El-Ezkâr nr. 82 (Ebû Mûsâ el-Eş'arî); Tirmizî, Deavât 121. 2. dalga `namaz-secde-gunahlarin-bagisilmasi` ("Allahümmeğfir li zenbi külleh") ile dördüncü kelimede ayrışıyor. | |
| SAD_35 | Hz. Süleyman'ın Geniş Mülk Talebi | Hz. Süleyman'ın Duası | Solomon's Supplication for an Unmatched Sovereignty | The Supplication of Prophet Sulayman | 1, 6, 7 | yüksek | sad 35 | Sâd 38/35. `rizikMulkTertipleri/rizik-hz-suleyman-mulk-duasi` ile aynı metin, aynı başlık (kural 6). | |
| GAZALI_ZENGINLIK | İmam Gazalî'nin Zenginlik ve İktifa Duası | Allahümme ya Ganiyyü ya Hamidü | Imam al-Ghazali's Supplication for Sufficiency and Prosperity | Allahumma ya Ghaniyyu ya Hamidu | 3, 6 | orta | bereket duası | İmam Gazâlî nispeti literatürde doğrulanamadı (kaynak alanı yalnız "Zenginlik Duaları Derlemesi") → başlığa alınmadı. `isHayatiKariyer/is-allahumme-ya-ganiyyu-ya-hamidu` ile aynı duanın iki rivayeti; ikisi de aynı başlığı alıyor — kalibrasyon 27. | |
| YA_MUBDIU_HAVASS | Yâ Mübdiü Esmasının Havassı | Ya mübdiel beraya ve muideha | The Special Virtue of the Divine Name Al-Mubdi (The Originator) | Ya mubdi'al baraya wa mu'idaha | 3, 7, 8 | orta | ya mübdi | Kaynak "Geleneksel Havas Kaynakları". Yalın esma zikri değil, esmayı içine alan bir terkip; kural 5 yerine kural 3 uygulandı. "Havassı" nitelemesi başlıktan çıktı. | |
| TAHA_25_28 | Tâhâ Suresi Kolaylık Ayeti | Hz. Musa'nın Duası | The Verse of Ease from Surah Taha | The Supplication of Prophet Musa | 1, 6, 7, 8 | yüksek | taha 25, rabbişrah li sadri | Tâhâ 20/25-28. `sinavVeYazili/sinav-rabbisrahli-sadri` ile aynı metin, aynı başlık (kural 6); peygamber duası → kural 1 (kural 4'ün önünde). | |
| HZ_ALI_HELAL_RIZIK | Hz. Ali'nin Helal Rızık ve Borçtan Kurtulma Duası | Allahümmekfini bihalalike an haramike | Ali's Supplication for Lawful Provision and Freedom from Debt | Allahummakfini bi-halalika an haramik | 3, 6 | yüksek | helal rızık duası | Tirmizî, Daavât 121. Hz. Ali rivayetin ravisi, duanın yerleşik adı değil → başlığa alınmadı. `rizik-kfini-bihalali-an-harami` ve `is-allahumme-ikfini-bi-helalike` ile aynı başlık (kural 6). | |
| EVE_GIRERKEN_DUA | Eve Girerken Okunacak Nebevi Sığınma | Eve Girerken Okunan Dua | The Prophetic Supplication for Entering the Home | Dua When Entering the Home | 2, 6 | orta | — | **1. dalga: `ev-giris-bismillah` ile aynı başlık.** Karar kutusundaki durum-adı istisnası (eve girerken = Hısnu'l-Muslim bölümü). nameArabic burada "Allâhümmercı'nâ…" ile başlıyor, 1. dalga kaydı ise "Bismillâhi velecnâ…"; aynı hadisin eksik/bozuk bir aktarımı olabilir (kapsam dışı not). | |
| ISMI_AZAM_DUASI | İsmi Azam Duası | İsmi Azam Duası | The Supplication of the Greatest Name of Allah (Ism al-A'zam) | The Supplication of the Greatest Name | 1, 6, 7 | yüksek | ismi azam | Tirmizî, Deavât 82; Ebû Dâvûd, Salât 368. TR başlık zaten kurala uygun, değişmiyor; EN'deki parantezli niteleme kural 7 ile silindi. `dogalAfetlerdenKorunma/afet-allahumme-inni-eseluke-bi-enne-lekel-hamd` ile aynı metin, aynı başlık (kural 6). | |

Değişmeyen: 0 kayıt.

### ofkeKontrol.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| ofke-euzubillah | Eûzü Billâhi | Öfkelenince Okunan Dua | Seeking Refuge in Allah from Satan | Dua When Angry | 2, 6, 8 | yüksek | euzü billahi mineş şeytanir racim, istiaze | Buhârî 6115; Müslim 2610; Hısnu'l-Muslim bölüm adı "Öfkelenince Yapılan Dua" (s. 93). Metin sade istiâze formülü; aynı formül 2. dalgada `iman-suphe-euzu-billah` ve `iman-namaz-vesvese-euzu` kayıtlarında da durum adıyla ayrıştırılmıştı (karar 17), burada da aynı tercih. | |
| ofke-rabbi-muhammed | Kalbimin Öfkesini Gider Duası | Allahümme Rabbe Muhammedin | Supplication for Removing Anger from the Heart | Allahumma Rabba Muhammadin | 3 | orta | — | Taberânî, el-Mu'cemü'l-Kebîr; Ahmed b. Hanbel, Müsned. Eski başlık Türkçe meal; durumun yalın adı üstteki kayda gittiği için kural 3. | |
| ofke-kelimetu-hak | Öfke Anında Hak Sözü Söyleme Duası | Allahümme inni eselüke kelimetel hakkı | Supplication for Speaking Truth in Anger | Allahumma inni as'aluka kalimatal haqqi | 3, 7 | yüksek | — | (38 kr) Nesâî; İbn Mâce (Ammâr b. Yâsir rivayeti). 1. dalgadaki "Allahümme inni eselüke…" kayıtlarından "kelimetel" ile ayrışıyor; durum bilgisi suitableFor alanında zaten var. | |
| ofke-hasbiyallahu | Hasbiyallâh Zikri | Hasbiyallahu la ilahe illa hu | Hasbiyallah Dhikr | Hasbiyallahu la ilaha illa huwa | 3, 6, 8 | yüksek | hasbiyallah, tevbe 129 | **Karar 14 / 1. dalga `aksam-hasbiyallah` ile aynı başlık.** Tevbe 9/129; İbn Sünnî, Amelü'l-Yevm. | |
| ofke-estagfirullah-hayy-kayyum | Hayy-Kayyûm İstiğfarı | Estağfirullahellezi la ilahe illa hu | Istighfar by the Names Al-Hayy and Al-Qayyum | Astaghfirullahalladhi la ilaha illa huwa | 3, 6, 8 | yüksek | — | **1. dalga: `uyku-istigfar-kayyum` ile aynı metin, aynı başlık.** Ebû Dâvûd 1517; Tirmizî 3577. | |
| ofke-lokman-17 | Hz. Lokman'ın Sabır Öğüdü | Lokman Suresi 17. Ayet | Luqman's Counsel of Patience | Surah Luqman, Verse 17 | 4, 7 | yüksek | vasbir ala ma esabek | Lokmân 31/17. Dua değil, Hz. Lokmân'ın oğluna öğüdü → kural 4'ün ikinci biçimi. Kural 1 kullanılmadı: metin bir dua değil. | |

Değişmeyen: 0 kayıt.

### barismaVeSulh.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| barisma-ellefe-beyne-kulubihim | Kalpleri Birleştiren Allah'tır | Enfal Suresi 63. Ayet | Allah Unites Hearts | Surah Al-Anfal, Verse 63 | 4, 7 | yüksek | ellefe beyne kulubihim | Enfâl 8/63. Dua değil, ilahî haber → kural 4'ün ikinci biçimi; eski başlık meal. | |
| barisma-ellif-beyne-kulubina | Kalplerimizi Birleştir Duası | Allahümme ellif beyne kulubina | Supplication for the Unity of Hearts | Allahumma allif bayna qulubina | 3, 6 | yüksek | kunut duası | Ebû Dâvûd, Kitâbü's-Salât. `evlilikHuzur/evlilik-ellif-beyne-kulubina` ile aynı dua (orada daha uzun rivayet), aynı başlık (kural 6). | |
| barisma-vela-tecal-fi-kulubina-gillen | Kalpteki Kini Giderme Duası | Rabbenağfir lena ve li ihvanina | Supplication to Remove Resentment from the Heart | Rabbanaghfir lana wa li ikhwanina | 4, 6 | yüksek | haşr 10 | Haşr 59/10. Dua ayeti → kural 4'ün birinci biçimi. `hasettenKorunma/RABBENA_GFIR_GILLA` ile aynı metin, aynı başlık (kural 6). 1. dalga "Allahümmeğfir li verhamni" başlığından ilk kelimede ayrışıyor. | |
| barisma-rabbena-ftah-beynena | Anlaşmazlıkta Hakkı Gösterme Duası | Rabbenaftah beynena ve beyne kavmina | Supplication for a Just Judgment | Rabbanaftah baynana wa bayna qawmina | 4, 6 | yüksek | araf 89 | A'râf 7/89. `evlilikHuzur/evlilik-araf-89-ftah` ile aynı metin, aynı başlık (kural 6). | |
| barisma-barekellahu-lekum | Eşler İçin Bereket ve Birlik Duası | Evlenene Okunan Dua | Supplication for Blessings and Unity for Spouses | Dua for the Newly Married | 2 | orta | barekellahu leküm | Nesâî 3371; Ahmed b. Hanbel 1739; Hısnu'l-Muslim bölüm adı "Evlenen Kimse İçin Yapılan Dua" (s. 92). Metin nikâh tebriği; kaydın bulunduğu "barışma ve sulh" setiyle örtüşmüyor (kapsam dışı not). | |

Değişmeyen: 0 kayıt.

### koruyucu.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| korunma-muavvizeteyn-felak-nas | Muavvizeteyn (Felak ve Nâs Sureleri) | Muavvizeteyn | Al-Mu'awwidhatayn (Surahs Al-Falaq and An-Nas) | Al-Mu'awwidhatayn | 1, 7, 8 | yüksek | felak suresi, nas suresi | Buhârî, Ehâdîsü'l-Enbiyâ 10; Nesâî, İstiâze 37. Yerleşik ad korundu, parantezli açıklama tag'e taşındı. 1. dalga `sabah-ihlas-muavvizeteyn` üç sureyi taşıdığı için "İhlas ve Muavvizeteyn" adını korumuştu; bu kayıt iki sure. | |
| BISMILLAH_LA_YEDURRU | Bismillâhillezî Duası | Bismillahillezi la yedurru | Supplication of 'In the Name of Allah, With Whose Name Nothing Can Harm' | Bismillahilladhi la yadurru | 3, 6, 7, 8 | yüksek | — | **1. dalga: `sabah-bismillah-koruma` ile aynı metin, aynı başlık.** Ebû Dâvûd, Edeb 110; Tirmizî, Deavât 13. | |
| korunma-kelimatillahit-tamme | Kelimâtillâhit-tâmme Duası | Uizü bikelimatillahit tamme | Supplication of Allah's Perfect Words | U'idhu bikalimatillahit tammah | 3, 8 | orta | hasan ve hüseyin rukyesi | Buhârî, Ehâdîsü'l-Enbiyâ 10 (Hz. Hasan ve Hüseyin'e okunan rukye). Başlık nameArabic'e göre verildi ("أُعِيذُ" = uîzü); transliterasyon "Eûzü" diyor (kapsam dışı not). Bu sayede 1. dalga "Euzü bikelimatillahit tammati" başlığıyla çakışma da ortadan kalkıyor — metinler zaten farklı rivayet. | |
| HASBUNALLAH_VEKIL | Hasbünallâhu ve Ni'mel Vekîl | Hasbünallahu ve nimel vekil | Hasbunallahu wa Ni'mal Wakil (Allah is Sufficient for Us, and He is the Best Disposer of Affairs) | Hasbunallahu wa ni'mal wakil | 3, 7, 8 | yüksek | hasbünallah, al-i imran 173 | **Karar 14:** Âl-i İmrân 3/173 → "Hasbünallahu ve nimel vekil". Buhârî, Tefsir 13. Parantezli çeviri ve kesmeler kalktı. | |
| korunma-kalem-sonu-51-52 | Kalem Suresi Sonu (Nazar Ayeti) | Kalem Suresi 51-52. Ayetler | End of Surah Al-Qalam (The Verse of the Evil Eye) | Surah Al-Qalam, Verses 51-52 | 4, 7 | yüksek | nazar ayeti, ve in yekad | Kalem 68/51-52. Dua değil → kural 4'ün ikinci biçimi; yaygın anılış tag'e alındı (kalibrasyon 10 ile aynı tercih). | |
| HZYUSUF | Hz. Yunus'un Duası | Hz. Yunus'un Duası | The Supplication of Prophet Jonah (Dhun-Nun's Supplication) | The Supplication of Prophet Yunus | 1, 7 | yüksek | zünnun duası, enbiya 87 | **2. dalga: `istigfar-yunus-duasi` ile aynı metin, aynı başlık.** Metin Enbiyâ 21/87 ("Lâ ilâhe illâ ente sübhâneke innî küntü mine'z-zâlimîn") — Hz. **Yûnus**'un duası; başlık doğru, yanlış olan `HZYUSUF` key'i (kapsam dışı not, key'e dokunulmuyor). TR başlık değişmiyor, EN'deki parantezli ikinci ad tag'e taşındı. | |
| korunma-suyuti-vesvese-duasi | Süyuti'nin Vesvese ve Korunma Duası | Ya Allahür rakibül hafizür rahim | Al-Suyuti's Supplication against Whispers and for Protection | Ya Allahur raqibul hafizur rahim | 3, 8 | düşük | süyuti vesvese duası | Süyûtî'ye nispet literatürde doğrulanamadı (kaynak alanı hem Süyûtî hem Gazâlî diyor) → karar kutusu gereği başlığa alınmadı, tag'e önerildi. Terkip tireleri kural 8 ile kalktı. | |
| korunma-dua-i-sifa | Dua-i Şifa | Allahümme inni euzü bike min külli durrin | Supplication for Healing (Du'a al-Shifa) | Allahumma inni a'udhu bika min kulli durrin | 3, 7 | düşük | dua-i şifa | (41 kr) Kaynak yalnız "geleneksel şifa duaları ve evrad mecmuaları"; "Dua-i Şifa" adı doğrulanamadı → kural 3, eski ad tag'e. 1-2. dalgadaki "Allahümme inni euzü bike min…" başlıklarından "külli durrin" ile ayrışıyor. | |
| korunma-iman-ikrari-zikri | İman İkrarı Zikri | Amentü billahi ve rusülih | Declaration of Faith Dhikr | Amantu billahi wa rusulih | 3, 6, 8 | yüksek | — | **2. dalga: `iman-suphe-amentu-billahi` ile aynı metin, aynı başlık.** Buhârî, Bed'ü'l-Halk 11; Müslim, Îmân 212. | |
| korunma-estagfirullah-min-kulli-ma-kerihallah | Estağfirullah min külli mâ kerihallah | Estağfirullah min külli ma kerihallah | Istighfar for All That Displeases Allah | Astaghfirullaha min kulli ma karihallah | 3, 8 | orta | — | İmâm-ı Rabbânî, Mektûbât. Yalnız şapka kalktı. 1-2. dalgadaki "Estağfirullahellezi…" ve "Estağfirullahe ve etubü ileyh" başlıklarından üçüncü kelimede ayrışıyor. | |
| afet-bismillahi-ma-saallah-la-kuvvete | Sühreverdi'nin Tehlikeyi Önleme Duası | Bismillahi maşaallah la kuvvete illa billah | Bismillahi Ma Sha'Allah Litany | Bismillahi ma sha Allah la quwwata illa billah | 3, 6, 8 | orta | sühreverdi virdi | (43 kr) **Başlık/EN uyumsuzluğu çözüldü:** TR "Sühreverdi'nin Tehlikeyi Önleme Duası", EN "Bismillahi Ma Sha'Allah Litany" idi; ikisi aynı metni anlatıyor. Sühreverdî nispeti (Avârifü'l-Maârif) doğrulanabilir bir *evrad* nispeti ama duanın yerleşik adı değil → tag'e alındı. `sifa-bismillahi-masaallah` ve `afet-bismillahi-ma-saallah-tertibi` ile aynı başlık (kural 6). | |
| korunma-bakara-ilk-ve-son-ayetler | Bakara Suresi İlk ve Son Ayetler Tertibi | Bakara Suresi İlk ve Son Ayetler | Litany of the Opening and Closing Verses of Surah Al-Baqarah | The Opening and Closing Verses of Surah Al-Baqarah | 4, 7 | orta | amenerrasulü, bakara 285-286 | Buhârî, Fedâilü'l-Kur'ân 10; Müslim, Müsâfirîn 255. Bileşik kayıt (1-5 + 285-286); tek ayet numarası verilemediği için kural 4'ün ikinci biçimi tarif olarak uygulandı, "Tertibi" nitelemesi kalktı — kalibrasyon 28. | |
| korunma-ve-ufevvidu-emri-ilallah | Ve Üfevvidü Emrî İlallâh | Ve üfevvidü emri ilallah | Wa Ufawwidu Amri Ilallah (I Entrust My Affair to Allah) | Wa ufawwidu amri ilallah | 4, 7, 8 | orta | mümin 44, gafir 44 | **Opus review:** ajan "Mümin Suresi 44. Ayet" önermişti; bu söz halk arasında tefviz duası olarak doğrudan başlangıcıyla ezberlenir ve okunur (Tevbe 129 "Hasbiyallahu…" ile aynı muamele) → kural 4'ün birinci biçimi. Ters tercih için onay sütununa yazın. Ajan notu: Mü'min (Gâfir) 40/44. Dua değil, mümin kişinin tefvîz sözü → kural 4'ün ikinci biçimi (2. dalga `iman-suphe-hadid-3` ve `kaygi-ud-uni-estecib-lekum` ile aynı tercih). Sure adı 2. dalgayla aynı ("Mümin" TR, "Ghafir" EN). | |
| korunma-nisa-100-ayet-tertibi | Nisa Suresi 100. Ayet Tertibi | Nisa Suresi 100. Ayet | Litany of Surah An-Nisa, Verse 100 | Surah An-Nisa, Verse 100 | 4, 7 | yüksek | — | Nisâ 4/100. Dua değil → kural 4'ün ikinci biçimi; "Tertibi" nitelemesi kalktı. | |

Değişmeyen: 0 kayıt.

### dogalAfetlerdenKorunma.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| afet-allahumme-hfazni-min-beyni-yedeyye | Altı Yönden Korunma Duası | Allahümmahfazni min beyni yedeyye | Supplication for Protection from Six Directions | Allahummahfazni min bayni yadayya | 3, 7 | yüksek | — | Ebû Dâvûd, Edeb 110; Nesâî, İstiâze 60; İbn Mâce, Dua 14. Sayı nitelemesi silindi; eski başlık editoryal. | |
| afet-euzu-bi-kelimatillahit-tammati-min-serri-ma-halak | Kelimatullah ile Sığınma Duası | Euzü bikelimatillahit tammati | Supplication of Refuge in the Perfect Words of Allah | A'udhu bikalimatillahit tammat | 3, 6, 8 | yüksek | kelimatüt tammat | **1. dalga: `aksam-kelimâtillah` ile aynı metin, aynı başlık.** Müslim, Zikir 54. Karar 17: bu kayıt tematik afet setine konmuş kopya, gerçek bir durumun duası değil → duanın yalın adını alıyor (yolculuk konaklama kaydı ise durum adını koruyor). | |
| afet-ebud-derda-duasi-tam | Ebu'd-Derdâ Afet Korunma Duası | Allahümme ente Rabbi la ilahe illa ente | Abu al-Darda's Supplication for Protection from Calamity | Allahumma anta Rabbi la ilaha illa anta | 3 | orta | ebud derda duası | (39 kr) Kenzü'l-Ummâl nr. 3432; İbnü's-Sünnî. Ebü'd-Derdâ ravi, duanın yerleşik adı değil → tag'e alındı. **Dikkat:** başlangıcı Seyyidü'l-İstiğfar ile birebir aynı ("Allâhümme ente Rabbî lâ ilâhe illâ ente"); o kayıt kural 1 ile özel adını taşıdığı için başlık çakışması yok, ama listede yan yana karışabilir — kalibrasyon 29. | |
| afet-bismillahi-ma-saallah-tertibi | Bismillâhi Mâ Şâallah Tertibi | Bismillahi maşaallah la kuvvete illa billah | Bismillahi Ma Sha'Allah Litany | Bismillahi ma sha Allah la quwwata illa billah | 3, 6, 7, 8 | orta | sühreverdi virdi | (43 kr) `sifa-bismillahi-masaallah` ve `koruyucu/afet-bismillahi-ma-saallah-la-kuvvete` ile aynı metin, aynı başlık (kural 6). "Tertibi" nitelemesi kalktı. | |
| afet-allahumme-inni-eseluke-bi-enne-lekel-hamd | İsm-i A’zam Tertibi Duası | İsmi Azam Duası | Supplication of the Litany of the Greatest Name of Allah | The Supplication of the Greatest Name | 1, 6, 7, 8 | yüksek | ismi azam | Tirmizî, Deavât 82; Ebû Dâvûd, Salât 368. `hayirliEv/ISMI_AZAM_DUASI` ile aynı metin, aynı başlık (kural 6). Eski başlıktaki tipografik kesme (’) ve "Tertibi" nitelemesi kalktı. | |
| afet-allahumme-la-tektulna-bi-gadabik | Gazaptan Sığınma Duası | Allahümme la tektülna bigadabike | Supplication for Refuge from Allah's Wrath | Allahumma la taqtulna bi-ghadabika | 3 | yüksek | — | Tirmizî, Deavât 48; Ahmed b. Hanbel II/116. Eski başlık meal; kural 3'e düşüldü. | |
| afet-allahumme-inni-eseluke-hayraha | Rüzgar ve Fırtına Duası | Rüzgar Eserken Okunan Dua | Supplication for Wind and Storm | Dua When the Wind Blows | 2, 6 | yüksek | — | Müslim, İstiskâ 15; Hısnu'l-Muslim bölüm adı "Rüzgâr Eserken Yapılan Dua" (s. 86). Gerçek bir durumun duası → karar 17 istisnası; durumda tek kayıt olduğu için yalın durum adı. | |
| afet-bismillahi-ala-nefsi-ve-ehli-ve-mali | Can, Aile ve Malı Allaha Havale Duası | Bismillahi ala nefsi ve ehli ve mali | Supplication of Entrusting Self, Family, and Wealth to Allah | Bismillahi ala nafsi wa ahli wa mali | 3 | orta | — | Nesâî, Amelü'l-Yevm; İbnü's-Sünnî. 2. dalga `sikinti-bismillahi-ala-nefsi` ("Bismillahi ala nefsi ve mali ve dini") farklı rivayet; beşinci kelimede ayrışıyor — kalibrasyon 30. | |
| afet-rabbi-kullu-seyin-hadimuke | Kozmik Korunma ve Nusret Duası | Rabbi küllü şeyin hadimüke | Supplication for Cosmic Protection and Divine Aid | Rabbi kullu shay'in hadimuka | 3 | orta | — | Taberânî, el-Mu'cemü'l-Kebîr; Ebû Dâvûd (kaynak alanı hadis numarası vermiyor). Eski başlık editoryal ("kozmik" İslami literatürde karşılığı olmayan bir niteleme). | |

Değişmeyen: 2 kayıt (`afet-subhanallahi-yusebbihur-rad` — "Gök Gürültüsü Zikri" gerçek bir durumun adı (Muvatta, Sefer 40; karar 17 istisnası), yasaklı işaret taşımıyor; `afet-kureys-suresi` — "Kureyş Suresi" kural 1'e uygun yalın sure adı, EN'de de aksan yok).

### hasettenKorunma.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| haset-ya-mumin | Yâ Mü'min | Ya Mümin | Ya Mu'min | Ya Mu'min | 5, 6, 8 | yüksek | — | **2. dalga: `sikinti-ya-mumin` ile aynı başlık.** Şapka ve kesme kalktı; "mümin" Türkçede zaten kesmesiz yazılır. EN değişmiyor. | |
| RABBENA_GFIR_GILLA | Kalpteki Kini Gideren Dua | Rabbenağfir lena ve li ihvanina | Supplication for Removing Rancor from the Heart | Rabbanaghfir lana wa li ikhwanina | 4, 6 | yüksek | haşr 10 | Haşr 59/10. `barismaVeSulh/barisma-vela-tecal-fi-kulubina-gillen` ile aynı metin, aynı başlık (kural 6). | |
| haset-hasbiyallahu | Hasbiyallâh Zikri | Hasbiyallahu la ilahe illa hu | Hasbiyallah Dhikr (Sufficiency of Allah) | Hasbiyallahu la ilaha illa huwa | 3, 6, 7, 8 | yüksek | hasbiyallah, tevbe 129 | **Karar 14 / 1. dalga `aksam-hasbiyallah` ile aynı başlık.** İbnü's-Sünnî, Amelü'l-Yevm. Parantezli çeviri silindi. | |
| haset-ya-hafiz | Yâ Hâfız | Ya Hafız | Ya Hafiz | Ya Hafiz | 5, 8 | yüksek | — | Tema setindeki esma zikri; yalnız şapkalar kalktı. EN değişmiyor. | |
| LA_MANIA_LIMA_ATAYTE | Namaz Sonrası Teslimiyet Duası | Allahümme la mania lima atayte | Post-Prayer Supplication of Submission | Allahumma la mani'a lima a'tayta | 3, 7, 8 | yüksek | la mania lima atayte | Buhârî 6330; Müslim, Mesâcid 593. 2. dalga `namaz-sonrasi-la-ilahe-mania` kaydı bu metni tehlilin ardından taşıyor ve başlığı tehlilden alıyordu; bu kayıt yalnız "lâ mânia" bölümünden ibaret, o yüzden kendi başlangıç sözlerini alıyor. Vakit nitelemesi kural 7 ile silindi. | |

Değişmeyen: 1 kayıt (`FELAK_SURESI` — "Felak Suresi" kural 1'e uygun yalın sure adı; şapka, parantez, sayı yok, EN "Surah Al-Falaq" da aksansız).

### kibirdenKorunma.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| SEYTAN_HEMZI_NEFHI | Şeytanın Hemz, Nefh ve Nefsinden Sığınma | Allahümme inni euzü bike mineş şeytanir racim | Refuge from Satan's Prompting, Arrogance, and Idle Inspiration | Allahumma inni a'udhu bika minash shaytanir rajim | 3 | yüksek | hemz nefh nefs | (45 kr) Ahmed b. Hanbel, Müsned; Abdürrezzâk, Musannef; namaz iftitahında okunan istiâze. 1-2. dalgadaki "Allahümme inni euzü bike min…" başlıklarından "mineş" ile ayrışıyor. | |
| NEFHAT_KIBR | Kibrin Üflemesinden Sığınma | Allahümme inni euzü bike min nefhatil kibriya | Refuge from the Blowing of Arrogance | Allahumma inni a'udhu bika min nafhatil kibriya' | 3 | düşük | — | (45 kr) Kaynak yalnız "Tasavvuf Literatürü"; hadis kaynağı ve yerleşik ad yok → kural 3. Teşhis doğrulanamadı, güven düşük. | |
| kibir-ya-mumin | Yâ Mü'min | Ya Mümin | Ya Mu'min | Ya Mu'min | 5, 6, 8 | yüksek | — | **2. dalga: `sikinti-ya-mumin` ile aynı başlık** (`hasettenKorunma/haset-ya-mumin` de aynı). EN değişmiyor. | |
| kibir-ya-kuddus | Yâ Kuddûs | Ya Kuddus | Ya Quddus | Ya Quddus | 5, 8 | yüksek | — | Tema setindeki esma zikri; yalnız şapkalar kalktı. EN değişmiyor. | |
| HALIMUL_KERIM_TENZIH | Halîm ve Kerîm Tevhid Zikri | La ilahe illallahül halimül kerim | Tawhid Dhikr of the Forbearing and Generous | La ilaha illallahul halimul karim | 3, 8 | orta | — | Kaynak "geleneksel tesbih ve vird derlemeleri". 2. dalgadaki "La ilahe illallahül azimül halim" (Buhârî 6346 kerb duası) ve "La ilahe illallahül kerimül azim" başlıklarından dördüncü kelimede ayrışıyor; üç metin birbirine çok yakın (kapsam dışı not). | |
| VALLAHU_GALIBUN | Vallâhu Gâlibun Alâ Emrihî | Yusuf Suresi 21. Ayet | Wallahu Ghalibun 'ala Amrihi | Surah Yusuf, Verse 21 | 4, 8 | yüksek | vallahu galibün ala emrihi | Yûsuf 12/21. Dua değil, ilahî haber → kural 4'ün ikinci biçimi (2. dalga `iman-suphe-hadid-3` ile aynı tercih); eski başlık tag'e alındı. | |

Değişmeyen: 0 kayıt.

### zinadanKorunma.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| zina-korunma-kalp-temizligi | Günah Affı, Kalp Temizliği ve İffet Muhafazası Duası | Allahümmeğfir zenbi ve tahhir kalbi | Supplication for Forgiveness, Purification of the Heart, and Guarding Chastity | Allahummaghfir dhanbi wa tahhir qalbi | 3 | orta | — | Ahmed b. Hanbel, Müsned V/256. Eski başlık meal listesi. `hayirliEv/MESKEN_GENISLIGI` ("Allahümmeğfir li zenbi…") ile yalnız "li" farkıyla ayrışıyor — kalibrasyon 31. | |
| zina-korunma-huda-tukâ-afaf-gına | Hidayet, Takva, İffet ve Gönül Zenginliği Duası | Allahümme inni eselükel hüda vet tüka | Supplication for Guidance, Taqwa, Chastity, and Contentment of Heart | Allahumma inni as'alukal huda wat tuqa | 3, 6, 8 | yüksek | — | **1. dalga: `ozlu-huda-takva-iffet-gina` ile aynı metin, aynı başlık.** Müslim 2721; Tirmizî 3489. Karar 17: bu kayıt tematik iffet setine konmuş kopya → duanın yalın adını alıyor. | |
| zina-korunma-organlarin-serrinden-sıgınma | Organların Şerrinden Sığınma Duası | Allahümme inni euzü bike min şerri semi | Supplication for Refuge from the Evil of the Limbs | Allahumma inni a'udhu bika min sharri sam'i | 3, 8 | yüksek | — | (39 kr) Tirmizî, Deavât 74 (3492); Ebû Dâvûd 1551. 1. dalga `ozlu-yaptigim-yapmadim-serian` ("…min şerri ma amiltü") başlığından yedinci kelimede ayrışıyor. | |
| zina-korunma-hayyu-kayyum-istigase | Hayy ve Kayyûm ile İstiğâse Duası | Ya Hayyu Ya Kayyum | Supplication of Seeking Aid through the Names al-Hayy and al-Qayyum | Ya Hayyu Ya Qayyum | 5, 6, 8 | yüksek | istigase | **1. dalga `sabah-ya-hayyu-kayyum`, 2. dalga `sikinti-ya-hayyu-ya-kayyum` ile aynı başlık** (`sinavVeYazili/sinav-ya-hayyu-ya-kayyum` de aynı). Aynı adı taşıyan kayıt sayısı dörde çıkıyor — kalibrasyon 21 bu dalgada da geçerli. | |

Değişmeyen: 0 kayıt.

### haksizlikVeMulkKoruma.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| mulk-masaallah-la-kuvvete-illa-billah | Mâşâallah — Mülkü Felaketten Koruma | Maşaallah la kuvvete illa billah | Masha'Allah — Protecting One's Blessings from Calamity | Ma sha Allah la quwwata illa billah | 3, 7, 8 | yüksek | kehf 39 | Kehf 18/39; El-Ezkâr nr. 380 (Enes b. Mâlik). Em dash sonrası konu adı silindi. Besmeleyle başlayan Sühreverdî tertibinden (üç kayıt) ilk kelimede ayrışıyor. | |
| mulk-bismillahi-ala-nefsi-ve-mali | Can, Mal ve Din Koruması Duası | Bismillahi ala nefsi ve mali ve dini | Supplication for the Protection of Life, Wealth and Religion | Bismillahi ala nafsi wa mali wa dini | 3, 6 | yüksek | — | **2. dalga: `sikinti-bismillahi-ala-nefsi` ile aynı metin, aynı başlık.** El-Ezkâr nr. 379 (Abdullah b. Ömer). | |
| zulum-allahümme-kfinihim | Bir Topluluktan veya Gruptan Korkan için Dua | Allahümmekfinihim bima şi'te | Supplication for One Who Fears a Group or Community | Allahummakfinihim bima shi'ta | 3, 8 | orta | — | Müslim 2300; Hısnu'l-Muslim nr. 132. Eski TR başlık 2. dalga `korku-topluluktan-nuhurihim` ("Bir Topluluktan Korkunca Okunan Dua") ile birebir aynı durumu adlandırıyordu; yalın durum adı orada kaldığı için bu kayıt kural 3'e düştü. Kural 8 istisnası: "şi'te" kesmesi korundu, kalkınca yanlış okunuyor. | |
| zulum-allahümme-rabbe-semavat-gulun-zalim | Güç Sahibinin Zulmünden Koruma Duası | Allahümme Rabbes semavatis seb'i | Supplication for Protection from the Oppression of the Powerful | Allahumma Rabbas samawatis sab'i | 3, 8 | orta | — | Buhârî, Edebü'l-Müfred nr. 707; Hısnu'l-Muslim nr. 129. `yolculukDualari/yolculuk-yeni-beldeyi-gorünce` aynı sözlerle başlıyor; o kayıt gerçek bir durumun duası olduğu için durum adını aldı, bu kayıt başlangıç sözlerini (kalibrasyon 2 tie-break'i). Kural 8 istisnası: "seb'i" kesmesi korundu. | |
| haksizlik-fedea-rabbehu-magluban | Hz. Nuh'un (a.s.) Nusret Duası | Hz. Nuh'un Duası | Prophet Noah's (Peace be Upon Him) Supplication for Divine Support | The Supplication of Prophet Nuh | 1, 7 | orta | kamer 10, enni maglubün fentasir | Kamer 54/10. Peygamber duası → kural 1. Veri setindeki ikinci Hz. Nûh kaydı (`rizik-nuh-istigfar-rizk`) dua değil kavmine hitap olduğu için ayet adını aldı; `MUMINUN_29` de Hz. Nûh'un duası ama dua ayeti biçiminde adlandırıldı — kalibrasyon 32. Okunan metin "Fedeâ rabbehû" anlatımını da içeriyor (kapsam dışı not). | |

Değişmeyen: 0 kayıt.

### cenazeVeTaziye.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| cenaze-namaz-duasi-genel | Cenaze Namazı Genel Duası | Cenaze Namazı Duası: Allahümmeğfir li hayyina | General Funeral Prayer Supplication | Funeral Prayer Supplication: Allahummaghfir li hayyina | 2, 3 | yüksek | — | (45 kr) Ebû Dâvûd 3201; Tirmizî 1024; İbn Mâce 1498. Aynı durumda üç kayıt var; yalın "Cenaze Namazı Duası" en meşhuruna (Müslim 963) kaldı, diğer ikisi karar kutusundaki "Durum Adı: başlangıç" biçimini aldı — durum adı 19 karakter, özel isim kadar kısa. | |
| cenaze-musibette-inna-lillah | Musibet Anında Okunacak Dua | Musibet Anında Okunan Dua | Supplication for Times of Calamity | Dua in Times of Calamity | 2, 6 | yüksek | istirca, inna lillahi ve inna ileyhi raciun | Müslim 918; Hısnu'l-Muslim bölüm adı "Başına Bela Gelen Kimsenin Duası" (s. 80). Metin 2. dalga `sikinti-inna-lillahi-ve-inna-ileyhi-raciun` kaydının uzun rivayeti ("Allâhümme'curnî fî musîbetî…" fazlası); karar 17 gereği gerçek durumun kaydı durum adını koruyor. Yalnız "Okunacak" → "Okunan" biçim birliği. | |
| cenaze-namaz-duasi-rabbi | Cenaze Namazı Duası (Kadın Cenaze İçin) | Cenaze Namazı Duası: Allahümme ente Rabbüha | Funeral Prayer Supplication (For a Female Deceased) | Funeral Prayer Supplication: Allahumma anta Rabbuha | 2, 3, 7 | yüksek | — | (43 kr) Ebû Dâvûd 3200; El-Ezkâr nr. 474. Parantezli niteleme kural 7 ile silindi; metnin kadın zamirleri başlangıç sözlerinde zaten görünüyor. | |
| cenaze-gecerken-zikir | Cenaze Görünce Okunacak Zikir | Cenaze Görünce Okunan Zikir | Dhikr upon Seeing a Funeral | Dhikr When Seeing a Funeral | 2 | yüksek | sübhanel hayyillezi la yemut | El-Ezkâr, Cenâiz Bölümü 26. Yalnız 1. dalgadaki "Okunan" biçim birliğine getirildi. | |

Değişmeyen: 4 kayıt (`cenaze-namaz-duasi-uzun` — "Cenaze Namazı Duası" durumun en meşhur kaydı ve kural 2'ye uygun yalın durum adı; `cenaze-defin-duasi` — "Defin Duası" kısa durum adı; `cenaze-kabir-ziyaret-selami` — "Kabir Ziyareti Selamı" durumu ve içeriği doğru veriyor; `cenaze-taziye-duasi` — "Taziye Duası" Hısnu'l-Muslim bölüm adıyla örtüşüyor. Dördünde de şapka, sayı, parantez, em dash yok ve EN başlıklar aksansız).

### yolculukDualari.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| yolculuk-seferin-duasi | Yola Çıkış Duası (Sefer Duası) | Sefer Duası | Supplication for Departing on a Journey (Travel Du'a) | Dua for Travel | 1, 2, 7 | orta | yolculuk duası, yola çıkış duası, sübhanellezi sehhara lena haza | **Opus review:** ajan "Yolculuğa Çıkarken Okunan Dua" önermişti; onaylı planda kural 2 örneği "Sefer Duası" ve eski başlık da bu adı taşıyordu → kısa yerleşik ad başlık, tarif tag. Ters tercih için onay sütununa yazın. Ajan notu: Müslim, Hac 425 (1342); Hısnu'l-Muslim bölüm adı "Yolculuğa Çıkarken Yapılan Dua" (s. 98). Durumdaki en meşhur kayıt → yalın durum adı. Kayıt binek duasını (Zuhruf 13) da içeriyor, başlık bunu yansıtmıyor (kapsam dışı not). | |
| yolculuk-estevdiullah-dine | Yolcuya Vedâ Duası | Yolcuya Okunan Veda Duası | Farewell Supplication for the Traveller | Dua for the One Setting Out | 2, 8 | yüksek | estevdiullahe dineke | Ebû Dâvûd 2600; Tirmizî 3442; Hısnu'l-Muslim bölüm adı "Geride Kalanların Yolcu İçin Duası" (s. 100). Yalnız şapka ve biçim birliği. | |
| yolculuk-estevdiukum | Geride Kalanları Uğurlama Duası | Yolcunun Geride Kalanlara Duası | Supplication for Those Left Behind | The Traveller's Dua for Those Left Behind | 2 | yüksek | estevdiukümullah | Ahmed b. Hanbel 2/403; İbn Sünnî nr. 505; Hısnu'l-Muslim bölüm adı "Yolcunun Geride Kalanlar İçin Duası" (s. 100). Eski başlık yönü ters veriyordu ("uğurlama" geride kalanın işi); düzeltildi. | |
| yolculuk-konaklamada | Konaklamada Korunma Duası | Konaklarken Okunan Dua | Supplication for Protection upon Stopping | Dua When Making Camp | 2, 6 | yüksek | euzü bikelimatillahit tammati | Müslim 2708; Hısnu'l-Muslim bölüm adı "Konaklanacak Yerde Yapılan Dua" (s. 101). Metin 1. dalga `aksam-kelimâtillah` ile aynı; **karar 17 istisnası:** bu kayıt literatürde bölüm adı olan gerçek bir durumun duası olduğu için durum adını koruyor, tematik kopya olan `dogalAfetlerdenKorunma/afet-euzu-bi-kelimatillahit-tammati…` duanın yalın adını aldı. | |
| yolculuk-tepede-zikir | Yüksek Yerde Tekbir Zikri | Yolculuktan Dönünce Okunan Dua | Dhikr of Takbir upon Ascending High Ground | Dua When Returning from a Journey | 2, 7 | orta | ayibune taibune, yüksek yere çıkınca | Buhârî 2995; Müslim 1344; Hısnu'l-Muslim bölüm adı "Yolculuktan Dönünce Yapılan Dua" (s. 102). Durumdaki iki kayıttan tam olanı → yalın durum adı. Başlangıcı 2. dalga `namaz-sonrasi-la-ilahe-mania` başlığıyla ("La ilahe illallahu vahdehu la şerike leh") birebir çakıştığı için kural 3 kullanılamazdı. Eski başlık tekbirden söz ediyor ama metinde tekbir yok (kapsam dışı not) — kalibrasyon 33. | |
| yolculuk-donuste-zikir | Yolculuktan Dönüş Zikri | Ayibune taibune abidune | Dhikr upon Returning from a Journey | Ayibuna ta'ibuna abiduna | 3 | orta | yolculuktan dönüş zikri | Müslim 1345; Buhârî 2995. Aynı duanın kısa rivayeti; yalın durum adı üstteki kayda gittiği için kural 3 — kalibrasyon 33. | |
| yolculuk-kalkisindan-dua | Yola Çıkmadan Önce Oturulan Yerden Kalkarken Dua | Allahümme ileyke teveccehtü | Supplication upon Rising to Depart for a Journey | Allahumma ilayka tawajjahtu | 3 | orta | — | El-Ezkâr nr. 593; Ebû Ya'lâ, Müsned; Taberânî, ed-Duâ. Hısnu'l-Muslim'de karşılığı olan bir bölüm adı yok, eski başlık 48 karakterlik bir tarif → kural 3. | |
| yolculuk-gemiye-binerken | Gemiye Binerken Okunacak Ayet | Bismillahi mecraha ve mürsaha | Quranic Verses to Recite upon Boarding a Vessel | Bismillahi majraha wa mursaha | 4 | orta | hud 41, gemiye binerken | Hûd 11/41; El-Ezkâr nr. 607. Dua ayeti → kural 4'ün birinci biçimi. Kayıt ayrıca Zümer 39/67'den bir bölüm taşıyor, başlık bunu yansıtmıyor (kapsam dışı not). Durum adı yerine başlangıç seçildi: metin bir ayet, durum ise suitableFor alanında zaten var. | |
| yolculuk-yeni-beldeyi-gorünce | Yeni Beldeyi Görünce Kapsamlı Dua | Beldeyi Görünce Okunan Dua | Comprehensive Supplication upon Sighting a New Settlement | Dua upon Sighting a Town | 2, 7 | orta | — | El-Ezkâr nr. 617; Nesâî, Sünenü'l-Kübrâ 8/117; Hısnu'l-Muslim bölüm adı "Bir Köy veya Beldeye Girerken" (s. 99). "Kapsamlı" nitelemesi silindi. Başlangıcı `haksizlikVeMulkKoruma/zulum-allahümme-rabbe-semavat-gulun-zalim` ile çakışıyor, o yüzden durum adı tercih edildi. | |
| yolculuk-gece-acik-alanda | Gece Açık Alanda Konaklamak İçin Dua | Gece Açık Alanda Okunan Dua | Supplication for Camping Outdoors at Night | Dua When Camping Outdoors at Night | 2 | orta | — | El-Ezkâr nr. 622; Ebû Dâvûd 2603. Yalnız biçim birliği. `yolculuk-konaklamada` ile aynı temada ama farklı metin ve farklı alt durum (gece, açık arazi). | |
| yolculuk-eve-donuste-tevbe | Eve Döndüğünde Tövbe Zikri | Tevben tevben lirabbina evben | Dhikr of Repentance upon Returning Home | Tawban tawban li-rabbina awban | 3 | orta | — | El-Ezkâr nr. 626; Ahmed b. Hanbel, Müsned; İbn Hibbân. Dönüş durum adı `yolculuk-tepede-zikir` kaydına gittiği için kural 3. | |
| yolculuk-sehre-girerken | Yeni Bir Şehre Girerken Duası | Şehre Girerken Okunan Dua | Supplication upon Entering a New City | Dua When Entering a City | 2 | orta | — | İbn Sünnî nr. 473-474; Nesâî, Sünenü'l-Kübrâ 8/117. `yolculuk-yeni-beldeyi-gorünce` ile aynı temada; biri beldeyi *görünce*, biri şehre *girerken* — iki alt durum ayrı adlandırıldı — kalibrasyon 34. | |

Değişmeyen: 0 kayıt.

---

### Dalga 3 — Özet

| Dosya | Kayıt | Öneri | Değişmeyen |
|---|---|---|---|
| hastalıkVeŞifa.mjs | 19 | 19 | 0 |
| rizikMulkTertipleri.mjs | 16 | 16 | 0 |
| hayirliEvlatZikirleri.mjs | 15 | 14 | 1 |
| evlilikHuzur.mjs | 14 | 14 | 0 |
| sinavVeYazili.mjs | 13 | 12 | 1 |
| isHayatiKariyer.mjs | 6 | 6 | 0 |
| hayirliEv.mjs | 11 | 11 | 0 |
| ofkeKontrol.mjs | 6 | 6 | 0 |
| barismaVeSulh.mjs | 5 | 5 | 0 |
| koruyucu.mjs | 14 | 14 | 0 |
| dogalAfetlerdenKorunma.mjs | 11 | 9 | 2 |
| hasettenKorunma.mjs | 6 | 5 | 1 |
| kibirdenKorunma.mjs | 6 | 6 | 0 |
| zinadanKorunma.mjs | 4 | 4 | 0 |
| haksizlikVeMulkKoruma.mjs | 5 | 5 | 0 |
| cenazeVeTaziye.mjs | 8 | 4 | 4 |
| yolculukDualari.mjs | 12 | 12 | 0 |
| **Dalga 3 toplamı** | **171** | **162** | **9** |
| **Genel toplam (1+2+3)** | **336** | **323** | **13** |

Güven dağılımı (Dalga 3): yüksek 108, orta 50, düşük 4.

Not: `HZYUSUF` ve `ISMI_AZAM_DUASI` satırlarında TR başlık değişmiyor, yalnız EN düzeltildi;
1-2. dalgadaki tercihle tutarlı olarak "Değişmeyen" değil "Öneri" sayıldılar.

---

### Dalga 3 — Kalibrasyon soruları

Yalnız yeni ve gerçekten karar gerektiren maddeler. Karara bağlanmış konular (1-4, 6, 14,
15, 17) tekrar sorulmuyor; 5, 7-13, 16, 18-22 hâlâ satır bazlı açık.

23. **Hz. Zekeriyyâ'nın iki duası: yalın ad hangisine?**
    `evlat-rabbi-la-tezerni` (Enbiyâ 89, "Rabbi lâ tezernî ferden") → "Hz. Zekeriya'nın Duası";
    `evlat-rabbi-heb-li-min-ledunke` (Âl-i İmrân 38) → "Rabbi heb li min ledünke".
    Ters tercih isteniyorsa iki satır yer değiştirir.

24. **Aynı peygamberin ikinci duasında yalın ad hiç kullanılmasın mı?**
    Hz. Mûsâ'da yalın adı Tâhâ 25-28'e verdim, Kasas 24 başlangıca düştü. Hz. İbrâhim'de ise
    **ikisi de** başlangıca düştü (Sâffât 100 ve İbrâhîm 40-41) çünkü hangisinin "Hz. İbrahim'in
    Duası" olduğuna karar veremedim. Seçenekler: **(a)** olduğu gibi bırak, **(b)** Sâffât 100'e
    yalın adı ver (evlat temasında daha meşhur), **(c)** çakışan bütün peygamber duaları
    başlangıca düşsün (Hz. Mûsâ satırı da değişir).

25. **`evlat-es-samed` "Ya Samed" mi, "Es Samed" mi?**
    Setteki diğer beş esma kaydı "Yâ …" biçiminde, bu kaydın nameArabic'i yalın "الصمد".
    Kural 5'in biçimini uygulayıp "Ya Samed" yaptım, "es samed"i tag'e aldım. Metni
    değiştirmemek için "Es Samed" tercih edilirse satır değişir.

26. **`sinav-sekine-fetih` "Sekine Duası" mı olmalı?**
    Mecmualardaki "Sekîne duası" 19 harfli meşhur tertiptir; bu kayıt besmele + altı esma +
    Fâtiha 5 + Fetih 1'den oluşan dört bölümlü farklı bir terkip. Yalın "Sekine Duası" adını
    vermedim, tag'e aldım. Kayıt gerçekten Sekîne duası ise başlık değişmeli.

27. **İki rivayetli "Ya Ganiyyü ya Hamidü" duası: iki kayıt aynı adı alacak.**
    `hayirliEv/GAZALI_ZENGINLIK` ile `isHayatiKariyer/is-allahumme-ya-ganiyyu-ya-hamidu`
    ortak öneki 40 karakteri dolduruyor; ayırt edici kelime ("yâ Fe'âlü limâ yürîd" / sondaki
    "ekfinî" - "ağninî") 50 karakter içinde yakalanamıyor. Seçenekler: **(a)** ikisi de
    "Allahümme ya Ganiyyü ya Hamidü" (mevcut öneri), **(b)** ortak öneki düşürüp
    "Ya Ganiyyü ekfini bihalalike" / "Ya Ganiyyü ağnini bihalalike", **(c)** bu iki satırda
    50'yi aş. (Kalibrasyon 16'nın aynı sorusu, yeni satırlarda.)

28. **Bileşik ayet kayıtlarında kural 4 nasıl uygulanacak?**
    `korunma-bakara-ilk-ve-son-ayetler` iki ayrı ayet grubunu (1-5 ve 285-286) taşıyor;
    "Bakara Suresi İlk ve Son Ayetler" tarifini kullandım. Alternatifler:
    "Bakara Suresi 1-5 ve 285-286. Ayetler" (37 kr) ya da yaygın adla "Amenerrasulü"
    (kayıt yalnız son iki ayetten ibaret olmadığı için bunu seçmedim).

29. **Seyyidü'l-İstiğfar ile aynı sözlerle başlayan ikinci kayıt.**
    `afet-ebud-derda-duasi-tam` başlığı "Allahümme ente Rabbi la ilahe illa ente";
    Seyyidü'l-İstiğfar aynı sözlerle başlıyor ama kural 1 ile özel adını taşıdığı için teknik
    bir çakışma yok. Listede yan yana karışma riski kabul mü, yoksa ayırt edici kelimeye
    ("aleyke tevekkeltü", 57 kr) uzatılsın mı?

30. **"Bismillahi ala nefsi…" iki rivayeti.**
    2. dalga `sikinti-bismillahi-ala-nefsi` → "Bismillahi ala nefsi ve mali ve dini";
    bu dalga `afet-bismillahi-ala-nefsi-ve-ehli-ve-mali` → "Bismillahi ala nefsi ve ehli ve mali".
    Metinler farklı (mâlî+dînî / ehlî+mâlî), bu yüzden ayrı adlandırdım. Kullanıcı gözünde
    ayırt edici mi, yoksa ikisi tek ada mı indirilsin?

31. **"Allahümmeğfir" ailesi dört kayıtta çok yakın başlıyor.**
    1. dalga "Allahümmeğfir li verhamni"; 2. dalga "Allahümmeğfir li zenbi külleh";
    bu dalga "Allahümmeğfir li zenbi ve vessi li fi dari", "Allahümmeğfir zenbi ve tahhir kalbi"
    ve "Allahümmeğfir li verhamni ve elhıkni". Beşi de kural 3'e uygun ama listede ayırt etmek
    zor. Bir kısmına durum adı verilsin mi?

32. **Üç Hz. Nûh kaydı, üç farklı biçim.**
    `haksizlik-fedea-rabbehu-magluban` → "Hz. Nuh'un Duası" (kural 1);
    `MUMINUN_29` → "Rabbi enzilni münzelen mübareken" (kural 4, bu da Hz. Nûh'un duası);
    `rizik-nuh-istigfar-rizk` → "Nuh Suresi 10-12. Ayetler" (dua değil).
    İkinci kayıt da kural 1'e mi çekilmeli (o zaman iki Nûh duası çakışır ve ikisi de
    başlangıca düşer)?

33. **Yolculuktan dönüş duasının iki rivayeti.**
    `yolculuk-tepede-zikir` (tam metin) → "Yolculuktan Dönünce Okunan Dua";
    `yolculuk-donuste-zikir` (kısa metin) → "Ayibune taibune abidune".
    Alternatif: tam metin için "Yolculukta Yüksek Yere Çıkınca Okunan Dua" (40 kr) ve
    kısa metin için yalın durum adı. Eski başlıktaki "tekbir" metinde yok.

34. **"Belde" ve "şehir" iki ayrı durum mu?**
    `yolculuk-yeni-beldeyi-gorünce` → "Beldeyi Görünce Okunan Dua";
    `yolculuk-sehre-girerken` → "Şehre Girerken Okunan Dua".
    Hısnu'l-Muslim ikisini tek bölümde topluyor ("Bir Köy veya Beldeye Girerken").
    İki ayrı ad kabul mü, yoksa biri yalın durum adını alıp diğeri başlangıca mı düşmeli?

---

### Dalga 3 — Kapsam dışı gözlemler

Bunlar başlıkla ilgili değil, yalnız nottur. Bu dalgada hiçbiri düzeltilmedi.

- **Dalga kapsamı**: görev tanımı bu 17 dosya için "~167 kayıt" diyordu; gerçek sayı **171**
  (dosya bazlı sayılar görevdeki listeyle birebir aynı, yalnız toplam yanlış hesaplanmış).
- **Yanıltıcı key**: `koruyucu.mjs` içindeki `HZYUSUF` kaydının metni Enbiyâ 21/87, yani
  **Hz. Yûnus**'un duası; başlık doğru, key yanlış. (Plan gereği key'lere dokunulmuyor.)
- **Türkçe karakterli / biçim dışı key'ler** (rename betiği key ile eşleşeceği için riskli):
  `sifa-eınni-gamerâtil-mevt`, `zina-korunma-huda-tukâ-afaf-gına`,
  `zina-korunma-organlarin-serrinden-sıgınma`, `zulum-allahümme-kfinihim`,
  `zulum-allahümme-rabbe-semavat-gulun-zalim`, `yolculuk-yeni-beldeyi-gorünce`.
  Ayrıca BÜYÜK_HARF düzenindeki 16 key: `RIZIK_EBU_UMAME`, `MUMINUN_29`, `AL_I_IMRAN_26`,
  `HZ_MUAZ_MULK_DUASI`, `MESKEN_GENISLIGI`, `SAD_35`, `GAZALI_ZENGINLIK`, `YA_MUBDIU_HAVASS`,
  `TAHA_25_28`, `HZ_ALI_HELAL_RIZIK`, `EVE_GIRERKEN_DUA`, `ISMI_AZAM_DUASI`,
  `BISMILLAH_LA_YEDURRU`, `HASBUNALLAH_VEKIL`, `HZYUSUF`, `RABBENA_GFIR_GILLA`,
  `FELAK_SURESI`, `LA_MANIA_LIMA_ATAYTE`, `SEYTAN_HEMZI_NEFHI`, `NEFHAT_KIBR`,
  `HALIMUL_KERIM_TENZIH`, `VALLAHU_GALIBUN` — geri kalan veri kümesi kebab-case.
- **nameArabic ile transliteration uyuşmazlığı**:
  `korunma-kelimatillahit-tamme` (Arapça "uîzü", transliterasyon "eûzü");
  `sifa-bismillahil-kebir-irkin` (Arapça "eûzü", transliterasyon "neûzü");
  `evlat-allahummecalni-zurriyyeten-tayyibeten` (Arapça "Allâhümme'c'al lî",
  transliterasyon "Allâhümmec'alnî"); `hayirliEv/HZ_ALI_HELAL_RIZIK` (Arapça "ve ağninî",
  transliterasyon "ve emnî").
- **Aynı metni taşıyan kayıt çiftleri/üçlüleri** (kural 6 uygulandı):
  Sühreverdî tertibi üç kayıtta (`sifa-bismillahi-masaallah`,
  `afet-bismillahi-ma-saallah-tertibi`, `koruyucu/afet-bismillahi-ma-saallah-la-kuvvete`);
  helal rızık duası üç kayıtta; Hz. Muâz mülk duası iki kayıtta; Sâd 35 iki kayıtta;
  Tâhâ 25-28 iki kayıtta; Furkân 74 iki kayıtta; A'râf 89 iki kayıtta; Haşr 10 iki kayıtta;
  "ellif beyne kulûbinâ" iki kayıtta; İsm-i A'zam duası iki kayıtta; Tevbe 129 üç kayıtta;
  "Yâ Mü'min" iki kayıtta; "Yâ Hayyü yâ Kayyûm" iki kayıtta (önceki dalgalarla birlikte dört).
- **Eksik/bozuk metin**: `hayirliEv/EVE_GIRERKEN_DUA` nameArabic'i
  "اللَّهُمَّ ارْجِعْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا"; 1. dalga `ev-giris-bismillah` kaydındaki
  hadis metni "Bismillâhi velecnâ ve bismillâhi haracnâ ve alallâhi rabbinâ tevekkelnâ".
  Kayıttaki ilk cümle hadiste böyle geçmiyor, kontrol edilmeli.
- **Başlık içeriği tam karşılamıyor**: `yolculuk-seferin-duasi` (binek duası + sefer duası);
  `yolculuk-gemiye-binerken` (Hûd 41 + Zümer 67); `evlilik-tevbe-129` (ayetin
  "Fe in tevellev fe kul" girişi); `korunma-bakara-ilk-ve-son-ayetler` (iki ayrı ayet grubu);
  `haksizlik-fedea-rabbehu-magluban` (anlatım cümlesi + dua).
- **Set temasıyla örtüşmeyen kayıt**: `barisma-barekellahu-lekum` nikâh tebriği duası ama
  "Barışma, Kalp Birliği ve Sulh" setinde; `hasettenKorunma/LA_MANIA_LIMA_ATAYTE` namaz
  sonrası zikri ama haset setinde; `koruyucu.mjs` içinde `afet-` önekli üç kayıt var
  (`afet-bismillahi-ma-saallah-la-kuvvete` ayrıca doğal afet dosyasındaki kaydın kopyası).
- **Eski başlıkta TR/EN uyumsuzluğu**: `koruyucu/afet-bismillahi-ma-saallah-la-kuvvete`
  TR "Sühreverdi'nin Tehlikeyi Önleme Duası" ↔ EN "Bismillahi Ma Sha'Allah Litany";
  `zulum-allahümme-kfinihim` TR başlığı 2. dalga `korku-topluluktan-nuhurihim` başlığıyla
  aynı durumu adlandırıyordu.
- **Doğrulanamayan kişi nispetleri** (hiçbiri başlığa alınmadı):
  "İmam Gazalî" (`GAZALI_ZENGINLIK`), "İmam-ı Azam" (`is-allahumme-ya-ganiyyu-ya-hamidu`),
  "Süyuti" (`korunma-suyuti-vesvese-duasi`), "Sühreverdi" (üç Bismillâhi mâşâallah kaydı),
  "Hz. Ali" (`HZ_ALI_HELAL_RIZIK`, `sinav-sekine-fetih`), "Ebu'd-Derdâ"
  (`afet-ebud-derda-duasi-tam`), "Muâz b. Cebel" (iki mülk duası kaydı),
  "Ebû Ümâme" (`RIZIK_EBU_UMAME`).
- **Belirsiz kaynak alanları**: `NEFHAT_KIBR` → "Tasavvuf Literatürü";
  `evlat-allahummecalni-zurriyyeten-tayyibeten` → tek bir popüler dua kitabı;
  `YA_MUBDIU_HAVASS` → "Geleneksel Havas Kaynakları"; `korunma-dua-i-sifa` → "evrad
  mecmuaları"; `rizik-la-ilahe-illallahul-melikul-hakkul-mubin` → "geleneksel temcid
  zikirleri"; `HALIMUL_KERIM_TENZIH` → "geleneksel tesbih ve vird derlemeleri";
  `ISMI_AZAM_DUASI` → "Sahih Hadis Kaynaklarından Derlenen Virdler" (belirli bir kaynak değil).
- **EN/transliterasyonda tipografik kesme (’) ve aksanlı harfler**:
  `afet-allahumme-inni-eseluke-bi-enne-lekel-hamd` eski TR başlığında "İsm-i A’zam";
  `cenaze-gecerken-zikir` transliterasyonunda "Sübhâne’l-Hayyi’llezî";
  `sifa-isfi-abdek`, `sifa-eınni-gamerâtil-mevt` transliterasyonlarında "Allàhümme".
- **Referans PDF'leri repoda yok**: `docs/hisnul-muslim-index.md` ve
  `docs/el-ezkar-cilt-*-index.md` duruyor ama işaret ettikleri PDF dosyaları silinmiş;
  orta/düşük güvenli maddeler yalnız index bölüm adlarıyla doğrulanabildi.

## Dalga 4 — İbadet ve özel günler

Bu dalga hac/umre menasiki, Ramazan-oruç, kandiller ve hicri ay setlerindeki **96 kaydı**
kapsıyor (plan "~108" diyordu; dosya başına doğrulanmış sayılar aşağıda). Kurallar ve
"Karara bağlananlar" kutusu birebir uygulandı; 1. ve 2. dalgada adı belirlenmiş metinler
(Ayetel Kürsi, Seyyidül İstiğfar, Sübbuhün kuddusün, Nur Duası, Hz. Adem ve Havva'nın
Tövbe Duası, Sübhanallahi ve bihamdihi, Bismillahillezi la yedurru, Ya Halık, İftar Verene
Okunan Dua …) aynı başlığı aldı ve notta `N. dalga: <key> ile aynı` biçiminde işaretlendi.

### hacUmre.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| hac-yolculuk-binit-duasi | Yolculuğa (Binite) Binerken Duası | Binite Binerken Okunan Dua | Supplication When Mounting a Vehicle (for a Journey) | Dua When Mounting a Ride | 2, 7, 9 | yüksek | zuhruf 13-14, sübhanellezi sahhara lena | Zuhruf 43/13-14; Müslim, Hac 425. Hısnu'l-Muslim bölüm adı "Bineğe veya Taşıta Binerken" (s. 97). Parantezli niteleme kural 7 ile silindi. Aynı metin `yolculukDualari.mjs`'te yok, çakışma riski yok. | |
| hac-ihlas-duasi | İhlas Duası (Riyâdan Uzak Hac Duası) | Allahümme hacceten la riyae fiha | Supplication for Sincerity (Hajj Free from Ostentation) | Allahumma hajjatan la riya'a fiha | 3, 7, 8 | yüksek | — | İbn Mâce, Menâsik 4. Eski başlık İhlas Suresi ile karışıyordu; yerleşik özel ad yok → kural 3. Parantezli niteleme silindi. | |
| hac-tavaf-baslangic | Tavaf Başlangıcı (Hacerülesved Karşısında) | Tavafa Başlarken Okunan Dua | Beginning of Tawaf (Facing the Black Stone) | Dua When Beginning the Tawaf | 2, 7 | yüksek | istilam duası, hacerülesved | İbn Sünnî nr. 451; Beyhakî 5/79. Hac-umre rehberlerinde durum adı "tavafa başlarken (istilâm)"; parantezli niteleme kural 7 ile silindi. | |
| hac-tavaf-kabul-duasi | Makbul Hac Duası (Tavafın İlk Üç Şavtında) | Allahümmec'alhü haccen mebruren | Supplication for an Accepted Hajj (During the First Three Circuits of Tawaf) | Allahummaj'alhu hajjan mabruran | 3, 7, 8 | yüksek | mebrur hac duası | Şâfiî, el-Üm 2/174; Beyhakî 5/90. Durum adı (tavaf) hac-tavaf-baslangic'e gittiği için kural 3. Kural 8 istisnası: "c'a" kesmesi kalkınca yanlış okuma doğuyor, korundu. | |
| hac-safa-merve-ayeti | Sa'y Başlangıç Âyeti (Safâ-Merve) | Bakara Suresi 158. Ayet | Verse for the Beginning of Sa'i (Safa and Marwah) | Surah Al-Baqarah, Verse 158 | 4, 7, 8 | yüksek | innes safa vel mervete, say başlangıcı | Bakara 2/158. Dua ayeti değil, şeâir bildiren ayet → kural 4'ün ikinci biçimi (1. dalga sabah-rum-tesbihi ile aynı tercih). | |
| hac-safa-zikri | Safâ Tepesi Zikri | Safa Tepesinde Okunan Dua | Dhikr at the Hill of Safa | Dua at the Hill of Safa | 2, 8 | yüksek | tehlil, safa ve merve zikri | Müslim, Hac 147 (1218); Nesâî, Menâsik 173. Metin 1. dalga aksam-namaz-tehlil ile aynı tehlille başlıyor; durum adı ayrıştırıyor (kalibrasyon 9/17 yönü). Zikir Merve'de de okunur — ad yalnız Safâ'yı anıyor (onay sütununda değiştirilebilir). | |
| hac-say-hervele-duasi | Hervele (Yeşil Direkler Arası) Duası | Hervelede Okunan Dua | Supplication During Harwalah (Between the Green Markers) | Dua During the Harwalah | 2, 7 | orta | rabbiğfir verham ve ente hayrur rahimin | İbn Ebî Şeybe, Musannef; Diyanet Umre Rehberi. Başlangıç sözleri bu dalgadaki RABBIGFIR_VERHAM ile çakıştığı için kural 2 tercih edildi; "hervele" literatürdeki durum adı. | |
| hac-arefe-zikri | Arafât Zikri (Arefe Günü) | Arefe Günü Duası | Dhikr of Arafat (Day of Arafah) | Dua of the Day of Arafah | 1, 2, 7 | yüksek | tehlil, arafat zikri | Tirmizî, Deavât 123 (3585): "hayru'd-duâi duâu yevmi Arefe". Gün adı kural 7 istisnası (literatürde gün adıyla anılıyor). 1. dalga uyanis-tehlil-gece-af ile aynı tehlil metni, durum adıyla ayrıştı. | |
| hac-arefe-gecesi-tesbihi | Arefe Gecesi Tesbihi (Sığınma Duası) | Sübhanallahillezi fis semai arşuh | Tasbih of the Night of Arafah (Supplication of Refuge) | Subhanallahilladhi fis sama'i arshuh | 3, 7, 8 | orta | arefe gecesi tesbihi | İbn Ebî Şeybe, Musannef (İbn Mes'ûd). Yerleşik özel ad yok → kural 3; parantezli niteleme ve vakit silindi, eski ad gerçek kullanım olduğu için tag'e alındı. | |
| hac-zemzem-duasi | Zemzem İçerken Dua | Zemzem Duası | Supplication While Drinking Zamzam | The Dua of Zamzam | 1, 7 | orta | zemzem içerken okunan dua | İbn Mâce, Menâsik 78 (3062); El-Ezkâr nr. 563. Kural 1 kural 2'nin önünde: Türkiye'de yerleşik ad "zemzem duası"; durum adı tag'e alındı (1. dalga cami-giris-nur-duasi ile aynı tercih) — kalibrasyon 47. | |
| hac-medine-veda-duasi | Medine'den Ayrılırken Vedâ Duası | Medine'den Ayrılırken Okunan Dua | Farewell Supplication When Leaving Medina | Dua When Leaving Medina | 2, 8 | yüksek | veda duası | Hâkim 1/485; İbn Sünnî nr. 527; El-Ezkâr nr. 564. Şapka kalktı, kural 2'nin standart biçimine getirildi; Türkçe ek kesmesi kaldı. | |
| hac-mekke-hareminde | Mekke Haremîne Varınca Dua | Mekke Haremine Varınca Okunan Dua | Supplication Upon Arriving at the Sacred Precinct of Mecca | Dua Upon Arriving at the Sacred Precinct | 2, 8 | yüksek | — | İbn Sünnî nr. 508; Beyhakî, Şuab 3/451. Yalnız şapka ve kural 2 biçimi. | |

Değişmeyen: 1 kayıt (hac-telbiye — "Telbiye" kural 1'e uygun yerleşik özel ad; şapka, sayı, parantez, em dash yok, EN "Talbiyah" da yerleşik transliterasyon).

### ramazanGunleri.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| IFTAR_DUASI | İftar Duası | İftar Duası | Supplication for Breaking the Fast | Iftar Supplication | 1, 2, 9 | yüksek | allahümme leke sumtü | Ebû Dâvûd, Savm 22; Tirmizî, Savm 1. TR başlık kural 1/2'ye uygun, değişmiyor: aynı durumdaki en meşhur kayıt yalın adı koruyor. EN, kardeş kayıtların "Iftar Supplication: …" biçimiyle hizalandı (1. dalga istihare satırıyla aynı gerekçe). | |
| ZEHEBEZ_ZAMA | Zehebe’z-Zameu — İftar Sonrası Dua | İftar Duası: Zehebez zameu | Dhahaba az-Zamau — Supplication After Iftar | Iftar Supplication: Dhahaba az-zama'u | 2, 3, 6, 7 | yüksek | zehebez zameu | Ebû Dâvûd, Savm 22; İbn Mâce, Sıyâm 48. Karar kutusundaki "Durum Adı: başlangıç" örneğiyle birebir. orucRamazan/oruc-iftar-zehebez-zame ile birebir aynı metin → aynı başlık (kural 6). Tipografik kesme ve em dash kalktı. | |
| YA_ERHAMERRA | Yâ Erhamerrâhimîn — Rahmet Günleri Zikri | Ya Erhamerrahimin | Ya Arham ar-Rahimin — Dhikr for the Days of Mercy | Ya Arham ar-Rahimin | 5, 7, 8 | yüksek | — | Yûsuf 12/64; Enbiyâ 21/83. Esma zikri biçimi; em dash sonrası alt başlık (Ramazan'ın rahmet on günü) silindi, bilgi virtue/tags'te duruyor. Türkçede tamamen yerleşmiş birleşik yazım korundu. | |
| YA_GAFFAREZZUNUB | Yâ Gaffârez-Zünûb — Mağfiret Günleri Zikri | Ya Gaffarez zünub | Ya Ghaffar adh-Dhunub — Dhikr for the Days of Maghfirah | Ya Ghaffar adh-Dhunub | 5, 7, 8 | orta | — | Zümer 39/5; Nûh 71/10. Şapka ve terkip tiresi kalktı; izafetin ayrı mı birleşik mi yazılacağı — kalibrasyon 41. | |
| ATIKARRIKAB | Yâ Mu'tıka'r-Rikâb — İtk Günleri Zikri | Ya Mutıkar rikab | Ya Mu'tiq ar-Riqab — Dhikr for the Days of Itq | Ya Mu'tiq ar-Riqab | 5, 7, 8 | orta | — | Süyûtî, ed-Dürrü'l-mensûr 2/228. Kesme ve tire kalktı ("Mu'tıka'r" → "Mutıkar"); çift ünlü doğmuyor. Kalibrasyon 41. | |
| RAMAZAN_GUN_1 | Ramazan 1. Gün Duası — İbn Abbas | Ramazan 1. Gün Duası | Ramadan Day 1 Supplication — Ibn Abbas | Ramadan Day 1 Supplication | 7 | yüksek | ibn abbas duası | Gün numarası ayırt edici olduğu için korundu (kural 7 istisnası); "— İbn Abbas" nispeti alt başlıktan çıkıp tag'e ve source alanına bırakıldı. | |
| RAMAZAN_GUN_2 | Ramazan 2. Gün Duası — İbn Abbas | Ramazan 2. Gün Duası | Ramadan Day 2 Supplication — Ibn Abbas | Ramadan Day 2 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. | |
| RAMAZAN_GUN_3 | Ramazan 3. Gün Duası — İbn Abbas | Ramazan 3. Gün Duası | Ramadan Day 3 Supplication — Ibn Abbas | Ramadan Day 3 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. | |
| RAMAZAN_GUN_4 | Ramazan 4. Gün Duası — İbn Abbas | Ramazan 4. Gün Duası | Ramadan Day 4 Supplication — Ibn Abbas | Ramadan Day 4 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. | |
| RAMAZAN_GUN_5 | Ramazan 5. Gün Duası — İbn Abbas | Ramazan 5. Gün Duası | Ramadan Day 5 Supplication — Ibn Abbas | Ramadan Day 5 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. | |
| RAMAZAN_GUN_6 | Ramazan 6. Gün Duası — İbn Abbas | Ramazan 6. Gün Duası | Ramadan Day 6 Supplication — Ibn Abbas | Ramadan Day 6 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. | |
| RAMAZAN_GUN_7 | Ramazan 7. Gün Duası — İbn Abbas | Ramazan 7. Gün Duası | Ramadan Day 7 Supplication — Ibn Abbas | Ramadan Day 7 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. Transliterasyonda tipografik kesme var (kapsam dışı). | |
| RAMAZAN_GUN_8 | Ramazan 8. Gün Duası — İbn Abbas | Ramazan 8. Gün Duası | Ramadan Day 8 Supplication — Ibn Abbas | Ramadan Day 8 Supplication | 7 | yüksek | ibn abbas duası | Aynı gerekçe. Set 30 günün yalnız ilk 8'ini taşıyor (kapsam dışı). | |

Değişmeyen: 0 kayıt.

### orucRamazan.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| oruc-recep-saban-ramazana-yetistir | Ramazan'a Ulaştır Duası | Allahümme barik lena fi Recebin ve Şaban | Supplication to Reach Ramadan | Allahumma barik lana fi Rajaba wa Sha'ban | 3, 6, 8 | yüksek | recep ve şaban duası, üç aylar duası | Ahmed, Müsned nr. 2346; Bezzâr. Yerleşik tek bir özel ad yok (hem "Recep duası" hem "Ramazan'a ulaştır duası" deniyor) → kural 3. regaibKandili/RECEP_DUASI ile birebir aynı metin → aynı başlık (kural 6). | |
| oruc-hilal-ramazan | Ramazan Hilalini Görünce Dua | Hilali Görünce Okunan Dua | Supplication Upon Seeing the Ramadan Crescent | Dua Upon Seeing the New Moon | 2, 6, 7 | yüksek | ramazan hilali duası | Tirmizî, Deavât 86 (3451). Hısnu'l-Muslim bölüm adı "Hilalin Görülmesinde" (s. 88); metin her ayın hilali için okunur, "Ramazan" kural 7 ile çıktı. ramazanGirisi/HILAL_DUASI ile aynı metin, aynı başlık. | |
| oruc-iftar-zehebez-zame | İftar Duası — Susuzluk Gitti | İftar Duası: Zehebez zameu | Iftar Supplication — Thirst Has Gone | Iftar Supplication: Dhahaba az-zama'u | 2, 3, 6, 7 | yüksek | zehebez zameu | Ebû Dâvûd, Savm 22 (2357). ramazanGunleri/ZEHEBEZ_ZAMA ile birebir aynı metin → aynı başlık. Em dash sonrası meal silindi. | |
| oruc-iftar-birahmetike | İftar Duası — Rahmetinle Bağışla | İftar Duası: Allahümme inni eselüke birahmetike | Iftar Supplication — Forgive Me by Your Mercy | Iftar Supplication: Allahumma inni as'aluka birahmatika | 2, 3, 7, 8 | orta | — | (47 kr) İbn Mâce, Sıyâm 48 (1753). Durum adı özel ad kadar kısa olduğu için "Durum Adı: başlangıç" biçimi. "es'elüke" → "eselüke" (kalibrasyon 6 kararı); 1. dalga "Allahümme inni eselüke…" ailesinden "birahmetike" ile ayrışıyor. | |
| oruc-iftara-davet-eden-icin | İftara Davet Eden Ev Sahibi İçin Dua | İftar Verene Okunan Dua | Supplication for the Host Who Provides Iftar | Dua for the One Who Provides Iftar | 2, 6 | yüksek | eftare indekümüs saimun, misafir duası | 1. dalga: yemek-iftar-ev-sahibine ile birebir aynı metin, aynı başlık. Ebû Dâvûd, Et'ime 29 (3854); Hısnu'l-Muslim "Oruçluya İftar Yemeği Verenin Duası" (s. 91). | |

Değişmeyen: 1 kayıt (oruc-kadir-gecesi-afv — "Kadir Gecesi Duası" kural 7 istisnasına uygun gün adı, yasaklı işaret yok. kadirGecesi/KADIR_DUASI aynı duanın "kerîmün" fazlalı rivayeti ve aynı başlığı taşıyor; iki kaydın aynı adla görünmesi kalibrasyon 21 ile aynı durum — kalibrasyon 46).

### ramazanGirisi.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| HILAL_DUASI | Ramazan Hilali Duası | Hilali Görünce Okunan Dua | Supplication Upon Seeing the Ramadan Crescent | Dua Upon Seeing the New Moon | 2, 6, 7 | yüksek | ramazan hilali duası | Tirmizî 3451; Ahmed, Müsned 1/162. orucRamazan/oruc-hilal-ramazan ile birebir aynı metin → aynı başlık. Kaydın tags'i bütün ay başlangıçlarını içeriyor; bu da "Ramazan" nitelemesinin başlıktan çıkmasını destekliyor. | |

Değişmeyen: 1 kayıt (ORUC_NIYETI — "Ramazan Orucu Niyeti"; metin "min şehri Ramadân" diyerek aya bağlı olduğu için ay adı kural 7 istisnasıyla kalıyor, yasaklı işaret yok).

### kadirGecesi.mjs

Öneri yok.

Değişmeyen: 1 kayıt (KADIR_DUASI — "Kadir Gecesi Duası"; brief'teki yerleşik ad listesiyle birebir, gün adı kural 7 istisnası, yasaklı işaret yok. Aynı başlığı orucRamazan/oruc-kadir-gecesi-afv da taşıyor — kalibrasyon 46).

### beratKandili.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| BERAT_DUASI | Berat Gecesi Kalp Duası | Berat Gecesi Duası | Heart Supplication for Laylat al-Bara'ah | Dua of the Night of Bara'ah | 2, 7 | orta | allahümmerzukna kalben takiyyen | Süheyl b. Amr rivayeti (kaynak alanı zayıf). Setteki üç kayıttan yalnız bu metin Berat gecesine nispet ediliyor → gün adı kural 7 istisnasıyla korunup yalın hâle getirildi. Alternatif kural 3 adı "Allahümmerzukna kalben takiyyen" — kalibrasyon 48. | |
| BERAT_SECDE_DUASI | Berat Gecesi Secde Duası | Euzü biafvike min ikabike | Prostration Supplication for Laylat al-Bara'ah | A'udhu bi'afwika min iqabika | 3, 6, 7, 8 | yüksek | — | Müslim, Dua 72. Metin Berat'a özgü değil (2. dalga vitr-kunut-euzu-biridake ile aynı hadis, farklı rivayet/başlangıç) → kural 6 istisnası gereği gün adı düştü, kendi başlangıcını aldı. Terkip tiresi kalktı ("bi'afvike" → "biafvike"). | |
| RABBENA_LA_TUZIG | Berat Gecesi Hidayet Duası | Rabbena la tüziğ kulubena | Guidance Supplication for Laylat al-Bara'ah | Rabbana la tuzigh qulubana | 4, 6, 7, 8 | yüksek | al-i imran 8 | Âl-i İmrân 3/8. Dua ayeti → kural 4'ün birinci biçimi (başlangıç sözleri; 2. dalga sikinti-rabbena-efrig-sabran ile aynı tercih). Gün adı düştü: ayet Berat'a özgü değil. | |

Değişmeyen: 0 kayıt.

### miracKandili.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| MIRAC_TESBIHAT | Miraç Gecesi Birleşik Tesbihatı | Sübhanallahi velhamdü lillahi ve la havle | Combined Tasbih for the Night of Mi'raj | Subhanallahi walhamdu lillahi wa la hawla | 3, 6, 7 | düşük | miraç tesbihatı, havkale | (41 kr) Müslim, Zikr 30 (2694). Beş bölümlü bileşik zikir; ilk dört kelime 1. dalga tesbih-dortlu-zikir ve bu dalgadaki MEVLID_HAMD ile birebir aynı, ayırt edici bölüm sondaki havkale. Ortadaki "ve la ilahe illallahu vallahu ekber" başlıktan düşürüldü (virgülsüz eksiltme) — kalibrasyon 42 ve 43. | |
| AMENERRASULU | Âmenerrasulü (Bakara 285-286) | Amenerrasulü | Amana'r-Rasulu (Al-Baqarah 285-286) | Amana'r-Rasulu | 1, 7, 8 | yüksek | bakara 285-286 | Bakara 285-286; Müslim, Müsâfirîn 261 (807). Türkiye'de yerleşik özel ad; parantezli niteleme tag'e taşındı, şapka kalktı. | |

Değişmeyen: 0 kayıt.

### regaibKandili.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| RECEP_DUASI | Recep Ayı ve Üç Aylar Duası | Allahümme barik lena fi Recebin ve Şaban | Supplication for Rajab and the Three Sacred Months | Allahumma barik lana fi Rajaba wa Sha'ban | 3, 6, 7 | yüksek | recep ve şaban duası, üç aylar duası | Ahmed, Müsned I, 259; Beyhakî, Şuab. orucRamazan/oruc-recep-saban-ramazana-yetistir ile birebir aynı metin → aynı başlık (kural 6). | |
| SUBBUHEN_KUDDUSUN | Regâib Gecesi Secde Tesbihi | Sübbuhün kuddusün | Prostration Tasbih for Laylat al-Ragha'ib | Subbuhun quddusun | 3, 6, 7, 8 | yüksek | — | 2. dalga: namaz-ruku-secde-subbutun-kuddus ile aynı metin, aynı başlık. Müslim 487; El-Ezkar 134. Metin Regâib'e özgü değil → gün adı kural 6 istisnasıyla düştü. | |
| RABBIGFIR_VERHAM | Regâib Gecesi İki Secde Arası Duası | Rabbiğfir verham ve tecavez amma ta'lem | Supplication Between the Two Prostrations for Laylat al-Ragha'ib | Rabbighfir warham wa tajawaz amma ta'lam | 3, 7, 8 | yüksek | — | Gazâlî, İhyâ. Yalın durum adı ("İki Secde Arasında Okunan Dua") 2. dalga namaz-iki-secde-arasi-rabbigfir'e ait; bu kayıt kural 3'e düştü ve bu dalgadaki hac-say-hervele-duasi ile ortak olan önekten "ve tecavez" ile ayrıştı. Kural 8 istisnası: "ta'lem" kesmesi korundu. | |

Değişmeyen: 0 kayıt.

### mevlidKandili.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| LA_HAVLE | Lâ Havle Zikri | La havle vela kuvvete illa billah | The Hawqala Dhikr | La hawla wa la quwwata illa billah | 3, 7, 8 | yüksek | havkale | Havkale rivayetleri. "Zikri" eki ve şapkalar kalktı; 1. ve 2. dalgada bu lafız yalnız tag olarak geçiyordu, ilk kez başlık oluyor. Kaydın tam metnindeki "il aliyyil azim" ayırt edicilik için gerekli değil. | |
| SEYTANDAN_SIGINMA | Şeytanın Şerrinden Sığınma Duası | Rabbi euzü bike min hemezatiş şeyatin | Supplication for Refuge from Satan's Evil | Rabbi a'udhu bika min hamazatish shayatin | 3, 4, 8 | orta | müminun 97-98, istiaze | Mü'minûn 23/97-98. Bileşik kayıt: önce istiâze formülü, sonra dua ayeti; başlık karar kutusundaki "en meşhur bölüm" tercihine göre ayetten alındı (1. dalga sabah-euzu-billahis-semii-hasr ile aynı yöntem). | |
| IMRAN_200 | Sabır ve Sebat Ayeti | Al-i İmran Suresi 200. Ayet | The Verse of Patience and Steadfastness | Surah Aal-i Imran, Verse 200 | 4, 7, 8 | yüksek | ya eyyühellezine amenusbiru | Âl-i İmrân 3/200. Dua ayeti değil, emir ayeti → kural 4'ün ikinci biçimi; "Sabır ve Sebat Ayeti" uydurma konu adı, kalktı (brief kararı). Terkip tiresi kalktı. | |
| AHZAB_56 | Salavat Emri Ayeti | Ahzab Suresi 56. Ayet | The Verse Commanding Salawat | Surah Al-Ahzab, Verse 56 | 4, 7 | yüksek | innallahe ve melaiketehu | Ahzâb 33/56. Dua ayeti değil → kural 4'ün ikinci biçimi; uydurma konu adı kalktı (brief kararı). İncipit tag'e alındı (kalibrasyon 10 ile aynı tercih). | |
| RABBENA_ZALEMNA | Hz. Adem'in Duası | Hz. Adem ve Havva'nın Tövbe Duası | The Supplication of Prophet Adam, may peace be upon him | The Repentance Supplication of Prophet Adam and Hawwa | 1, 6, 8 | yüksek | araf 23, rabbena zalemna enfüsena | 2. dalga: istigfar-rabbena-zalemna ile birebir aynı metin, aynı başlık (A'râf 7/23). Ayet hem Âdem hem Havvâ'nın duası olduğu için 2. dalgadaki tam ad kullanıldı. | |
| ENBIYA_83 | Hz. Eyyûb'un Duası | Hz. Eyyub'un Duası | The Supplication of Prophet Ayyub (Job), may peace be upon him | The Supplication of Prophet Ayyub | 1, 7, 8 | yüksek | enbiya 83 | Enbiyâ 21/83. Peygamber duası → kural 1 (kural 4'ün önünde; 2. dalga istigfar-yunus-duasi ile aynı). Şapka ve EN'deki parantezli niteleme kalktı, Türkçe ek kesmesi kaldı. | |
| MEVLID_HAMD | Mevlid Hamd ve Tesbih Zikri | Sübhanallah vel hamdülillah | The Mawlid Dhikr of Praise and Glorification | Subhanallah wal-hamdulillah | 3, 6, 7 | orta | dörtlü zikir, bakiyatı salihat | 1. dalga: tesbih-dortlu-zikir ile aynı dört kelimelik metin (yalnız Arapça elif biçimi farklı), aynı başlık. Mevlid bağlamı kural 6 ile başlıktan çıktı. Kalibrasyon 13 ve 43 bu satırı da bağlıyor. | |
| MEVLID_RAHMET | Mevlid Muhabbet Duası | Allahümme inni eselüke hubbeke | The Mawlid Supplication of Love | Allahumma inni as'aluka hubbaka | 3, 6, 7, 8 | yüksek | hubbullah duası | Tirmizî, Deavât 73 (3235). 1. dalga "Allahümme inni eselüke…" ailesinden "hubbeke" ile ayrışıyor; mevlid bağlamı kural 6 ile düştü. Kaydın transliterasyonunda tipografik kesme var (kapsam dışı). | |

Değişmeyen: 1 kayıt (DUHA_SURESI — "Duha Suresi" kural 1'e uygun sure adı; şapka, parantez, em dash yok, EN "Surah Ad-Duha" da yerleşik).

### recepAyi.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| SUBHANALLAH_HAYY_KAYYUM | Sübhânallâhil-Hayyi'l-Kayyûm — Recep 1-10. Günler Zikri | Sübhanallahil Hayyil Kayyum | Subhanallah al-Hayy al-Qayyum — Dhikr for the 1st-10th Days of Rajab | Subhanallahil Hayyil Qayyum | 3, 7, 8 | yüksek | recep birinci on gün zikri | Receb-i Şerif Risalesi. Gün aralığı kural 7 ile silindi; metnin kendisi zaten ayırt edici. Faz bilgisi yapısal bir alanda tutulmuyor (kalibrasyon 44). Şapka ve terkip tireleri kalktı. | |
| SUBHANALLAH_EHAD_SAMED | Sübhânallâhil-Ehadi's-Samed — Recep 11-20. Günler Zikri | Sübhanallahil Ehadis Samed | Subhanallah al-Ahad as-Samad — Dhikr for the 11th-20th Days of Rajab | Subhanallahil Ahadis Samad | 3, 7, 8 | yüksek | recep ikinci on gün zikri | Aynı gerekçe. | |
| SUBHANALLAH_GAFUR_RAHIM | Sübhânallâhi'l-Ğafûri'r-Rahîm — Recep 21-30. Günler Zikri | Sübhanallahil Gafurir Rahim | Subhanallah al-Ghafur ar-Rahim — Dhikr for the 21st-30th Days of Rajab | Subhanallahil Ghafurir Rahim | 3, 7, 8 | yüksek | recep son on gün zikri | Aynı gerekçe. | |
| SEYYIDUL_ISTIGFAR | Seyyidü'l-İstiğfar — İstiğfarların Efendisi | Seyyidül İstiğfar | Sayyid al-Istighfar — The Master Supplication for Seeking Forgiveness | Sayyid al-Istighfar | 1, 6, 7, 8 | yüksek | — | Buhârî, Deavât 2 (6306). Brief'in sabit ad listesiyle birebir; em dash sonrası çeviri alt başlığı ve kesmeler kalktı. `hastalıkVeŞifa.mjs/sifa-seyyidul-istigfar` ile birebir aynı metin — sonraki dalgada aynı başlığı almalı. | |
| RECEP_HACET_1 | Recep İlk 10 Gün Hacet Namazı Sonrası Duası | Recep Hacet Duası: La ilahe illallahu vahdehu | Supplication After the Salat al-Hajah of the First 10 Days of Rajab | Rajab Hajah Supplication: La ilaha illallahu wahdahu | 2, 3, 7 | orta | recep hacet namazı, tehlil | (45 kr) Gazzâlî, İhyâ; Receb-i Şerif Risalesi. Gün aralığı silindi, tertip adı korundu (kural 7 istisnası, kalibrasyon 45). Metin tehlil ailesinden; yalın tehlil adı 2. dalga namaz-sonrasi-la-ilahe-mania'ya ait olduğu için "Durum Adı: başlangıç" biçimi kullanıldı. | |
| RECEP_HACET_2 | Recep İkinci 10 Gün Hacet Namazı Sonrası Duası | Recep Hacet Duası: İlahen vahiden ehaden | Supplication After the Salat al-Hajah of the Second 10 Days of Rajab | Rajab Hajah Supplication: Ilahan wahidan ahadan | 2, 3, 7 | orta | recep hacet namazı | Aynı tertip; üç kayıt tek biçimde adlandırıldı. Transliterasyonda parantezli açıklama var (kapsam dışı). | |
| RECEP_HACET_3 | Recep Son 10 Gün Hacet Namazı Sonrası Duası | Recep Hacet Duası: Allahümme la mania | Supplication After the Salat al-Hajah of the Last 10 Days of Rajab | Rajab Hajah Supplication: Allahumma la mani'a | 2, 3, 7 | orta | recep hacet namazı | Ahmed, Müsned; Receb-i Şerif Risalesi. `hasettenKorunma.mjs/LA_MANIA_LIMA_ATAYTE` aynı metinle başlıyor; o kayıt tematik koleksiyonda olduğu için kural 6 istisnasıyla yalın başlangıcı alacak, bu kayıt tertip adını koruyor (kalibrasyon 17 kararıyla aynı yön). | |

Değişmeyen: 1 kayıt (RECEP_15_SECDE_DUASI — "Recep 15. Gece Secde Duası"; gün aralığı değil belirli bir geceye ait tertip duası, kural 7 istisnası; yasaklı işaret yok, 26 karakter).

### sabanAyi.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| YA_LATIF | Subhânallâhi'l-Latîf — Şaban 1-10. Günler Zikirı | Sübhanallahil Latif | Subhanallahi'l-Latif — Dhikr for Days 1–10 of Sha'ban | Subhanallahil Latif | 3, 7, 8 | yüksek | ya latif, şaban birinci on gün zikri | Şaban-ı Şerif Risalesi. Gün aralığı ve "Zikirı" yazım hatası birlikte kalktı; "Subhân" → "Sübhan" (1. ve 2. dalga imlası). Devamı ("celle şanüh") ayırt edicilik için gerekmiyor. | |
| YA_REZZAK | Subhânallâhi'r-Razzâk — Şaban 11-20. Günler Zikirı | Sübhanallahir Rezzak | Subhanallahi'r-Razzaq — Dhikr for Days 11–20 of Sha'ban | Subhanallahir Razzaq | 3, 7, 8 | orta | ya rezzak, şaban ikinci on gün zikri | Aynı gerekçe. Esmanın Türkçede yerleşik okunuşu "Rezzâk" olduğu için "Razzâk" yerine "Rezzak" yazıldı (kalibrasyon 41). | |
| YA_AZIZ | Subhânallâhi'l-Azîz — Şaban 21-30. Günler Zikirı | Sübhanallahil Aziz | Subhanallahi'l-Aziz — Dhikr for Days 21–30 of Sha'ban | Subhanallahil Aziz | 3, 7, 8 | yüksek | ya aziz, şaban son on gün zikri | Aynı gerekçe. | |
| KAMIL_LUTF | Allâhümme Yâ Kâmilel Lutf — Şaban Esma Sonrası Münacaat | Allahümme ya kamilel lutf | Allahumma Ya Kamilal-Lutf — Munajat After the Sha'ban Asma' Dhikr | Allahumma ya kamilal-lutf | 3, 7, 8 | yüksek | şaban münacaatı | Şaban-ı Şerif Risalesi. Em dash sonrası bağlam alt başlığı silindi, şapkalar kalktı. | |

Değişmeyen: 0 kayıt.

### saferAyi.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| SAFER_GIRISI_DUASI | Safer Ayı Giriş Duası | Safer Ayına Girerken Okunan Dua | Supplication for the Entry of Safar | Dua When Entering the Month of Safar | 2, 9 | orta | safer duası | Geleneksel evrad mecmuaları. Metin Safer'e özgü ("biduhûli's-safer") → ay adı kural 7 istisnasıyla kalıyor; yalnız kural 2'nin standart biçimine getirildi (1. dalga "Evden Çıkarken Okunan Dua" ile aynı). | |
| SAFER_BISMILLAH_LA_YEDURRU | Bismillâh Koruma Duası (Lâ Yedurru) | Bismillahillezi la yedurru | Bismillah Protection Supplication (La Yadurru) | Bismillahilladhi la yadurru | 3, 6, 7, 8 | yüksek | — | 1. dalga: sabah-bismillah-koruma ile aynı metin, aynı başlık (brief'in sabit ad listesi). Ebû Dâvûd, Tıb 24. `koruyucu.mjs/BISMILLAH_LA_YEDURRU` de aynı metin — sonraki dalgada aynı başlık. | |
| SAFER_KORUNMA_DUASI | Safer Korunma Duası (Yâ Şedîdel Guvâ) | Allahümme ya şedidel kuva | Safar Protection Supplication (Ya Shadidal-Quwa) | Allahumma ya shadidal-quwa | 3, 7, 8 | orta | safer korunma duası | Livâsânî, Mirkâtü'l-cinân. Yerleşik özel ad yok → kural 3; parantezli niteleme tag'e indi. Kaydın transliterasyonu "guvâ" diyor, Arapçası الْقُوَى = "kuvâ"; başlıkta doğru okunuş kullanıldı (kapsam dışı gözlem). | |
| YA_HALIK | Yâ Hâlik | Ya Halık | Ya Khaliq | Ya Khaliq | 5, 6, 8 | yüksek | — | 2. dalga: sikinti-ya-halik ile aynı metin, aynı başlık (brief'in sabit ad listesi). Yalnız şapkalar kalktı, EN değişmiyor. | |
| SAFER_HASBUNALLAH_VEKIL | Hasbünallâhu ve Ni'mel Vekîl (Âl-i İmrân 173) | Hasbünallahu ve nimel vekil | Hasbunallahu wa Ni'mal-Wakil (Aal-i-Imran 3:173) | Hasbunallahu wa ni'mal-wakil | 3, 6, 7, 8 | yüksek | al-i imran 173, hasbiyallah | Kalibrasyon 14 kararı: Âl-i İmrân 173 lafzı → "Hasbünallahu ve nimel vekil". Parantezli niteleme tag'e indi. `koruyucu.mjs/HASBUNALLAH_VEKIL` aynı metin — sonraki dalgada aynı başlık. | |
| RABBI_ENZELTELEYYE | Rabbi İnnî Limâ Enzelte (Kasas 24) | Rabbi inni lima enzelte ileyye | Rabbi Inni Lima Anzalta (Al-Qasas 28:24) | Rabbi inni lima anzalta ilayya | 4, 7, 8 | orta | kasas 24, hz. musa'nın duası | Kasas 28/24. Peygamber duası ama "Hz. Musa'nın Duası" tek metni göstermiyor (Tâhâ 25-28 de aynı adla anılıyor) → kural 1 yerine kural 4'ün birinci biçimi; nispet tag'e alındı. `evlilikHuzur.mjs/evlilik-kasas-24` aynı metin — sonraki dalgada aynı başlık. | |
| SAFER_MUAFAZA_DUASI | Safer Muhafaza Duası (Şifa Suyu Sonrası) | Allahümmesımna min cehdil bela | Safar Protection Supplication (After the Healing Water) | Allahumma 'simna min jahdil-bala | 3, 7, 8 | yüksek | safer muhafaza duası, cehdil bela duası | Muhammed Ebu'l-Yüsr Âbidîn, Tenbîhu'l-kulûb. Parantezli bağlam silindi (son çarşamba bilgisi tags/specialDays'te); kesme kalkınca yanlış okuma doğmuyor. | |

Değişmeyen: 0 kayıt.

### muharremIlkOn.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| AYETEL_KURSI | Âyetel Kürsî | Ayetel Kürsi | Ayat al-Kursi | Ayat al-Kursi | 1, 6, 8 | yüksek | bakara 255 | 1. dalga uyku-ayetel-kursi ve 2. dalga namaz-sonrasi-ayetel-kursi ile aynı metin, aynı başlık. Yalnız şapkalar kalktı, EN değişmiyor. | |
| BAKIYAT_SALIHAT | Bakıyat-ı Salihat Zikri | Sübhanallahi velhamdü lillahi vallahu ekber | Dhikr of the Enduring Righteous Deeds | Subhanallahi walhamdu lillahi wallahu akbar | 3, 7, 8 | orta | bakiyatı salihat | (43 kr) Üç bölümlü tesbih (tehlil yok); 1. dalga tesbih-dortlu-zikir ve bu dalgadaki MEVLID_HAMD ile ilk iki bölümü ortak olduğu için ayırt edici bölüme ("vallahu ekber") uzatıldı. Eski adın hangi kayda ait olduğu kalibrasyon 13 ve 43'e bağlı. | |
| YA_SELAM | Ya Selam (c.c.) | Ya Selam | Ya Salam | Ya Salam | 5, 7, 8 | yüksek | — | Esmâ-i Hüsnâ. Brief kararı: "(c.c.)" silinir. EN değişmiyor. | |
| TEVHID | Kelime-i Tevhid ve Risalet | Kelimei Tevhid | The Word of Tawhid and Risalah | Kalimat at-Tawhid | 1, 7, 8 | orta | kelime-i tevhid, muhammedür rasulullah | Metin tehlil + risalet ikrarı; Türkiye'de bu bütünün adı doğrudan "kelime-i tevhid". İzafet tiresi kural 8 ile kalktı (2. dalga "Salatı Fatih", "Salavatı Şerife" ile aynı tercih); yaygın tireli yazım tag'e alındı — kalibrasyon 40. | |
| SELAMUN_KAVLEN | Selamün Kavlen Mirrabbirrahim | Yasin Suresi 58. Ayet | Salamun Qawlan Min Rabbir-Rahim | Surah Ya-Sin, Verse 58 | 4, 7 | yüksek | selamün kavlen mir rabbir rahim | Yâsîn 36/58. Dua ayeti değil, ilâhî hitap → kural 4'ün ikinci biçimi; incipit tag'e alındı (2. dalga sikinti-huvellezi-sekine ve kaygi-ud-uni-estecib-lekum ile aynı tercih). | |
| SEHADET | Kelime-i Şehadet | Kelimei Şehadet | The Word of Shahadah | Kalimat ash-Shahadah | 1, 8 | orta | kelime-i şehadet | Yerleşik özel ad; yalnız izafet tiresi kural 8 ile kalktı — kalibrasyon 40. (Kaydın Arapçası "Muhammeden Rasûlullah", transliterasyonu "Muhammeden abdühû ve rasûlüh" diyor — kapsam dışı.) | |
| HASBIYALLAH_VEKIL | Hasbiyallah Vekil Zikri | Hasbiyallahu ve nimel vekil, nimel mevla | Hasbiyallahu wa Ni'mal Wakil Dhikr | Hasbiyallahu wa ni'mal-wakil, ni'mal mawla | 3, 7, 8 | orta | hasbiyallah, enfal 40 | (40 kr) Kayıt "Hasbiye" lafzını Âl-i İmrân 173 kalıbıyla, ardından Enfâl 40'ın "ni'mel mevlâ ve ni'men nasîr" bölümüyle birleştiriyor. Kalibrasyon 14 her kaydı kendi nameArabic'ine göre sınıflandırmayı emrettiği için lafız korundu; kurban-bayrami/HASBIYE_ZIKRI_100 yalın adı aldığından bu kayıt ayırt edici bölüme uzatıldı — kalibrasyon 49. | |
| SUBHANALLAHI_MIZAN | Sübhanallahi Mil'el Mizan Zikri | Sübhanallahi mil'el mizan | Subhanallahi Mil'al-Mizan Dhikr | Subhanallahi mil'al-mizan | 3, 7, 8 | yüksek | — | Ebu'l-Bekā el-Ömerî; el-Evrâdü'd-dâime. "Zikri" eki kalktı; kural 8 istisnası: "mil'e" kesmesi kalkınca yanlış okuma doğuyor, korundu. | |

Değişmeyen: 4 kayıt — ASURE_DUASI ("Aşure Günü Duası"; gün adı kural 7 istisnası, setteki en meşhur Aşure duası yalın adı taşıyor), ASURE_ENBIYA_DUASI ("Aşure Günü Enbiya Duası"; metin "yevme âşûrâ" diyerek güne bağlı, yalın ad diğer kayda gittiği için nitelemeli ad kalıyor), YA_RAHMAN_YA_RAHIM ("Ya Rahman Ya Rahim"; karar kutusundaki "her Ya büyük" biçimine zaten uygun), FATIHA_SURESI ("Fatiha Suresi"; kural 6 istisnası — özel gün setine konmuş genel metin kendi yalın adını taşıyor, yasaklı işaret yok).

### zilhicce-ilk-on.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| VAHDEHU_LA | Zilhicce Tehlili (Vahdehû Lâ) | La ilahe illallahu vahdehu, biyedihil hayr | Dhul Hijja Tahlil (Wahdahu La) | La ilaha illallahu wahdahu, biyadihil khayr | 3, 6, 7 | orta | zilhicce tehlili, tehlil | (42 kr) Buhârî, Deavât 65 (6403). Genel tehlil metni özel gün setine konmuş → kural 6 istisnasıyla gün adı düştü. Yalın tehlil adı 2. dalga namaz-sonrasi-la-ilahe-mania'ya ait; ortak önek tek başına 40 karakter olduğu için ayırt edici bölüm virgülle eklendi — kalibrasyon 42. | |
| LEKEL_HAMD | Allâhümme Lekel Hamdü Duası | Allahümme lekel hamdü kellezi nekul | Allahumma Lakal Hamd Supplication | Allahumma lakal hamdu kalladhi naqul | 3, 7, 8 | yüksek | — | Tirmizî, Deavât 121 (3421). "Duası" eki ve şapkalar kalktı; kurban-bayrami/KURBAN_SUKRU_DUASI ile ortak olan "Allahümme lekel hamdü" önekinden dördüncü kelimede ayrışıyor. | |
| IHLAS | İhlâs Sûresi | İhlas Suresi | Surah Al-Ikhlas | Surah Al-Ikhlas | 1, 8 | yüksek | kul hüvallahü ehad | Sure adı; yalnız şapkalar kalktı, EN değişmiyor. | |
| ISTIGFAR | İstiğfar ve Tövbe | Estağfirullahel azime ve etubü ileyh | Istighfar and Repentance | Astaghfirullahal azima wa atubu ilayh | 3, 7 | yüksek | — | Ebû Dâvûd, Vitir 26 (1518); Tirmizî 3416. 2. dalga istigfar-gunluk metni "Estağfirullahe ve etubü ileyh"; bu kayıt "el-azîme" fazlasıyla ikinci kelimede ayrışıyor, o yüzden ayrı başlık. | |
| YA_HAYYU_YA_KAYYUM | Yâ Hayyü Yâ Kayyûm Duası | Ya Hayyu Ya Kayyum ya bedias semavati | Ya Hayyu Ya Qayyum Supplication | Ya Hayyu Ya Qayyum ya badi'as-samawati | 3, 5, 7, 8 | orta | ismi azam duası | Tirmizî, Deavât 100 (3544) — İsm-i A'zam rivayeti. Brief'in sabit adı "Ya Hayyu Ya Kayyum" 1. dalga sabah-ya-hayyu-kayyum ve 2. dalga sikinti-ya-hayyu-ya-kayyum kayıtlarına (farklı hadis: "birahmetike esteğîsü") ait olduğu için bu kayıt ayırt edici kelimeye uzatıldı. | |
| NUR | Nûr Duası | Nur Duası | Supplication of Light (Du'a al-Nur) | The Dua of Light | 1, 6, 7, 8 | yüksek | camiye giderken okunan dua | 1. dalga: cami-giris-nur-duasi ile aynı hadis (Buhârî 6316; Müslim 763) — bu kayıt aynı duanın kısa rivayeti → kural 6 gereği aynı başlık (kalibrasyon 21 ile aynı durum). Şapka ve EN'deki parantezli niteleme kalktı. | |

Değişmeyen: 0 kayıt.

### kurban-bayrami-2026.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| SUBHANALLAHI_VE_BIHAMDIHI | Tesbih Zikri | Sübhanallahi ve bihamdihi | Tasbih of Glorification and Praise | Subhanallahi wa bihamdihi | 3, 6, 7 | yüksek | — | 1. dalga: sabah-subhanallah-bihamdihi ile aynı metin, aynı başlık (brief'in sabit ad listesi). Buhârî 6405-6406; Müslim 2691, 2694. | |
| ESTAGFIRULLAH | Estağfirullâh | Estağfirullah | Astaghfirullah | Astaghfirullah | 3, 6, 8 | yüksek | — | Brief'teki kural 6 istisnası örneği: özel gün setine konmuş genel zikir kendi yalın adını alır, bayram adı başlığa girmez. Yalnız şapka kalktı, EN değişmiyor. | |
| KURBAN_SUKRU_DUASI | Şükür Duası | Allahümme lekel hamdü küllühu | Supplication of Gratitude | Allahumma lakal hamdu kulluhu | 3, 6 | yüksek | kurban şükür duası | Hac 22/37; kurban sonrası şükür duaları geleneği. "Şükür Duası" tek bir duayı işaret edemeyecek kadar genel (1. dalga aksam-emsena gerekçesi) → kural 3; zilhicce/LEKEL_HAMD ile ortak önekten dördüncü kelimede ayrışıyor. | |
| HASBIYE_ZIKRI_100 | Hasbiye Zikri | Hasbiyallahu ve nimel vekil | Dhikr of Sufficiency | Hasbiyallahu wa ni'mal-wakil | 3, 7, 8 | orta | hasbiye, hasbiyallah | Buhârî, Tefsîr Âl-i İmrân 13 (4563). Kalibrasyon 14 Âl-i İmrân 173 için "Hasbünallahu" lafzını sabitlemişti; bu kaydın nameArabic'i "Hasbiye" lafzını taşıdığı için kendi lafzına göre adlandırıldı — kalibrasyon 49. Ailenin yalın adını bu kayıt aldı, muharrem/HASBIYALLAH_VEKIL uzatıldı. | |
| HASBIYE | Tevekkül ve Hasbiye Zikri | Hasbiyallahu ve kefa | Dhikr of Trust and Sufficiency | Hasbiyallahu wa kafa | 3, 7 | yüksek | hasbiye | Dua ve tevekkül mecmuaları. "Hasbiye" ailesinin üçüncü lafzı; ikinci kelimede ("ve kefa") ayrışıyor. Kaynak alanı hadis göstermiyor (kapsam dışı). | |

Değişmeyen: 1 kayıt (TESRIK_TEKBIRI — "Teşrik Tekbiri" kural 1'e uygun yerleşik özel ad, brief'in yerleşik ad listesinde; şapka, sayı, parantez yok).

### eyyamibiyd.mjs

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| TEVHID_SIRK_UZAKLASMA | Tevhid ve Şirkten Uzaklaşma Zikri | Allahu Allahu Rabbi la üşrikü bihi | Dhikr of Tawhid and Distancing from Shirk | Allahu Allahu Rabbi la ushriku bihi | 3, 6, 7 | orta | eyyamı biyd zikri | 2. dalga: sikinti-allahu-allahu-rabbi ile aynı zikrin uzun rivayeti (bu kayıtta "ve lâ ettehizü min dûnihî veliyyen" fazlası var) → kural 6 gereği aynı başlık; iki kayıt listede aynı adla görünecek (kalibrasyon 21 ile aynı durum). Eski başlık editoryal konu adıydı. | |

Değişmeyen: 0 kayıt.

### Dalga 4 — Özet

| Dosya | Kayıt | Öneri | Değişmeyen |
|---|---|---|---|
| hacUmre.mjs | 13 | 12 | 1 |
| ramazanGunleri.mjs | 13 | 13 | 0 |
| orucRamazan.mjs | 6 | 5 | 1 |
| ramazanGirisi.mjs | 2 | 1 | 1 |
| kadirGecesi.mjs | 1 | 0 | 1 |
| beratKandili.mjs | 3 | 3 | 0 |
| miracKandili.mjs | 2 | 2 | 0 |
| regaibKandili.mjs | 3 | 3 | 0 |
| mevlidKandili.mjs | 9 | 8 | 1 |
| recepAyi.mjs | 8 | 7 | 1 |
| sabanAyi.mjs | 4 | 4 | 0 |
| saferAyi.mjs | 7 | 7 | 0 |
| muharremIlkOn.mjs | 12 | 8 | 4 |
| zilhicce-ilk-on.mjs | 6 | 6 | 0 |
| kurban-bayrami-2026.mjs | 6 | 5 | 1 |
| eyyamibiyd.mjs | 1 | 1 | 0 |
| **Dalga 4 toplamı** | **96** | **85** | **11** |

Güven dağılımı (Dalga 4): yüksek 60, orta 24, düşük 1.

Not: `IFTAR_DUASI` satırında TR başlık değişmiyor, yalnız EN hizalandı; bu yüzden
"Değişmeyen" değil "Öneri" sayıldı (1. dalga `istihare-allahümme-estehiruke` ile aynı).

### Dalga 4 — Kalibrasyon soruları

Yalnız yeni ve gerçekten karar gerektiren maddeler. Karara bağlanmış konular (1-4, 6, 14,
15, 17) tekrar sorulmuyor; 5, 7-13, 16, 18-22 hâlâ satır bazlı açık.

40. **İzafet tiresi: "Kelimei Tevhid" mi "Kelime-i Tevhid" mi?**
    Kural 8 Arapça terkipte tireyi yasaklıyor ve 2. dalgada bu kural salavat adlarına
    uygulandı ("Salât-ı Fâtih" → "Salatı Fatih"). Aynı kuralı uygulayınca
    `TEVHID` → "Kelimei Tevhid", `SEHADET` → "Kelimei Şehadet" çıkıyor. Ancak Türkiye'de
    en yaygın halk yazımı açık farkla **tireli** biçim ("Kelime-i Tevhid"); bu iki ad
    salavat adlarından daha yüksek tanınırlığa sahip.
    Seçenekler: **(a)** kural 8'i uygula, tireli biçim tag olsun (mevcut öneri),
    **(b)** yalnız "kelime-i tevhid/şehadet" için kural 8'e istisna aç,
    **(c)** 2. dalga salavat adlarını da tireye döndür (geriye dönük 6 satır değişir).

41. **Esma terkiplerinde izafet ayrı mı yazılsın, birleşik mi?**
    Üç satır etkileniyor: "Ya Gaffarez zünub" / "Ya Gaffarezzünub",
    "Ya Mutıkar rikab" / "Ya Mutıkarrikab", "Sübhanallahir Rezzak" / "Sübhanallahi'r-Razzâk".
    "Ya Erhamerrahimin" Türkçede tamamen birleşik yerleştiği için ayrı yazılmadı; ötekilerde
    birleşik yazım okunaksızlaşıyor. Ayrıca `YA_REZZAK` satırında esmanın Türkçedeki
    yerleşik okunuşu ("Rezzak") kaydın transliterasyonundaki "Razzâk"a tercih edildi.
    Ayrı yazım (mevcut öneri) onaylanıyor mu?

42. **Tehlil ailesinde ortak önek 40 karakteri tek başına dolduruyor.**
    `VAHDEHU_LA` ("La ilahe illallahu vahdehu la şerike leh" = 40 kr) ile 2. dalga
    `namaz-sonrasi-la-ilahe-mania` arasındaki ayırt edici kelimeye ("yuhyî ve yümît…
    biyedihi'l-hayr") bitişik olarak uzatmak 55+ karakter ediyor. Önerim, ortadaki bölümü
    atlayıp virgülle işaretlemek: "La ilahe illallahu vahdehu, biyedihil hayr" (42 kr).
    Seçenekler: **(a)** virgüllü eksiltme (mevcut öneri), **(b)** ortak öneki tamamen
    düşür ("Yuhyi ve yümitü biyedihil hayr"), **(c)** 50 sınırını bu satırda aş.
    Aynı soru `MIRAC_TESBIHAT` için de geçerli (orada eksiltme virgülsüz yapıldı).

43. **"Bakiyatı Salihat" adı hangi kayda ait?**
    Üç kayıt bu adı talep edebiliyor: `BAKIYAT_SALIHAT` (üç bölüm: sübhanallah + elhamdülillah
    + Allahu ekber), 1. dalga `tesbih-dortlu-zikir` = bu dalgadaki `MEVLID_HAMD` (dört bölüm,
    tehlil dahil), `MIRAC_TESBIHAT` (beş bölüm, havkale dahil). Kalibrasyon 13 "başlık mı tag
    mi" diye soruyordu; artık "başlık olacaksa **hangi** kayda" sorusu da var. Üçüne de kural 3
    başlangıcı verdim ve adı tag'e aldım.

44. **Recep ve Şaban esma zikirlerinde on günlük faz bilgisi yapısal alanda tutulmuyor.**
    Brief "gün aralığı dhikrDay'de var" diyordu; doğrulama: `dhikrDay` alanı yalnız
    `esmaulHusnaTemel.mjs`'te (hafta günleri) var, `recepAyi.mjs` ve `sabanAyi.mjs`
    kayıtlarında yok. Başlıktan "Recep 1-10. Günler" silinince faz bilgisi yalnız `virtue`
    metninde ve veri seti açıklamasında kalıyor (metinler zaten birbirinden ayırt edilebilir
    olduğu için başlık okunaklılığı kaybolmuyor). Silme onaylanıyor mu, yoksa önce bir alan
    mı eklenmeli (ayrı veri işi)?

45. **Recep hacet namazı üçlüsünde tertip adı korunsun mu?**
    `RECEP_HACET_1/2/3` için "Recep Hacet Duası: <başlangıç>" biçimini kullandım: gün aralığı
    kural 7 ile silindi ama tertip adı kaldı, çünkü üç metin yalnız bu tertip içinde geçiyor
    ve `RECEP_HACET_1`'in başlangıcı tehlil ailesiyle çakışıyor. Alternatif: üçünü de yalın
    başlangıç sözleriyle adlandırmak (o zaman `RECEP_HACET_1` kalibrasyon 42'deki eksiltmeye
    muhtaç olur).

46. **Kadir Gecesi duasının iki rivayeti aynı başlığı taşıyacak.**
    `KADIR_DUASI` ("afüvvün **kerîmün** tühibbül afve") ile `oruc-kadir-gecesi-afv`
    ("afüvvün tühibbül afve", Tirmizî 3513'ün sahih lafzı) ikisi de "Kadir Gecesi Duası"
    adını taşıyor ve ikisi de değişmiyor. Kabul mü (kalibrasyon 21 ile aynı yön), yoksa
    "kerîm" rivayeti "Kadir Gecesi Duası: Allahümme inneke afüvvün kerim" (49 kr) mi olsun?

47. **Zemzem: kural 1 mi kural 2 mi?**
    "Zemzem Duası" (yerleşik ad, mevcut öneri) yerine "Zemzem İçerken Okunan Dua" (durum adı)
    tercih edilirse satır değişir; brief her iki biçimi de listelemişti.

48. **`BERAT_DUASI`na yalın "Berat Gecesi Duası" adını vermek doğru mu?**
    Kaynak alanı zayıf ("Hadis-i Şerif, Süheyl b. Amr rivayeti"), ama setteki üç metinden
    yalnız bu Berat gecesine nispet ediliyor (diğer ikisi Müslim'den genel secde duası ve
    Âl-i İmrân 8). Alternatif kural 3 adı: "Allahümmerzukna kalben takiyyen" (31 kr).

49. **"Hasbiye" ailesinde lafız mı ayet mi esas alınsın?**
    `HASBIYE_ZIKRI_100` ve `HASBIYALLAH_VEKIL` kayıtlarının nameArabic'i "**Hasbiye**llâhu ve
    ni'mel vekîl" diyor; Âl-i İmrân 173'ün lafzı ise "**Hasbüne**llâhu…" (2. dalga
    `sikinti-hasbiye-tertibi` kapsam dışı notunda aynı uyuşmazlık işaretlenmişti).
    Kalibrasyon 14'ün "her kaydı kendi nameArabic'ine göre sınıflandır" yöntemini uyguladım;
    alternatif, bunu veri hatası sayıp başlıkları (ve Arapçayı) ayet lafzına çekmek.

### Dalga 4 — Kapsam dışı gözlemler

Bunlar başlıkla ilgili değil, yalnız nottur. Bu dalgada hiçbiri düzeltilmedi.

- **Dalga kapsamı**: brief bu 16 dosya için "~108 kayıt" diyordu; gerçek sayı **96**
  (dosya başına sayılar özet tablosunda; brief'teki dosya bazlı sayıların hepsi doğru,
  toplam yanlış).
- **`dhikrDay` alanı bu dosyalarda yok**: yalnız `esmaulHusnaTemel.mjs` kullanıyor.
  Recep/Şaban faz bilgisi hiçbir yapısal alanda tutulmuyor (kalibrasyon 44).
- **Yazım hatası — "Zikirı"**: `sabanAyi.mjs` içinde üç kayıtta ("Şaban 1-10. Günler Zikirı"
  vb.). Yeni başlıklarda yok oluyor.
- **Transliterasyon hatası**: `SAFER_KORUNMA_DUASI` → "yâ şedîdel **guvâ**"; Arapçası
  الْقُوَى, doğrusu "kuvâ".
- **Transliterasyonda biçim kirliliği**: `hac-zemzem-duasi` → metnin ortasında em dash'li
  Türkçe açıklama ("— ve burada niyet edilir —"); `RECEP_HACET_2` → "(Şu ek ile de okunur: …)";
  `RECEP_HACET_3` → "(3 kere)"; `YA_LATIF`/`YA_REZZAK`/`YA_AZIZ` → "(veya: Yâ Latîf)".
- **Tipografik kesme (`’`)**: `ZEHEBEZ_ZAMA` eski başlığında, `RAMAZAN_GUN_7` ve
  `MEVLID_RAHMET` transliterasyonlarında. Yeni önerilerde düz ASCII kullanıldı.
- **nameArabic içinde besmele/hatime**: `IMRAN_200` ve `AHZAB_56` Arapçaları besmele ile
  başlayıp "Sadekallâhü'l-azîm" ile bitiyor; `DUHA_SURESI`, `FATIHA_SURESI` ve
  `ASURE_ENBIYA_DUASI` de besmele içeriyor. Başlıklar bunu yansıtmıyor.
- **Arapça ile transliterasyon uyuşmazlığı**: `SEHADET` Arapçası "Muhammeden Rasûlullâh",
  transliterasyonu "Muhammeden abdühû ve rasûlüh".
- **Aynı dalga içinde birebir tekrar eden üç çift**: `oruc-hilal-ramazan` ↔ `HILAL_DUASI`,
  `oruc-iftar-zehebez-zame` ↔ `ZEHEBEZ_ZAMA`,
  `oruc-recep-saban-ramazana-yetistir` ↔ `RECEP_DUASI`. Ayrıca `oruc-kadir-gecesi-afv` ↔
  `KADIR_DUASI` tek kelime farkla aynı.
- **Önceki/sonraki dalgalarla aynı metni taşıyan kayıtlar**: `RABBENA_ZALEMNA` ↔
  `istigfar-rabbena-zalemna`; `AYETEL_KURSI` ↔ `uyku-ayetel-kursi`/`namaz-sonrasi-ayetel-kursi`;
  `SUBHANALLAHI_VE_BIHAMDIHI` ↔ `sabah-subhanallah-bihamdihi`; `MEVLID_HAMD` ↔
  `tesbih-dortlu-zikir`; `SUBBUHEN_KUDDUSUN` ↔ `namaz-ruku-secde-subbutun-kuddus`;
  `oruc-iftara-davet-eden-icin` ↔ `yemek-iftar-ev-sahibine`; `SEYYIDUL_ISTIGFAR` ↔
  `sifa-seyyidul-istigfar` (henüz adlandırılmadı); `SAFER_BISMILLAH_LA_YEDURRU` ↔
  `koruyucu.mjs/BISMILLAH_LA_YEDURRU` (henüz adlandırılmadı);
  `SAFER_HASBUNALLAH_VEKIL` ↔ `koruyucu.mjs/HASBUNALLAH_VEKIL` (henüz adlandırılmadı);
  `RABBI_ENZELTELEYYE` ↔ `evlilikHuzur.mjs/evlilik-kasas-24` (henüz adlandırılmadı);
  `YA_HALIK` ↔ `sikinti-ya-halik`; `RECEP_HACET_3` ↔ `hasettenKorunma.mjs/LA_MANIA_LIMA_ATAYTE`
  (henüz adlandırılmadı). Sonraki dalgalarda bu satırlar bağlayıcı.
- **Anahtar farklı, metin aynı ama Arapça yazımı farklı**: `MEVLID_HAMD` ile
  `tesbih-dortlu-zikir` aynı dört kelimeyi farklı elif biçimiyle (`إِلٰهَ` / `إِلَٰهَ`)
  yazıyor; birebir metin karşılaştırması yapan betikler bu çifti kaçırır.
- **Biçim dışı key'ler**: bu dalgadaki 16 dosyanın 13'ü `keyMap.mjs` üzerinden BÜYÜK_HARF
  key kullanıyor, `hacUmre.mjs` ve `orucRamazan.mjs` kebab-case. `keyMap.TEKBIR` →
  `TESRIK_TEKBIRI` ve `keyMap.SALAVAT_SERIF` → `SALAVAT-I ŞERİFE` (boşluklu ve Türkçe harfli
  key; 2. dalgada da işaretlenmişti) — rename betiği key ile eşleşeceği için riskli.
- **Veri seti yılı tutarsız**: `recepAyi.mjs` dataset key'i `recep-ayi-2025`, label'ı
  "Recep Ayı 2025"; `kurban-bayrami-2026.mjs` ise 2026. (specialDays/label alanlarına
  dokunulmadı.)
- **Eksik günler**: `ramazanGunleri.mjs` İbn Abbas'ın 30 günlük dua serisinin yalnız ilk
  8'ini taşıyor.
- **Belirsiz kaynak alanları**: `ORUC_NIYETI` → "fıkıh metinleri; niyet formülü geleneği";
  `HASBIYE` → "Dua ve tevekkül mecmûaları"; `BERAT_DUASI` → "Hadis-i Şerif, Süheyl b. Amr
  rivayeti"; `ATIKARRIKAB` → "İsmailağa Cemaati uygulaması"; `TEVHID_SIRK_UZAKLASMA` →
  "İmam Cafer-i Sâdık rivayeti" (2. dalga `sikinti-ya-uddeti-inde-siddeti` ile aynı sorun).
- **Aşırı tag yükü**: `ISTIGFAR` (zilhicce) kaydı 20, `SAFER_BISMILLAH_LA_YEDURRU` 14 özel
  gün etiketi taşıyor; tek kayıt neredeyse bütün özel gün setlerine giriyor.
- **Referans PDF'leri**: `docs/hisnul-muslim-index.md` hac bölümlerini içermiyor,
  `docs/el-ezkar-cilt-1-index.md` yalnız "10. HACDA OKUNACAK ZİKİRLER BÖLÜMÜ (s. 526)"
  başlığını veriyor; alt bölüm adları yok. Hac menasiki satırlarının durum adları bu yüzden
  Diyanet hac/umre rehberi kullanımına dayanıyor.

## Dalga 5 — Esmaül Hüsna

Mekanik dönüşüm: tire, şapka (â/î/û → a/i/u) ve kesme kaldırıldı; liste "El …", zikir seti "Ya …". EN başlıklar zaten aksansızdı, rule 9 sadece istisnai durumlarda uygulandı (aşağıda not sütununda belirtildi).

### esmaulHusnaTemel.mjs → esmaulHusnaTemel (99)

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| esmaul-husna-allah | Allah (C.C.) | Allah | Allah (SWT) | Allah | 5, 8, 9 | orta | — | TR kuralına paralel; EN'deki onur ifadesi (SWT) da kaldırıldı, açıkça istenmedi, ? | |
| esmaul-husna-er-rahman | Er-Rahmân | Er Rahman | Ar-Rahman | Ar-Rahman | 5, 8 | yüksek | — | tire→boşluk, â→a | |
| esmaul-husna-er-rahim | Er-Rahîm | Er Rahim | Ar-Rahim | Ar-Rahim | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-melik | El-Melik | El Melik | Al-Malik | Al-Malik | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-kuddus | El-Kuddüs | El Kuddüs | Al-Quddus | Al-Quddus | 5, 8 | yüksek | — | ü şapka değil, korunur | |
| esmaul-husna-es-selam | Es-Selâm | Es Selam | As-Salam | As-Salam | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-mumin | El-Mü'min | El Mümin | Al-Mu'min | Al-Mu'min | 5, 8 | yüksek | — | kesme kalkar (kural örneği) | |
| esmaul-husna-el-muheymin | El-Müheymin | El Müheymin | Al-Muhaymin | Al-Muhaymin | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-aziz | El-Azîz | El Aziz | Al-Aziz | Al-Aziz | 5, 8 | yüksek | — | î→i (kural örneği) | |
| esmaul-husna-el-cebbar | El-Cebbâr | El Cebbar | Al-Jabbar | Al-Jabbar | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-mutekebbir | El-Mütekebbir | El Mütekebbir | Al-Mutakabbir | Al-Mutakabbir | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-halik | El-Hâlık | El Halık | Al-Khaliq | Al-Khaliq | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-bari | El-Bâri' | El Bari | Al-Bari' | Al-Bari' | 5, 8 | yüksek | — | â→a, kesme kalkar | |
| esmaul-husna-el-musavvir | El-Musavvir | El Musavvir | Al-Musawwir | Al-Musawwir | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-gaffar | El-Gaffâr | El Gaffar | Al-Ghaffar | Al-Ghaffar | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-kahhar | El-Kahhâr | El Kahhar | Al-Qahhar | Al-Qahhar | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-vehhab | El-Vehhâb | El Vehhab | Al-Wahhab | Al-Wahhab | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-er-rezzak | Er-Rezzâk | Er Rezzak | Ar-Razzaq | Ar-Razzaq | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-fettah | El-Fettâh | El Fettah | Al-Fattah | Al-Fattah | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-alim | El-Alîm | El Alim | Al-'Alim | Al-'Alim | 5, 8 | yüksek | — | î→i (kural örneği) | |
| esmaul-husna-el-kabid | El-Kâbıd | El Kabıd | Al-Qabid | Al-Qabid | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-basit | El-Bâsıt | El Basıt | Al-Basit | Al-Basit | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-hafid | El-Hâfıd | El Hafıd | Al-Khafid | Al-Khafid | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-er-rafi | Er-Râfi | Er Rafi | Ar-Rafi | Ar-Rafi | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-muiz | El-Mu'ız | El Muiz | Al-Mu'izz | Al-Mu'izz | 5, 8 | yüksek | — | kesme kalkar (kural örneği) | |
| esmaul-husna-el-muzil | El-Müzil | El Müzil | Al-Mudhill | Al-Mudhill | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-es-semi | Es-Semî | Es Semi | As-Sami' | As-Sami' | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-basir | El-Basîr | El Basir | Al-Basir | Al-Basir | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-hakem | El-Hakem | El Hakem | Al-Hakam | Al-Hakam | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-adl | El-Adl | El Adl | Al-'Adl | Al-'Adl | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-latif | El-Latîf | El Latif | Al-Latif | Al-Latif | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-habir | El-Habîr | El Habir | Al-Khabir | Al-Khabir | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-halim | El-Halîm | El Halim | Al-Halim | Al-Halim | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-azim | El-Azîm | El Azim | Al-'Azim | Al-'Azim | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-gafur | El-Gafûr | El Gafur | Al-Ghafur | Al-Ghafur | 5, 8 | yüksek | — | û→u | |
| esmaul-husna-es-sekur | Eş-Şekûr | Eş Şekur | Ash-Shakur | Ash-Shakur | 5, 8 | yüksek | — | û→u | |
| esmaul-husna-el-aliyy | El-Aliyy | El Ali | Al-'Aliyy | Al-'Aliyy | 5, 8 | yüksek | — | çift y kalkar (kural örneği) | |
| esmaul-husna-el-kebir | El-Kebîr | El Kebir | Al-Kabir | Al-Kabir | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-hafiz | El-Hafîz | El Hafiz | Al-Hafiz | Al-Hafiz | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-mukit | El-Mukît | El Mukit | Al-Muqit | Al-Muqit | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-hasib | El-Hasîb | El Hasib | Al-Hasib | Al-Hasib | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-celil | El-Celîl | El Celil | Al-Jalil | Al-Jalil | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-kerim | El-Kerîm | El Kerim | Al-Karim | Al-Karim | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-er-rakib | Er-Rakîb | Er Rakib | Ar-Raqib | Ar-Raqib | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-mucib | El-Mucîb | El Mucib | Al-Mujib | Al-Mujib | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-vasi | El-Vâsi | El Vasi | Al-Wasi' | Al-Wasi' | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-hakim | El-Hakîm | El Hakim | Al-Hakim | Al-Hakim | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-vedud | El-Vedûd | El Vedud | Al-Wadud | Al-Wadud | 5, 8 | yüksek | — | û→u | |
| esmaul-husna-el-mecid | El-Mecîd | El Mecid | Al-Majid | Al-Majid | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-bais | El-Bâis | El Bais | Al-Ba'ith | Al-Ba'ith | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-es-sehid | Eş-Şehîd | Eş Şehid | Ash-Shahid | Ash-Shahid | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-hakk | El-Hakk | El Hakk | Al-Haqq | Al-Haqq | 5, 8 | orta | — | Opus review: mekanik dönüşümde ünsüz ikizleşmesine dokunulmaz (El Hayy, El Berr, Ed Darr, El Afüvv ile tutarlı) → "El Hakk". "El Hak" tercih ederseniz onay sütununa yazın, ? | |
| esmaul-husna-el-vekil | El-Vekîl | El Vekil | Al-Wakil | Al-Wakil | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-kaviyy | El-Kaviyy | El Kavi | Al-Qawiyy | Al-Qawiyy | 5, 8 | yüksek | — | çift y kalkar (kural örneği) | |
| esmaul-husna-el-metin | El-Metîn | El Metin | Al-Matin | Al-Matin | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-veliyy | El-Veliyy | El Veli | Al-Waliyy | Al-Waliyy | 5, 8 | yüksek | — | çift y kalkar (kural örneği) | |
| esmaul-husna-el-hamid | El-Hamîd | El Hamid | Al-Hamid | Al-Hamid | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-muhsi | El-Muhsî | El Muhsi | Al-Muhsi | Al-Muhsi | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-mubdi | El-Mübdi | El Mübdi | Al-Mubdi | Al-Mubdi | 5, 8 | yüksek | — | tire→boşluk, şapka yok | |
| esmaul-husna-el-muid | El-Muîd | El Muid | Al-Mu'id | Al-Mu'id | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-muhyi | El-Muhyî | El Muhyi | Al-Muhyi | Al-Muhyi | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-mumit | El-Mümît | El Mümit | Al-Mumit | Al-Mumit | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-hayy | El-Hayy | El Hayy | Al-Hayy | Al-Hayy | 5, 8 | yüksek | — | tire→boşluk, çift y korunur (kural örneği) | |
| esmaul-husna-el-kayyum | El-Kayyûm | El Kayyum | Al-Qayyum | Al-Qayyum | 5, 8 | yüksek | — | û→u | |
| esmaul-husna-el-vacid | El-Vâcid | El Vacid | Al-Wajid | Al-Wajid | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-macid | El-Mâcid | El Macid | Al-Maajid | Al-Maajid | 5, 8 | yüksek | — | â→a; EN "Maajid" makron değil, dokunulmadı | |
| esmaul-husna-el-vahid | El-Vâhid | El Vahid | Al-Wahid | Al-Wahid | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-es-samed | Es-Samed | Es Samed | As-Samad | As-Samad | 5, 8 | yüksek | — | tire→boşluk, şapka yok | |
| esmaul-husna-el-kadir | El-Kâdir | El Kadir | Al-Qadir | Al-Qadir | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-muktedir | El-Muktedir | El Muktedir | Al-Muqtadir | Al-Muqtadir | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-mukaddim | El-Mukaddim | El Mukaddim | Al-Muqaddim | Al-Muqaddim | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-muahhir | El-Muahhir | El Muahhir | Al-Mu'akhkhir | Al-Mu'akhkhir | 5, 8 | yüksek | — | tire→boşluk, şapka yok | |
| esmaul-husna-el-evvel | El-Evvel | El Evvel | Al-Awwal | Al-Awwal | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-ahir | El-Âhir | El Ahir | Al-Akhir | Al-Akhir | 5, 8 | yüksek | — | Â→A (kural örneği) | |
| esmaul-husna-ez-zahir | Ez-Zâhir | Ez Zahir | Az-Zahir | Az-Zahir | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-batin | El-Bâtın | El Batın | Al-Batin | Al-Batin | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-vali | El-Vâlî | El Vali | Al-Wali | Al-Wali | 5, 8 | yüksek | — | â→a, î→i | |
| esmaul-husna-el-muteali | El-Müteâlî | El Müteali | Al-Muta'ali | Al-Muta'ali | 5, 8 | yüksek | — | â→a, î→i | |
| esmaul-husna-el-berr | El-Berr | El Berr | Al-Barr | Al-Barr | 5, 8 | yüksek | — | tire→boşluk, şapka yok | |
| esmaul-husna-et-tevvab | Et-Tevvâb | Et Tevvab | At-Tawwab | At-Tawwab | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-muntekim | El-Müntekim | El Müntekim | Al-Muntaqim | Al-Muntaqim | 5, 8 | yüksek | — | tire→boşluk | |
| esmaul-husna-el-afuvv | El-Afüvv | El Afüvv | Al-Afuww | Al-Afuww | 5, 8 | yüksek | — | tire→boşluk, ü şapka değil | |
| esmaul-husna-er-rauf | Er-Raûf | Er Rauf | Ar-Ra'uf | Ar-Ra'uf | 5, 8 | yüksek | — | û→u | |
| esmaul-husna-malik-ul-mulk | Mâlik-ül Mülk | Malikül Mülk | Malik al-Mulk | Malik al-Mulk | 5, 8 | yüksek | — | â→a, tire kalkar ve "-ül" eke birleşir (kural örneği) | |
| esmaul-husna-zul-celali-vel-ikram | Zül-Celâli vel İkrâm | Zül Celali vel İkram | Dhul-Jalali wal-Ikram | Dhul-Jalali wal-Ikram | 5, 8 | yüksek | — | â→a, Â→A, tire→boşluk (kural örneği) | |
| esmaul-husna-el-muksit | El-Muksit | El Muksit | Al-Muqsit | Al-Muqsit | 5, 8 | yüksek | — | tire→boşluk, şapka yok | |
| esmaul-husna-el-cami | El-Câmi | El Cami | Al-Jami' | Al-Jami' | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-el-ganiyy | El-Ganiyy | El Gani | Al-Ghani | Al-Ghani | 5, 8 | yüksek | — | çift y kalkar (kural örneği) | |
| esmaul-husna-el-mugni | El-Mugnî | El Muğni | Al-Mughni | Al-Mughni | 5, 8 | orta | — | î→i; ayrıca "Mugni"→"Muğni" (ğ eklendi), zikir setindeki "Ya Muğnî" ile kök tutarlılığı için (kural E), ? | |
| esmaul-husna-el-mani | El-Mâni | El Mani | Al-Mani' | Al-Mani' | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-ed-darr | Ed-Dârr | Ed Darr | Ad-Darr | Ad-Darr | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-en-nafi | En-Nâfi | En Nafi | An-Nafi' | An-Nafi' | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-en-nur | En-Nûr | En Nur | An-Nur | An-Nur | 5, 8 | yüksek | — | û→u | |
| esmaul-husna-el-hadi | El-Hâdî | El Hadi | Al-Hadi | Al-Hadi | 5, 8 | yüksek | — | â→a, î→i | |
| esmaul-husna-el-bedi | El-Bedî | El Bedi | Al-Badi' | Al-Badi' | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-el-baki | El-Bâkî | El Baki | Al-Baqi | Al-Baqi | 5, 8 | yüksek | — | â→a, î→i | |
| esmaul-husna-el-varis | El-Vâris | El Varis | Al-Warith | Al-Warith | 5, 8 | yüksek | — | â→a | |
| esmaul-husna-er-resid | Er-Reşîd | Er Reşid | Ar-Rashid | Ar-Rashid | 5, 8 | yüksek | — | î→i | |
| esmaul-husna-es-sabur | Es-Sabûr | Es Sabur | As-Sabur | As-Sabur | 5, 8 | yüksek | — | û→u | |

Değişmeyen: 0 kayıt (bu listede tüm 99 ismin TR başlığında tire olduğu için hepsi tabloya girdi).

### esmaulHusnaTemel.mjs → esmaRizikBereket (10)

| key | eski TR | yeni TR | eski EN | yeni EN | kural | güven | eklenecek tag | not/dayanak | onay |
|---|---|---|---|---|---|---|---|---|---|
| esma-ya-vehhab | Ya Vehhâb | Ya Vehhab | Ya Wahhab | Ya Wahhab | 5, 8 | yüksek | — | â→a | |
| esma-ya-rezzak | Ya Rezzâk | Ya Rezzak | Ya Razzaq | Ya Razzaq | 5, 8 | yüksek | — | â→a | |
| esma-ya-fettah | Ya Fettâh | Ya Fettah | Ya Fattah | Ya Fattah | 5, 8 | yüksek | — | â→a | |
| esma-ya-gani | Ya Ganî | Ya Gani | Ya Ghani | Ya Ghani | 5, 8 | yüksek | — | î→i; liste kökü "El Gani" ile tutarlı | |
| esma-ya-mugni | Ya Muğnî | Ya Muğni | Ya Mughni | Ya Mughni | 5, 8 | orta | — | î→i; liste kökü "El Muğni" olarak güncellendi (bkz. üst tablo), ? | |
| esma-ya-basit | Ya Bâsıt | Ya Basıt | Ya Basit | Ya Basit | 5, 8 | yüksek | — | â→a; liste kökü "El Basıt" ile tutarlı | |
| esma-ya-kerim | Ya Kerîm | Ya Kerim | Ya Karim | Ya Karim | 5, 8 | yüksek | — | î→i | |
| esma-ya-malikel-mulk | Ya Mâlikül Mülk | Ya Malikel Mülk | Ya Malikul Mulk | Ya Malikal Mulk | 5, 8, 9 | orta | — | nameArabic (يَا مَالِكَ الْمُلْكِ) ve mevcut transliteration.tr/en alanları ("Yâ Mâlikel Mülk" / "Ya Malikal Mulk") vokatif hal "-el" biçimini destekliyor; "-ül" (liste formu) yerine "-el" seçildi, TR ve EN ikisi de buna göre düzeltildi, ? | |

Değişmeyen: 2 kayıt (esma-ya-melik: "Ya Melik"/"Ya Malik" zaten sade; esma-ya-mutekebbir: "Ya Mütekebbir"/"Ya Mutakabbir" zaten sade, ü şapka değil).

### Dalga 5 — Özet

- esmaulHusnaTemel: 99 kayıt → 99 öneri, 0 değişmeyen.
- esmaRizikBereket: 10 kayıt → 8 öneri, 2 değişmeyen.
- Toplam: 109 kayıt, 107 öneri satırı, 2 değişmeyen.
- "?" ile işaretlenen (elle onay gereken) satırlar:
  - `esmaul-husna-allah` — EN'de "(SWT)" kaldırıldı, TR kuralına paralel yapıldı ama açıkça istenmemişti.
  - `esmaul-husna-el-hakk` — "El Hak" mı "El Hakk" mı belirsiz, yaygın kullanım seçildi.
  - `esmaul-husna-el-mugni` — "Mugni" yerine "Muğni" (ğ eklendi), zikir setiyle kök tutarlılığı için.
  - `esma-ya-mugni` — yukarıdaki kök değişikliğine bağlı.
  - `esma-ya-malikel-mulk` — "Malikül Mülk" yerine "Malikel Mülk" (vokatif hal), hem TR hem EN düzeltildi.

### Dalga 5 — Kalibrasyon soruları

60. **Ünsüz ikizleşmesi tutarlılığı.** Kaynak veride "-iyy" ile biten isimler sadeleştirildi
    (El Ali, El Kavi, El Veli, El Gani), diğer ikiz ünsüzler korundu (El Hakk, El Hayy, El Berr,
    Ed Darr, El Afüvv). "El Ali" yerine "El Aliyy" mi tercih edilir?
61. **Muiz / Muizz.** 99'luk listede kaynak "El-Mu'ız" → "El Muiz"; 2. dalgada
    `sikinti-ya-muizz` kaynak "Yâ Muizz" → "Ya Muizz". Aynı isim iki yazımla kalıyor; tek biçim seçilmeli
    (Opus önerisi: ikisi de "Muiz").
62. **"Allah (SWT)" → "Allah"** EN başlıkta onur ifadesi TR'deki "(C.C.)" ile paralel kaldırıldı. Kabul mü?
63. **"El Mugni" → "El Muğni"** zikir setindeki "Ya Muğni" ile kök tutarlılığı için ğ eklendi. Kabul mü?
64. **"Ya Malikül Mülk" → "Ya Malikel Mülk"** nida kalıbında Arapça metin "mâlike" okunuyor; liste biçimi
    "Malikül Mülk" kalıyor. Kabul mü, yoksa ikisi de "Malikül Mülk" mü olsun?

---

## Özet

**Genel toplam (5 dalga): 541 kayıt → 515 öneri, 26 değişmeyen.** Dalga 1: 84/82 · Dalga 2: 81/79 · Dalga 3: 171/162 · Dalga 4: 96/85 · Dalga 5: 109/107. Dalga 3-5 özetleri kendi bölümlerinin sonunda.

| Dosya | Kayıt | Öneri | Değişmeyen |
|---|---|---|---|
| sabahZikirleri.mjs | 22 | 22 | 0 |
| aksamZikirleri.mjs | 7 | 6 | 1 |
| uyku-uyanis.mjs | 9 | 9 | 0 |
| yemekDualari.mjs | 7 | 7 | 0 |
| evGirisCikis.mjs | 7 | 6 | 1 |
| gunlukSunnetDualari.mjs | 8 | 8 | 0 |
| gunlukTesbih.mjs | 3 | 3 | 0 |
| ezanDualari.mjs | 4 | 4 | 0 |
| keffaretulMeclis.mjs | 2 | 2 | 0 |
| ozluSunnetDualari.mjs | 15 | 15 | 0 |
| **Toplam** | **84** | **82** | **2** |
| *— Dalga 2 —* | | | |
| namazDualari.mjs | 16 | 16 | 0 |
| namazSonrasiZikir.mjs | 3 | 3 | 0 |
| vitrKunutu.mjs | 4 | 4 | 0 |
| istihareDuasi.mjs | 2 | 2 | 0 |
| tovbeIstigfar.mjs | 5 | 5 | 0 |
| salavat.mjs | 14 | 13 | 1 |
| mubinDuasi.mjs | 1 | 0 | 1 |
| imanSaglamligi.mjs | 4 | 4 | 0 |
| kaygiKriz.mjs | 32 | 32 | 0 |
| **Dalga 2 toplamı** | **81** | **79** | **2** |
| **Genel toplam** | **165** | **161** | **4** |

Güven dağılımı: yüksek 52, orta 27, düşük 3.

Güven dağılımı (Dalga 1): yüksek 52, orta 27, düşük 3.
Güven dağılımı (Dalga 2): yüksek 50, orta 28, düşük 1.

Not: `istihare-allahümme-estehiruke` ve `sikinti-insirah-suresi` satırlarında TR başlık
değişmiyor, yalnız EN düzeltildi; bu yüzden "Değişmeyen" değil "Öneri" sayıldılar.

---

## Kalibrasyon soruları

> **Karara bağlananlar (2026-09-21, kullanıcı):**
> **1** → sınır ~50 karakter; 50'yi aşan tek kayıt `tesbih-bedevi-compound` (54) satır onayında elle kısaltılacak.
> **2, 3, 4** → ajanın yorumu onaylandı: en meşhur kayıt yalın adı alır, diğerleri uzatılmış başlangıç; "Durum: başlangıç" yalnız durum adı özel isim kadar kısaysa; bileşik kayıtta en meşhur bölüm başlık olabilir.
> **6** → TR'de kesme yalnız okunuşu bozan yerde kalır (üç satır güncellendi); EN'de kesme korunur.
> **14** → iki formül, iki başlangıç: Tevbe 129 → "Hasbiyallahu la ilahe illa hu"; Al-i İmran 173 → "Hasbünallahu ve nimel vekil"; "hasbiyallah"/"hasbiye" tag.
> **15** → Türkçeleşmiş kelimeler de şapkasız yazılır, yerleşik ad kullanılır ("Rüku Tesbihi", "Secde Tesbihi" — iki satır güncellendi).
> **17** → durum adı gerçek bir duruma aitse kalır; yalnız tematik koleksiyona konmuş kopya duanın kendi yalın adını alır (ajanın 2. dalga uygulaması onaylandı).
> Açık kalanlar satır bazlı: **5, 7–13, 16, 18–22** — ilgili satırın `onay` sütununda yanıtlanabilir.

1. **40 karakter sınırı, "Allahümme inni" kalıbında sistematik olarak aşılıyor.**
   `Allahümme inni euzü bike` 24, `Allahümme inni eselüke` 22 karakter; ayırt edici kelimeye
   uzatınca 42-54 çıkıyor. Aşan 8 başlık: sabah-mulk-kibriya-azamet (46),
   sabah-mulk-rabbilalemin (46), tesbih-subhanallahil-azim-ve-bihamdihi (44),
   tesbih-bedevi-compound (54), ozlu-yaptigim-yapmadim-serian (44),
   ozlu-nimetin-zevalinden-siginma (44), ozlu-peygamber-dualari-tum-ozeti (43),
   ozlu-hayrin-hepsi-serrin-hepsi (42).
   Seçenekler: **(a)** bu kalıpta sınırı ~50'ye çek (önerim), **(b)** ortak öneki düşür
   ("Euzü bike min şerri ma amiltü"), **(c)** tamlamayı ortasından kes
   ("Allahümme inni euzü bike min zevali").

2. **Önek çakışması: aynı sözlerle başlayan farklı dualar.**
   "Sübhanallahi ve bihamdihi" üç kayıtta (sabah-subhanallah-bihamdihi,
   sabah-subhane-la-kuvvete, tesbih-subhanallahil-azim); "La ilahe illallahu vahdehu la
   şerike leh" üç kayıtta; "Allahümme inni euzü bike minel aczi" iki kayıtta;
   "Asbahna ve asbahal mülkü lillahi" iki kayıtta.
   Kural 2'nin "en meşhuru yalın adı alır, diğerleri uzatılır" tie-break'ini kural 3
   çakışmalarında da uyguladım. Onaylanıyor mu?

3. **Bileşik kayıtlarda başlık hangi bölümden alınır?**
   Kural 3 "başlangıç sözleri" diyor ama bazı kayıtlar birden çok duayı topluyor:
   ozlu-takva-nesip-faydali-ilim (üç dua; başlangıcı başka kayıtla çakışıyor →
   en meşhur ikinci bölümü aldım), uyanis-bismike-ahya-hamd (yatarken + uyanınca),
   sabah-mumin-ayetulkursi (Mümin 1-3 + Ayetel Kürsi),
   sabah-euzu-billahis-semii-hasr (euzü + Haşr son üç ayet).
   Kural 3'e "bileşik kayıtta en meşhur bölüm başlık olabilir" istisnası eklenecek mi?

4. **Aynı durumda birden çok dua: diğerleri "Durum Adı: başlangıç" mı, yalın başlangıç mı?**
   "Yemekten sonra" durumunda üç kayıt var. En meşhuruna yalın durum adını
   ("Yemekten Sonra Okunan Dua"), diğer ikisine yalın başlangıç sözlerini verdim —
   "Yemekten Sonra Okunan Dua: Elhamdülillahi kesiren" biçimini kullanmadım, çünkü
   kural 2'deki örnek ("İftar Duası: Zehebez zameu") özel adı olan bir duruma aitti,
   burada durum adı tarif. Onaylanıyor mu?

5. **Şapka kalkınca uzun ünlüsü kaybolan kelimeler.**
   "Radîtü" → "Raditü", "Ğufrânek" → "Gufranek", "Sübhânallâh" → "Sübhanallah".
   "Raditü" okunuşu bozuyor mu; "Radıytü" gibi ünlüyü koruyan halk imlası tercih edilir mi?

6. **Hemze/ayn kesmesi kalkınca oluşan çift ünlüler.**
   "se'eleke" → "seeleke", "vada'tü" → "vadatü", "a'innî" → "ainni", "fec'eti" → "feceti".
   "eselüke" onaylıydı; "seeleke" ve "vadatü" de kabul mü?
   Ayrıca: **EN başlıklarda kesme korunsun mu?** Şu an koruyorum
   ("as'aluka", "a'udhu", "Al-Mu'awwidhatayn", "Kaffarat al-Majlis") çünkü İngilizce
   İslami literatürde standart. TR ile simetri isteniyorsa EN'de de kalkar.

7. **"Rabbena atina" yeterince ayırt edici mi?**
   Kehf 10 "Rabbena atina min ledünke rahmeten" sonraki dalgalarda çıkarsa çakışacak.
   Şimdiden "Rabbena atina fiddünya haseneten" (32 kr) yapılsın mı?

8. **aksam-ezan-duasi ile ezan-kamet-arasi-serbest-dua aynı metni taşıyor**
   ("Allahümme (inne) haza ikbalü leylike ve idbaru neharik"). Kural 6 "aynı dua = aynı ad"
   diyor ama ikinci kaydın konusu dua değil, duanın kabul vakti. Farklı adlandırdım
   (biri kural 3, biri kural 2). Onaylanıyor mu, yoksa ikisi de aynı adı mı almalı?

9. **Aynı zikrin iki rivayeti: tehlil.**
   aksam-namaz-tehlil ("yuhyi ve yümit" fazlasıyla) ile uyanis-tehlil-gece-af metni
   neredeyse aynı. İkisini de durum adıyla bıraktım ("Akşam Namazı Sonrası Tehlil",
   "Gece Uyanınca Okunan Tehlil"). Kural 6 ihlali sayılır mı, yoksa durum farkı yeterli mi?

10. **"Haşr Suresi Son Üç Ayet" mi, "Hüvallahüllezi" mi?**
    İlkini seçtim (Türkiye'de daha yaygın anılış), "hüvallahüllezi" ve "lev enzelna"yı
    tag önerdim. Ters tercih isteniyorsa satır değişir.

11. **"Hz. Fatıma Tesbihi" (uyku-tesbih-33-34).**
    Hadis teşhisi kesin (Buhârî 6318 / Müslim 2727 = Hz. Fatıma'nın hizmetçi talebi).
    Tereddüt Türkiye'deki adın yaygınlığında: "tesbihat" çoğunlukla namaz sonrasını
    çağrıştırıyor. Alternatif kural 2 adı: "Yatmadan Önce Okunan Tesbih".
    Not: `docs/` altındaki Hısnu'l-Muslim ve El-Ezkar PDF'leri artık repoda yok,
    yalnız index dosyaları var; bu maddeyi PDF'den doğrulayamadım.

12. **"Nur Duası" (cami-giris-nur-duasi).**
    Yerleşik ad sayıp kural 1 uyguladım. Hısnu'l-Muslim bölüm adı ise "Camiye Giderken".
    Alternatif: "Camiye Giderken Okunan Dua" (kural 2). Hangisi?

13. **"Bakiyatı Salihat" (tesbih-dortlu-zikir) başlık mı, tag mi?**
    Dört kelimenin literatürdeki adı "el-bâkıyâtü's-sâlihât", ama bazı rivayetlerde
    beşinci olarak "la havle" de sayılıyor; bu yüzden kural 1'e güvenmeyip kural 3'e
    düştüm ve adı tag olarak önerdim. Başlık olması isteniyor mu?

14. **aksam-hasbiyallah'ın yalın adı bütün dalgaları bağlar.**
    Envanter bu duanın 8 farklı adla tekrar ettiğini söylüyor (2. ve 3. dalgada çıkacak).
    Burada "Hasbiyallahu la ilahe illa hu" önerdim. Kısa "Hasbiyallah" tercih edilirse
    şimdi karara bağlanmalı; sonraki dalgalarda geriye dönük düzeltme gerekir.

### Dalga 2

Yalnız yeni ve gerçekten karar gerektiren maddeler. Karara bağlanmış konular (1-4, 6, 14)
tekrar sorulmuyor; 5, 7-13 hâlâ satır bazlı açık.

15. **Türkçeleşmiş Arapça kelimelerde şapka yasağı.**
    Kural 8 başlıktan â/î/û'yu kaldırıyor. Bu yüzden Türkiye'deki en yerleşik iki ad —
    "Rükû Tesbihi" ve "Secde Tesbihi" — kullanılamadı ("Ruku Tesbihi" yanlış okunuyor);
    `namaz-ruku-subhane-rabbiyel-azim` ve `namaz-secde-subhane-rabbiyel-ala` kural 3'e
    düşürülüp adlar tag'e alındı. TDK imlasında şapka taşıyan Türkçeleşmiş kelimeler
    (rükû, kâtip, âdet) için kural 8'e istisna açılsın mı? Açılırsa iki satır kural 1'e döner.

16. **Ortak önek 50 karakteri dolduruyor, ayırt edici kelimeye ulaşılamıyor.**
    İki satır: `namaz-selamdan-once-kesel-magram-istiaze` — 1. dalga
    `sabah-keseli-heremi-sıgınma` başlığından yalnız "fe" ile ayrılıyor, ayırt edici
    kelimeye uzatmak 51 kr ediyor. `DELAIL_HAYRAT` — salavat mecmuası öneki tek başına
    40 kr, ayırt edici cümleye ("salaten tadilü cemia salevati") yer kalmıyor.
    Seçenekler: **(a)** bu iki satırda ortak öneki düşür ("Minel keseli vel heremi vel
    me'semi", "Salaten tadilü cemia salevati"), **(b)** yalnız bu satırlarda 50'yi aş,
    **(c)** olduğu gibi bırak (mevcut öneri).

17. **Birebir aynı metnin iki kayıtta farklı adlandırılması.**
    Üç çift: `istigfar-rabbigfirli` ↔ 1. dalga `meclis-istigfar-100`;
    `iman-suphe-euzu-billah` ↔ `iman-namaz-vesvese-euzu`;
    `RUYADA_GORME_SALAVATI` ↔ `SABAN_SALAVATI`.
    Kural 6 "aynı dua = aynı ad" diyor; ben durum/bağlam farkını koruyup ayrı adlandırdım
    (1. dalga kalibrasyon 9'daki tercihle aynı yönde). Kabul mü, yoksa her çift tek ad mı
    almalı? Tek ad denirse `meclis-istigfar-100` 1. dalga satırı da değişir.

18. **Salavat adlarında ek ve nisbe biçimi.**
    "Salât-ı" mı "Salavât-ı" mı, "-iye" mi "-iyye" mi. Seçimim: Salatı Tefriciyye,
    Salatı Münciyye, Salatı Kemaliyye, Salatı Fatih, Salavatı Şerife, Salavatı İbrahimiyye,
    Nuru Zatiyye Salavatı (yaygın kullanımı izledim; terkip tiresi kural 8 ile kalktı).
    Tek biçime indirilsin mi?

19. **`SALAVAT-I ŞERİFE` kaydının adı.**
    Metin standart kısa salavat, eski başlık "Mevlid Salavatı" idi. Yalın "Salavatı Şerife"
    adını bu kayda verdim, "mevlid salavatı"nı tag'e aldım; eski adı "Salavat-ı Şerife" olan
    `SELLIM_BARIK` başlangıç sözlerine düştü. Ters tercih isteniyor mu?

20. **`mubin-duasi-tesbih` gerçekten "Mübin Duası" mı?**
    Kaynak alanı yalnız "Dua mecmuaları". Metin ("Sübhanel müneffisi an külli medyun…
    Ya müferricü ferric anni") mecmualarda "Ferec duası" ve "Sübhânel-müneffis" adlarıyla da
    geçiyor. Adı doğrulayamadığım için başlığı değiştirmedim. Ad doğru mu, ikinci ad tag
    olarak eklensin mi?

21. **`sikinti-ya-hayyu-ya-kayyum` 1. dalga `sabah-ya-hayyu-kayyum` ile aynı başlığı alacak.**
    Metin aynı hadisin kısaltılmışı; kural 6 gereği ikisine de "Ya Hayyu Ya Kayyum" verdim.
    Listede iki kayıt aynı adla görünecek. Kabul mü, yoksa sıkıntı kaydı
    "Ya Hayyu Ya Kayyum birahmetike esteğisü" (39 kr) mi olsun?

22. **`namaz-sonrasi-33-tesbih-paketi` = "Namaz Tesbihatı" mı?**
    Türkiye'de "tesbihat" camide Ayetel Kürsi + 33'lükler + duayı birlikte çağrıştırıyor;
    kayıt yalnız 33'lükler ve tehlilden oluşuyor (Ayetel Kürsi ayrı kayıt).
    Alternatif: "Namaz Sonrası Tesbih" (kural 2).

### Birleştirme sonrası otomatik kural 6 kontrolü (Opus)

541 kaydın Arapça metni `canonicalKeyFromArabic` ile gruplanıp önerilen başlıklarla karşılaştırıldı.
Aynı metne farklı başlık verilen yalnız 6 grup çıktı; 4'ü kalibrasyon 17 kararındaki gerçek-durum
istisnası (meclis, konaklama, öfke/vesvese/iman şüphesi istiazesi, Arefe/gece tehlili). Kalan ikisi karar ister:

65. **`ozlu-hz-davudun-sevgi-duasi` "Hz. Davud'un Sevgi Duası" ↔ `evlilik-hubbeke-muaz` "Allahümme inni eselüke hubbeke".**
    Arapça metin birebir aynı, ikisi de durum duası değil → kural 6 gereği tek ad almalı.
    Opus önerisi: ikisi de "Hz. Davud'un Sevgi Duası" (Tirmizî 3490), "allahümme inni eselüke hubbeke" tag;
    `MEVLID_RAHMET` metni de aynı duaysa o da. Evlilik kaydındaki "Muâz b. Cebel" nispeti ayrıca kontrol edilmeli.
66. **`esmaul-husna-es-samed` "Es Samed" ↔ `evlat-es-samed` "Ya Samed"** (kalibrasyon 25 ile aynı konu):
    evlat kaydının Arapçası nida içermiyor; kural 5 "başlık nameArabic kalıbıyla örtüşür" diyor →
    Opus önerisi: "Es Samed".

---

## Kapsam dışı gözlemler

Bunlar başlıkla ilgili değil, yalnız nottur. Bu dalgada hiçbiri düzeltilmedi.

- **ASCII olmayan key'ler** (rename betiği key ile eşleştireceği için dikkat):
  `sabah-asbahnâ`, `sabah-keseli-heremi-sıgınma`, `sabah-vehebtü-nefsi`,
  `aksam-arş-melekleri`, `aksam-kelimâtillah`, `uyku-eslemtu-nefsî`.
- **key yazım hatası**: `ozlu-hata-cehalet-israf-magrfet` → "magrfet" muhtemelen "mağfiret".
  (Plan gereği key'lere dokunulmuyor; yalnız kayıt.)
- **transliteration yazım hatası**: `meclis-istigfar-100` içinde "Rabbicfir lî" geçiyor;
  doğrusu "Rabbiğfir lî".
- **Aynı hadis numarası iki farklı metinde**: `sabah-mulk-kibriya-azamet` ve
  `sabah-mulk-rabbilalemin` kayıtlarının ikisi de "Ebû Dâvûd, Edeb, 106 (5084)" gösteriyor,
  ama metinler farklı. Biri yanlış olmalı.
- **nameArabic ile transliteration.tr uyuşmazlığı**: `sabah-rabbiyallahu-tevekkel`
  transliterasyonunda Arapçada bulunmayan "tevekkeltü alellahi" ibaresi var.
- **İki kayıt neredeyse birebir aynı dua**: `sabah-rabbiyallahu-tevekkel` ("Rabbiyallahu...")
  ile `aksam-hasbiyallah` ("Hasbiyallahu...") — fark yalnız ilk kelime.
  Aynı şekilde `aksam-namaz-tehlil` ile `uyanis-tehlil-gece-af`.
- **Başlık içeriği tam karşılamıyor**: `sabah-euzu-billahis-semii-hasr` kaydı Haşr son üç
  ayetin yanında üç kez okunan euzü formülünü de taşıyor; başlık yalnız ayetlerden bahsediyor.
- **Eksik sabah karşılığı**: `aksam-emsena` ("Emseyna ve emsel mülkü lillah", Müslim 2723)
  ve `aksam-arş-melekleri` ("emseytü") duaların sabah varyantları veri setinde yok;
  `sabahZikirleri` içindeki "Asbahna..." kayıtları farklı metinler.
- **Eksik/kısaltılmış nameArabic**: `ezan-kamet-arasi-serbest-dua` Arapçası cümlenin
  yarısında kesiliyor; transliterasyonu parantez içi Türkçe açıklama taşıyor
  ("kişi bu vakitte kendi duasını yapar").
- **EN başlıklarda tipografik kesme** (`’`): `ozlu-peygamber-dualari-tum-ozeti` ve
  `ozlu-magfiratul-evsa`. Yeni EN önerilerinde düz ASCII kullanıldı.
- **Dalga kapsamı**: plan bu 10 dosya için "~90 kayıt" diyordu; gerçek sayı **84**.
- **Referans PDF'leri repoda yok**: `docs/hisnul-muslim-index.md` ve
  `docs/el-ezkar-cilt-*-index.md` duruyor ama işaret ettikleri PDF dosyaları silinmiş.
  Orta/düşük güvenli maddeler bu yüzden yalnız index bölüm adlarıyla doğrulanabildi.

### Dalga 2

- **ASCII olmayan key'ler**: `istihare-allahümme-estehiruke`, `istihare-allahümme-hir-li`.
- **Biçim dışı key'ler**: `salavat.mjs` içinde 11 key BÜYÜK_HARF/alt çizgi düzeninde
  (`SELLIM_BARIK`, `MUNCIYE`, `KEMALILLAHI`, `DELAIL_HAYRAT`, `NUR_ZATIYYE`,
  `SALAVAT_FATIH`, `HZ_FATIMA_SALAVATI`, `RUYADA_GORME_SALAVATI`, `TEFRICIYE_SALAVATI`,
  `SABAN_SALAVATI`), geri kalan veri kümesi kebab-case. `SALAVAT-I ŞERİFE` ayrıca
  **boşluk ve Türkçe harf** içeriyor — rename betiği key ile eşleşeceği için riskli.
- **Aynı metni taşıyan kayıt çiftleri**: `RUYADA_GORME_SALAVATI` ↔ `SABAN_SALAVATI`
  (fark yalnız "seyyidina"); `iman-suphe-euzu-billah` ↔ `iman-namaz-vesvese-euzu`
  (nameArabic birebir aynı); `istigfar-rabbigfirli` ↔ 1. dalga `meclis-istigfar-100`
  (birebir aynı).
- **Aynı tehlil iki kayıtta**: `namaz-sonrasi-33-tesbih-paketi` sonunda ve
  `namaz-sonrasi-la-ilahe-mania` başında aynı "La ilahe illallahu vahdehu…" metni var.
- **Tek kayıtta iki dua**: `vitr-kunut-iyyake-nabudu` Hanefi ilmihalindeki iki kunut
  duasını **ters sırada** (önce 2., sonra 1.) tek metinde topluyor.
- **Eski başlıkta yazım hatası**: `sikinti-ahyini-teveffeni` → "Hayır Olan Olanla Razı
  Olma Duası".
- **Metin/lafız uyuşmazlığı**: `sikinti-hasbiye-tertibi` içinde "Hasbiyallâhu ve
  ni'mel-vekîl" geçiyor; Âl-i İmrân 173 lafzı "Hasbünallâhu ve ni'mel-vekîl". Rivayet
  farkı mı yazım hatası mı, kontrol edilmeli.
- **Belirsiz kaynak alanları**: `sikinti-ya-uddeti-inde-siddeti` → "İmam Cafer-i Sadık
  Sıkıntı Duası" (hadis kaynağı yok); `sikinti-ya-allah-estagfirullah` → "Hadis Kaynakları;
  Tergîb-üs-Salât"; on esma kaydında "Esmâ-i Hüsnâ / Şifa Ekolü" — "Şifa Ekolü" bir kaynak
  değil.
- **nameArabic içinde biçim kirliliği**: `namaz-selamdan-sonra-estagfirullah-entes-selam`
  Arapçasında "(×3)" ve "—" var; `namaz-sonrasi-33-tesbih-paketi` Arapçasında "(×33)" ve
  "—" var; `vitr-selamdan-sonra-subhanelmelikil-kuddus` transliterasyonu
  "(×3, üçüncüsü uzatılır)" açıklaması taşıyor.
- **Transliterasyonda aksanlı `à`**: `salavat-ibrahimiyye`, `salavat-cuma-cok-getir`,
  `salavat-kiyamette-yakin`, `korku-topluluktan-nuhurihim` → "Allàhümme".
- **Aşırı tag yükü**: `SALAVAT-I ŞERİFE` kaydı 20 özel gün etiketi taşıyor; bu tek kayıt
  neredeyse bütün kandil/özel gün setlerine giriyor.
- **Dalga kapsamı**: plan bu 9 dosya için "~85 kayıt" diyordu; gerçek sayı **81**.
