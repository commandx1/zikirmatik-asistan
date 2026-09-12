# Retrieval Eval Raporu

- Tarih: 2026-09-12T15:40:47.629Z
- Git SHA: `c06c96f`
- runId: `2026-09-12T15-40-39-148Z`
- Locale: tr+en
- Modeller: expand=gpt-5-mini
- Dataset boyutu: 42 (çalıştırılan: 42)
- Niyet genişletme: 0 LLM çağrısı, 42 cache'ten (dataset'teki expandedQuery)
- Pipeline maliyeti: $0.0004

## Özet

| Metrik | Değer |
| --- | --- |
| Toplam vaka | 42 |
| Değerlendirilen (expectedKeys var) | 33 |
| Atlanan (expectedKeys yok) | 9 |
| hata oranı | 0% |
| mean recall@15 | 0.763 |
| hit@5 oranı | 82% |
| MRR | 0.650 |
| ortalama dupCount | 0.00 |
| gecikme p50 | 418ms |
| gecikme p95 | 1204ms |

## Baseline Karşılaştırması

Baseline rapor: `../../docs/eval/retrieval-baseline-2026-09-12.json`

### Baseline özeti

| Metrik | Değer |
| --- | --- |
| Toplam vaka | 42 |
| Değerlendirilen (expectedKeys var) | 33 |
| Atlanan (expectedKeys yok) | 9 |
| hata oranı | 0% |
| mean recall@15 | 0.712 |
| hit@5 oranı | 79% |
| MRR | 0.542 |
| ortalama dupCount | 0.71 |
| gecikme p50 | 3064ms |
| gecikme p95 | 3913ms |

### Rank değişiklikleri

| id | önce | sonra |
| --- | --- | --- |
| r002 | 15 | 8 |
| r001 | 3 | 2 |
| r003 | 2 | 1 |
| r008 | 4 | 1 |
| r011 | 2 | 1 |
| r013 | 3 | 6 |
| r018 | 3 | 1 |
| r019 | 4 | 1 |
| r020 | 1 | 2 |
| r021 | 2 | 1 |
| r027 | 4 | 2 |
| r028 | 3 | 7 |
| r031 | 7 | 13 |
| r032 | 6 | 2 |
| r035 | 13 | 4 |
| r037 | 2 | 1 |
| r039 | 1 | 3 |
| r042 | 6 | 5 |

## Vakalar

| id | input | expandedQuery | beklenen | rank | top-5 key | latency |
| --- | --- | --- | --- | --- | --- | --- |
| r002 | Allah'a şükretmek istiyorum | Allah’a şükretme, şükür ve hamd duygusun… | tesbih-subhanallahil-azim-ve-bihamdihi, esmaul-husna-es-sekur | 8 | LEKEL_HAMD, BAKIYAT_SALIHAT, KURBAN_SUKRU_DUASI, sabah-nimet-sukur, MEVLID_HAMD | 1226ms |
| r004 | sınavım var, başarı ve kolaylık için dua | sınav kaygısı, başarı, kolaylık ve zihin… | sinav-rabbisrahli-sadri, sinav-rabbi-yessir, sinav-rabbi-edhilni | 1 | sinav-rabbi-edhilni, sinav-rabbi-yessir, sinav-allahumme-la-sehle, sinav-allahumme-hirli, ozlu-takva-nesip-faydali-ilim | 456ms |
| r001 | çok kaygılıyım, içim huzursuz | yoğun kaygı, iç huzursuzluğu, gerginlik … | sikinti-insirah-suresi, sikinti-la-ilahe-illallahul-azimul-halim, sikinti-ya-selam-ya-latif-ya-vedud | 2 | sikinti-huvellezi-sekine, sikinti-ya-selam-ya-latif-ya-vedud, sikinti-inni-euzu-minel-hemmi, sikinti-allahu-allahu-rabbi, sikinti-insirah-suresi | 1717ms |
| r003 | günahlarımdan tövbe etmek istiyorum | tövbe ve istiğfar niyeti; geçmiş günahla… | SEYYIDUL_ISTIGFAR, sifa-seyyidul-istigfar, ISTIGFAR | 1 | ISTIGFAR, esmaul-husna-et-tevvab, ESTAGFIRULLAH, istigfar-gunluk, evlat-estagfirullah-el-azim-el-lezi | 1730ms |
| r005 | asdfgh123 | asdfgh123 | — | (atlandı) | sinav-bismillahi-ve-subhanellahi, tehlike-bismillah-havkale, afet-allahumme-la-tektulna-bi-gadabik, esmaul-husna-el-gaffar, SUBHANALLAH_EHAD_SAMED | 709ms |
| r006 | içim kan ağlıyor, çok üzgünüm | derin üzüntü, içsel keder ve ruhsal çökü… | sikinti-inni-abduk-ibnu-abduk, DUHA_SURESI, sikinti-ya-hayyu-ya-kayyum | 1 | sikinti-inni-abduk-ibnu-abduk, sikinti-inna-lillahi-ve-inna-ileyhi-raciun, sikinti-huvellezi-sekine, sikinti-ya-uddeti-inde-siddeti, sikinti-la-ilahe-illallahul-azimul-halim | 699ms |
| r007 | sürekli sinirleniyorum, öfkemi kontrol e… | sürekli öfke, sinirlilik ve kontrol edem… | ofke-euzubillah, ofke-rabbi-muhammed, esmaul-husna-el-halim | 3 | ofke-lokman-17, esmaul-husna-es-sabur, ofke-rabbi-muhammed, ofke-euzubillah, esmaul-husna-el-halim | 778ms |
| r008 | kendimi çok yalnız hissediyorum, kimsem … | yoğun yalnızlık, yalnız hissetme ve yaln… | esmaul-husna-el-vahid, sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi | 1 | esmaul-husna-el-vahid, sikinti-inni-abduk-ibnu-abduk, sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, barisma-ellefe-beyne-kulubihim, sikinti-la-ilahe-illallahul-azimul-halim | 443ms |
| r009 | gelecek kaygısı beni her gün eziyor, ne … | gelecek kaygısı, belirsizlik ve endişe; … | RIZIK_EBU_UMAME, sikinti-insirah-suresi, sikinti-bismillahi-ala-nefsi | 3 | sikinti-inni-euzu-minel-hemmi, sikinti-rahmeteke-ercu, sikinti-bismillahi-ala-nefsi, sikinti-ya-mumin, sikinti-inna-lillahi-ve-inna-ileyhi-raciun | 519ms |
| r011 | yatmadan önce hangi duaları okumalıyım | yatmadan önce okunacak dualar, uykudan ö… | uyku-ayetel-kursi, uyku-bismike-rabbi-yatak, uyku-tesbih-33-34 | 1 | uyku-bismike-rabbi-yatak, sikinti-ya-allah-estagfirullah, uyku-ayetel-kursi, uyanis-bismike-ahya-hamd, uyku-istigfar-kayyum | 366ms |
| r010 | sabah namazından sonra ne okumalıyım | sabah namazı sonrası okunabilecek zikirl… | namaz-sonrasi-33-tesbih-paketi, namaz-sonrasi-ayetel-kursi, sabah-subhanallah-bihamdihi | — | sabah-mulk-rabbilalemin, sabah-subhane-la-kuvvete, sabah-ihlas-muavvizeteyn, sabah-mumin-ayetulkursi, sabah-mulk-kibriya-azamet | 788ms |
| r012 | cuma günü için özel bir zikir var mı | Cuma günü yapılabilecek özel zikir, ibad… | salavat-cuma-cok-getir, SEYYIDUL_ISTIGFAR | 1 | salavat-cuma-cok-getir, SALAVAT-I ŞERİFE, rizik-fatiha-seher-41, TEFRICIYE_SALAVATI, SELLIM_BARIK | 439ms |
| r013 | hastayım, şifa bulmak için dua istiyorum | hastalık ve bedeni/manevi rahatsızlık; ş… | sifa-ezhibil-bese, sifa-eselullahel-azime, sifa-la-bese-tahur | 6 | sifa-sefallahu-sekameke, korunma-dua-i-sifa, sifa-isfi-abdek, sifa-afiyete-dunya-ahiret, sifa-uizuke-billahil-ehad | 381ms |
| r015 | yarın uzun bir yolculuğa çıkıyorum, yolc… | uzun yolculuğa çıkma; güvenli ulaşım, ka… | yolculuk-seferin-duasi, yolculuk-estevdiullah-dine, yolculuk-konaklamada | 1 | yolculuk-seferin-duasi, yolculuk-kalkisindan-dua, yolculuk-estevdiullah-dine, hac-yolculuk-binit-duasi, yolculuk-yeni-beldeyi-gorünce | 430ms |
| r014 | annem hastanede yatıyor, ona şifa duası … | annenin hastanede yatışı, sağlık sorunla… | sifa-isfi-abdek, sifa-sefallahu-sekameke, sifa-ezhibil-bese | 1 | sifa-isfi-abdek, sifa-sefallahu-sekameke, sifa-la-bese-tahur, korunma-dua-i-sifa, sifa-afiyete-dunya-ahiret | 513ms |
| r016 | evleniyorum, huzurlu ve bereketli bir ev… | evlilik niyeti, eşle uyum, huzur, sevgi,… | evlilik-rum-21, evlilik-ellif-beyne-kulubina, evlilik-furkan-74 | 2 | barisma-barekellahu-lekum, evlilik-furkan-74, evlilik-ellif-beyne-kulubina, evlilik-rum-21, evlilik-zifaf-hayra-dua | 406ms |
| r017 | çocuğum için hayırlı bir evlat olması ad… | çocuğumun ahlaklı, dindar, sağlıklı ve b… | evlat-rabbi-heb-li-mine-salihin, evlat-rabbi-heb-li-min-ledunke, evlat-rabbi-la-tezerni | 1 | evlat-rabbi-heb-li-mine-salihin, evlat-allahummecalni-zurriyyeten-tayyibeten, evlat-rabbi-heb-li-min-ledunke, evlilik-ibrahim-40-41, evlat-rabbena-heb-lena-min-ezvacina | 403ms |
| r018 | hacdayım, Safa tepesindeyim şu an ne oku… | Hac ibadeti esnasında Safa tepesi üzerin… | hac-safa-zikri, hac-safa-merve-ayeti | 1 | hac-safa-zikri, hac-safa-merve-ayeti, hac-tavaf-kabul-duasi, TEFRICIYE_SALAVATI, yolculuk-tepede-zikir | 405ms |
| r019 | umre için Kabe'yi ilk gördüğüm anda ne o… | Umre ziyareti sırasında Kâbe’yi ilk görd… | hac-mekke-hareminde, hac-tavaf-baslangic | 1 | hac-mekke-hareminde, hac-tavaf-baslangic, hac-tavaf-kabul-duasi, yolculuk-yeni-beldeyi-gorünce, hac-telbiye | 396ms |
| r020 | ramazanda iftar vaktinde okunacak dua ne… | Ramazan ayında iftar vaktinde okunacak d… | oruc-iftar-zehebez-zame, oruc-iftar-birahmetike | 2 | IFTAR_DUASI, oruc-iftar-birahmetike, oruc-iftar-zehebez-zame, yemek-iftar-ev-sahibine, RAMAZAN_GUN_1 | 424ms |
| r021 | abdest alırken hangi duayı okumalıyım | abdest alma niyeti, abdeste başlarken ok… | abdest-sonrasi-sehadet-dua | 1 | abdest-sonrasi-sehadet-dua, ozlu-huda-takva-iffet-gina, ozlu-takva-nesip-faydali-ilim, tuvalete-girmeden-once-dua, hac-zemzem-duasi | 425ms |
| r022 | huzur | iç huzuru, gönül dinginliği ve kaygı gid… | — | (atlandı) | sikinti-ya-selam-ya-latif-ya-vedud, sikinti-huvellezi-sekine, sikinti-ya-mumin, sikinti-ya-muahhir, sikinti-insirah-suresi | 468ms |
| r024 | sllsd asdasd 1234 | sllsd asdasd 1234 | — | (atlandı) | esmaul-husna-es-samed, namaz-selamdan-once-kabir-fitne-istiaze, sikinti-ya-selam-ya-latif-ya-vedud, SUBHANALLAH_EHAD_SAMED, is-yusuf-54-56-kariyer-tertibi | 397ms |
| r023 | yardım | yardım ihtiyacı, çaresizlik veya sıkıntı… | — | (atlandı) | sikinti-ya-uddeti-inde-siddeti, sikinti-inni-euzu-minel-hemmi, sikinti-ya-hayyu-ya-kayyum, sikinti-la-ilahe-illallahul-azimul-halim, sikinti-rahmeteke-ercu | 483ms |
| r025 | nasılsın | nasılsın | — | (atlandı) | sifa-la-bese-tahur, evlilik-nisa-19, aksirma-teshmit-cevabi, sifa-ezhibil-bese, esmaul-husna-el-hayy | 411ms |
| r026 | python kodu yaz bana | python kodu yaz bana | — | (atlandı) | sinav-rabbi-zidni-ilmen, sinav-rabbisrahli-sadri, afet-euzu-bi-kelimatillahit-tammati-min-serri-ma-halak, ENBIYA_83, afet-allahumme-hfazni-min-beyni-yedeyye | 399ms |
| r027 | I feel very anxious lately and can't sle… | kaygı, endişe ve uykusuzluk hali; gece h… | sikinti-insirah-suresi, uyku-ayetel-kursi, sikinti-ya-selam-ya-latif-ya-vedud | 2 | sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, sikinti-ya-selam-ya-latif-ya-vedud, sikinti-huvellezi-sekine, sikinti-ya-allah-estagfirullah, sikinti-ya-muahhir | 380ms |
| r028 | I want to thank Allah for everything He … | şükür, minnettarlık ve Allah’a verilen n… | tesbih-subhanallahil-azim-ve-bihamdihi, esmaul-husna-es-sekur | 7 | BAKIYAT_SALIHAT, KURBAN_SUKRU_DUASI, sabah-nimet-sukur, LEKEL_HAMD, MEVLID_HAMD | 392ms |
| r029 | how are you today, what's up | how are you today, what's up | — | (atlandı) | sabah-mulk-rabbilalemin, sabah-nimet-afiyet-setr, sifa-bismillahi-masaallah, sabah-nimet-sukur, sifa-afiyete-dunya-ahiret | 383ms |
| r030 | son zamanlarda hayatım çok karışık, işim… | hayatın karışıklığı, işteki sürekli bask… | sikinti-insirah-suresi, sikinti-la-ilahe-illallahul-azimul-halim, sikinti-rabbena-efrig-sabran | — | sikinti-ya-selam-ya-latif-ya-vedud, sikinti-inni-euzu-minel-hemmi, sikinti-inni-abduk-ibnu-abduk, ofke-rabbi-muhammed, sikinti-bismillahi-ala-nefsi | 409ms |
| r031 | geçen hafta işimi kaybettim, aynı gün ev… | iş kaybı, trafik kazası ve anne sağlığın… | sikinti-rabbena-efrig-sabran, RIZIK_EBU_UMAME, sikinti-hasbiye-tertibi | 13 | sikinti-inna-lillahi-ve-inna-ileyhi-raciun, evlat-rabbena-heb-lena-min-ezvacina, evlat-rabbi-inni-nezertu, cenaze-taziye-duasi, esmaul-husna-er-rahim | 469ms |
| r032 | işten kovulacağım diye çok korkuyorum, r… | iş kaybı kaygısı ve gelecek için endişe;… | is-allahumme-ikfini-bi-helalike, is-allahumme-ya-ganiyyu-ya-hamidu, is-ya-rafi-kariyer-yukselis | 2 | sikinti-inni-euzu-minel-hemmi, is-allahumme-ikfini-bi-helalike, rizik-talak-men-yettekillah, sikinti-rahmeteke-ercu, sikinti-bismillahi-ala-nefsi | 370ms |
| r033 | yeni bir eve taşınıyoruz, hayırlı ve ber… | yeni bir eve taşınma, evin hayırlı, bere… | MUMINUN_29, MESKEN_GENISLIGI, EVE_GIRERKEN_DUA | 1 | MUMINUN_29, yolculuk-sehre-girerken, EVE_GIRERKEN_DUA, yolculuk-yeni-beldeyi-gorünce, MESKEN_GENISLIGI | 394ms |
| r034 | büyük bir günah işledim, çok pişmanım, A… | büyük günah işleme sonucu yoğun pişmanlı… | SEYYIDUL_ISTIGFAR, sifa-seyyidul-istigfar, ISTIGFAR | 1 | ISTIGFAR, ozlu-magfiratul-evsa, ESTAGFIRULLAH, esmaul-husna-et-tevvab, namaz-secde-gunahlarin-bagisilmasi | 363ms |
| r035 | yarın ameliyat olacağım, çok korkuyorum,… | yarın ameliyat olacak olmanın getirdiği … | sifa-afiyete-dunya-ahiret, sifa-eselullahel-azime, sikinti-la-ilahe-illallahul-azimul-halim | 4 | sikinti-inni-euzu-minel-hemmi, sikinti-rahmeteke-ercu, sikinti-bismillahi-ala-nefsi, sifa-afiyete-dunya-ahiret, sikinti-ya-mumin | 372ms |
| r037 | gece namazına kalkmak istiyorum ama nefs… | gece namazına kalkma isteği ve nefsin ağ… | namaz-iftitah-veccehtu, vitr-kunut-hdini-fimen, sikinti-ya-allah-estagfirullah | 1 | sikinti-ya-allah-estagfirullah, uyanis-bismike-ahya-hamd, sabah-keseli-heremi-sıgınma, ozlu-takva-nesip-faydali-ilim, uyku-istigfar-kayyum | 395ms |
| r038 | eşimle aramız son zamanlarda bozuk, evim… | eşle ilgili anlaşmazlık, iletişim kopukl… | evlilik-nisa-19, evlilik-ellif-beyne-kulubina, evlilik-nisa-128 | 1 | evlilik-ellif-beyne-kulubina, barisma-barekellahu-lekum, evlilik-furkan-74, evlilik-rum-21, evlilik-nisa-128 | 439ms |
| r036 | sürekli kabuslar görüyorum, uykularım ka… | sürekli kabuslar, uykusuzluk ve gece kor… | uyku-ayetel-kursi, sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, korunma-muavvizeteyn-felak-nas | 1 | sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, SEYTANDAN_SIGINMA, sikinti-ya-allah-estagfirullah, uyku-bismike-rabbi-yatak, sikinti-inni-euzu-minel-hemmi | 760ms |
| r039 | bugün küçük ama benim için çok kıymetli … | yaşanan küçük ama kişisel mucize için de… | tesbih-subhanallahil-azim-ve-bihamdihi, esmaul-husna-es-sekur, sabah-nimet-sukur | 3 | BAKIYAT_SALIHAT, KURBAN_SUKRU_DUASI, esmaul-husna-es-sekur, LEKEL_HAMD, sabah-nimet-sukur | 468ms |
| r040 | asdkjaslkdjaslkdj | asdkjaslkdjaslkdj | — | (atlandı) | KEMALILLAHI, cami-giris-cikis-besmele-salavat, namaz-selamdan-once-kesel-magram-istiaze, SAFER_GIRISI_DUASI, IHLAS | 370ms |
| r041 | dua | dua, Allah’a yönelme ve istediğini dilem… | — | (atlandı) | namaz-iki-secde-arasi-rabbigfir, ozlu-kalpleri-yonlendiren, ozlu-bagisla-merhamet-afiyet-rizik, zina-korunma-huda-tukâ-afaf-gına, istihare-allahümme-estehiruke | 398ms |
| r042 | kurban bayramı arefe gününde hangi zikir… | Kurban Bayramı arefe günü, ibadet ve sev… | VAHDEHU_LA, hac-arefe-zikri, TESRIK_TEKBIRI | 5 | ESTAGFIRULLAH, ISTIGFAR, KURBAN_SUKRU_DUASI, SUBHANALLAHI_VE_BIHAMDIHI, hac-arefe-zikri | 357ms |
