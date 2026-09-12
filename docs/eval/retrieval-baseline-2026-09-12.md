# Retrieval Eval Raporu

- Tarih: 2026-09-12T14:36:40.267Z
- Git SHA: `c06c96f`
- runId: `2026-09-12T14-35-53-910Z`
- Locale: tr+en
- Modeller: expand=gpt-5-mini
- Dataset boyutu: 42 (çalıştırılan: 42)
- Niyet genişletme: 42 LLM çağrısı, 0 cache'ten (dataset'teki expandedQuery)
- Pipeline maliyeti: $0.0143

## Özet

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

## Vakalar

| id | input | expandedQuery | beklenen | rank | top-5 key | latency |
| --- | --- | --- | --- | --- | --- | --- |
| r002 | Allah'a şükretmek istiyorum | Allah’a şükretme, şükür ve hamd duygusun… | tesbih-subhanallahil-azim-ve-bihamdihi, esmaul-husna-es-sekur | 15 | namaz-selamdan-once-zikredinme-yardim, LEKEL_HAMD, ISTIGFAR, KURBAN_SUKRU_DUASI, LA_MANIA_LIMA_ATAYTE | 3754ms |
| r001 | çok kaygılıyım, içim huzursuz | yoğun kaygı, iç huzursuzluğu, gerginlik … | sikinti-insirah-suresi, sikinti-la-ilahe-illallahul-azimul-halim, sikinti-ya-selam-ya-latif-ya-vedud | 3 | sikinti-huvellezi-sekine, sikinti-hasbiye-tertibi, sikinti-ya-selam-ya-latif-ya-vedud, ofke-hasbiyallahu, sikinti-inni-euzu-minel-hemmi | 3785ms |
| r003 | günahlarımdan tövbe etmek istiyorum | tövbe ve istiğfar niyeti; geçmiş günahla… | SEYYIDUL_ISTIGFAR, sifa-seyyidul-istigfar, ISTIGFAR | 2 | istigfar-gunluk, ISTIGFAR, istigfar-rabbena-zalemna, sikinti-ya-allah-estagfirullah, istigfar-rabbigfirli | 4563ms |
| r005 | asdfgh123 | asdfgh123 | — | (atlandı) | afet-allahumme-la-tektulna-bi-gadabik, SUBHANALLAH_GAFUR_RAHIM, SUBHANALLAH_EHAD_SAMED, tehlike-bismillah-havkale, haset-ya-hafiz | 3057ms |
| r004 | sınavım var, başarı ve kolaylık için dua | sınav kaygısı, başarı, kolaylık ve zihin… | sinav-rabbisrahli-sadri, sinav-rabbi-yessir, sinav-rabbi-edhilni | 1 | sinav-rabbi-edhilni, sinav-rabbi-yessir, sinav-rabbisrahli-sadri, sinav-sekine-fetih, sinav-allahumme-la-sehle | 3659ms |
| r006 | içim kan ağlıyor, çok üzgünüm | derin üzüntü, içsel keder ve ruhsal çökü… | sikinti-inni-abduk-ibnu-abduk, DUHA_SURESI, sikinti-ya-hayyu-ya-kayyum | 1 | sikinti-inni-abduk-ibnu-abduk, sikinti-la-ilahe-illallahul-azimul-halim, sikinti-rabbena-efrig-sabran, sifa-la-bese-tahur, mubin-duasi-tesbih | 3476ms |
| r007 | sürekli sinirleniyorum, öfkemi kontrol e… | sürekli öfke, sinirlilik ve kontrol edem… | ofke-euzubillah, ofke-rabbi-muhammed, esmaul-husna-el-halim | 3 | esmaul-husna-es-sabur, ofke-lokman-17, ofke-rabbi-muhammed, sikinti-ya-muksit, ofke-kelimetu-hak | 3185ms |
| r008 | kendimi çok yalnız hissediyorum, kimsem … | yoğun yalnızlık, yalnız hissetme ve yaln… | esmaul-husna-el-vahid, sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi | 4 | TEVHID, sikinti-inni-abduk-ibnu-abduk, barisma-ellefe-beyne-kulubihim, esmaul-husna-el-vahid, 6a59ffc7a9004ba3e9f22167 | 3449ms |
| r009 | gelecek kaygısı beni her gün eziyor, ne … | gelecek kaygısı, belirsizlik ve endişe; … | RIZIK_EBU_UMAME, sikinti-insirah-suresi, sikinti-bismillahi-ala-nefsi | 3 | sikinti-rahmeteke-ercu, sikinti-hasbiye-tertibi, sikinti-bismillahi-ala-nefsi, sikinti-inna-lillahi-ve-inna-ileyhi-raciun, sikinti-rabbena-efrig-sabran | 2971ms |
| r010 | sabah namazından sonra ne okumalıyım | sabah namazı sonrası okunabilecek zikirl… | namaz-sonrasi-33-tesbih-paketi, namaz-sonrasi-ayetel-kursi, sabah-subhanallah-bihamdihi | — | sabah-mulk-rabbilalemin, sabah-ilim-rizik-amel, namaz-selamdan-once-zikredinme-yardim, sabah-nimet-sukur, sabah-mumin-ayetulkursi | 3560ms |
| r011 | yatmadan önce hangi duaları okumalıyım | yatmadan önce okunacak dualar, uykudan ö… | uyku-ayetel-kursi, uyku-bismike-rabbi-yatak, uyku-tesbih-33-34 | 2 | uyanis-bismike-ahya-hamd, uyku-ayetel-kursi, uyku-bismike-rabbi-yatak, uyku-eslemtu-nefsî, aksam-emsena | 3598ms |
| r012 | cuma günü için özel bir zikir var mı | Cuma günü yapılabilecek özel zikir, ibad… | salavat-cuma-cok-getir, SEYYIDUL_ISTIGFAR | 1 | salavat-cuma-cok-getir, SALAVAT-I ŞERİFE, SELLIM_BARIK, TEFRICIYE_SALAVATI, KEMALILLAHI | 4273ms |
| r013 | hastayım, şifa bulmak için dua istiyorum | hastalık ve bedeni/manevi rahatsızlık; ş… | sifa-ezhibil-bese, sifa-eselullahel-azime, sifa-la-bese-tahur | 3 | sifa-sefallahu-sekameke, sifa-isfi-abdek, sifa-la-bese-tahur, sifa-uizuke-billahil-ehad, sifa-enni-messeniyeddurru | 3442ms |
| r014 | annem hastanede yatıyor, ona şifa duası … | annenin hastanede yatışı, sağlık sorunla… | sifa-isfi-abdek, sifa-sefallahu-sekameke, sifa-ezhibil-bese | 1 | sifa-sefallahu-sekameke, sifa-isfi-abdek, sifa-la-bese-tahur, sifa-afiyete-dunya-ahiret, sifa-ezhibil-bese | 3071ms |
| r015 | yarın uzun bir yolculuğa çıkıyorum, yolc… | uzun yolculuğa çıkma; güvenli ulaşım, ka… | yolculuk-seferin-duasi, yolculuk-estevdiullah-dine, yolculuk-konaklamada | 1 | yolculuk-seferin-duasi, hac-yolculuk-binit-duasi, yolculuk-konaklamada, yolculuk-sehre-girerken, ev-cikis-bismillah-tevekkul | 2865ms |
| r017 | çocuğum için hayırlı bir evlat olması ad… | çocuğumun ahlaklı, dindar, sağlıklı ve b… | evlat-rabbi-heb-li-mine-salihin, evlat-rabbi-heb-li-min-ledunke, evlat-rabbi-la-tezerni | 1 | evlat-rabbi-heb-li-mine-salihin, evlat-rabbi-heb-li-min-ledunke, evlat-rabbi-la-tezerni, zina-korunma-huda-tukâ-afaf-gına, ozlu-huda-takva-iffet-gina | 3219ms |
| r016 | evleniyorum, huzurlu ve bereketli bir ev… | evlilik niyeti, eşle uyum, huzur, sevgi,… | evlilik-rum-21, evlilik-ellif-beyne-kulubina, evlilik-furkan-74 | 2 | barisma-barekellahu-lekum, evlilik-ellif-beyne-kulubina, evlilik-furkan-74, evlilik-rum-21, evlilik-zifaf-hayra-dua | 3818ms |
| r018 | hacdayım, Safa tepesindeyim şu an ne oku… | Hac ibadeti esnasında Safa tepesi üzerin… | hac-safa-zikri, hac-safa-merve-ayeti | 3 | SALAVAT-I ŞERİFE, hac-tavaf-kabul-duasi, hac-safa-zikri, hac-safa-merve-ayeti, namaz-selamdan-once-zikredinme-yardim | 3296ms |
| r019 | umre için Kabe'yi ilk gördüğüm anda ne o… | Umre ziyareti sırasında Kâbe’yi ilk görd… | hac-mekke-hareminde, hac-tavaf-baslangic | 4 | hac-tavaf-kabul-duasi, hac-zemzem-duasi, ISTIGFAR, hac-tavaf-baslangic, SALAVAT-I ŞERİFE | 3201ms |
| r020 | ramazanda iftar vaktinde okunacak dua ne… | Ramazan ayında iftar vaktinde okunacak d… | oruc-iftar-zehebez-zame, oruc-iftar-birahmetike | 1 | oruc-iftar-zehebez-zame, oruc-iftar-birahmetike, IFTAR_DUASI, yemek-iftar-ev-sahibine, oruc-hilal-ramazan | 3491ms |
| r021 | abdest alırken hangi duayı okumalıyım | abdest alma niyeti, abdeste başlarken ok… | abdest-sonrasi-sehadet-dua | 2 | MESKEN_GENISLIGI, abdest-sonrasi-sehadet-dua, hac-zemzem-duasi, hac-ihlas-duasi, yolculuk-kalkisindan-dua | 3918ms |
| r022 | huzur | iç huzuru, gönül dinginliği ve kaygı gid… | — | (atlandı) | sikinti-ya-selam-ya-latif-ya-vedud, sikinti-huvellezi-sekine, barisma-vela-tecal-fi-kulubina-gillen, sikinti-ya-mumin, sikinti-inni-abduk-ibnu-abduk | 2976ms |
| r023 | yardım | yardım ihtiyacı, çaresizlik veya sıkıntı… | — | (atlandı) | sikinti-inna-lillahi-ve-inna-ileyhi-raciun, sikinti-ya-uddeti-inde-siddeti, sikinti-ya-hayyu-ya-kayyum, mubin-duasi-tesbih, ENBIYA_83 | 2662ms |
| r024 | sllsd asdasd 1234 | sllsd asdasd 1234 | — | (atlandı) | esmaul-husna-es-samed, SUBHANALLAH_EHAD_SAMED, namaz-selamdan-once-kabir-fitne-istiaze, DELAIL_HAYRAT, BISMILLAH_LA_YEDURRU | 3053ms |
| r025 | nasılsın | nasılsın | — | (atlandı) | aksirma-teshmit-cevabi, esmaul-husna-el-hayy, 6a59ffc7a9004ba3e9f2216a, YA_SELAM, 6a59ffc2a9004ba3e9f22119 | 2338ms |
| r026 | python kodu yaz bana | python kodu yaz bana | — | (atlandı) | sinav-nun-vel-kalemi, zulum-allahümme-kfinihim, afet-rabbi-kullu-seyin-hadimuke, sinav-rabbi-zidni-ilmen, afet-euzu-bi-kelimatillahit-tammati-min-serri-ma-halak | 2650ms |
| r027 | I feel very anxious lately and can't sle… | kaygı, endişe ve uykusuzluk hali; gece h… | sikinti-insirah-suresi, uyku-ayetel-kursi, sikinti-ya-selam-ya-latif-ya-vedud | 4 | sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, sikinti-ya-allah-estagfirullah, sikinti-huvellezi-sekine, sikinti-ya-selam-ya-latif-ya-vedud, sikinti-ya-muahhir | 2636ms |
| r029 | how are you today, what's up | how are you today, what's up | — | (atlandı) | RAMAZAN_GUN_8, RAMAZAN_GUN_3, sabah-nimet-afiyet-setr, 6a59ffa2a9004ba3e9f21f58, sabah-mulk-rabbilalemin | 2019ms |
| r028 | I want to thank Allah for everything He … | şükür, minnettarlık ve Allah’a verilen n… | tesbih-subhanallahil-azim-ve-bihamdihi, esmaul-husna-es-sekur | 3 | sabah-nimet-sukur, KURBAN_SUKRU_DUASI, esmaul-husna-es-sekur, is-ibrahim-7-sukur-bereket, elbise-giyerken-hamd | 2561ms |
| r030 | son zamanlarda hayatım çok karışık, işim… | hayatın karışıklığı, işteki sürekli bask… | sikinti-insirah-suresi, sikinti-la-ilahe-illallahul-azimul-halim, sikinti-rabbena-efrig-sabran | — | ISTIGFAR, mubin-duasi-tesbih, evlilik-nisa-19, barisma-ellefe-beyne-kulubihim, sikinti-rahmeteke-ercu | 2928ms |
| r032 | işten kovulacağım diye çok korkuyorum, r… | iş kaybı kaygısı ve gelecek için endişe;… | is-allahumme-ikfini-bi-helalike, is-allahumme-ya-ganiyyu-ya-hamidu, is-ya-rafi-kariyer-yukselis | 6 | sikinti-hasbiye-tertibi, rizik-talak-men-yettekillah, HASBIYE, sikinti-rahmeteke-ercu, rizik-kfini-bihalali-an-harami | 2938ms |
| r031 | geçen hafta işimi kaybettim, aynı gün ev… | iş kaybı, trafik kazası ve anne sağlığın… | sikinti-rabbena-efrig-sabran, RIZIK_EBU_UMAME, sikinti-hasbiye-tertibi | 7 | mubin-duasi-tesbih, MESKEN_GENISLIGI, is-allahumme-ikfini-bi-helalike, sikinti-inna-lillahi-ve-inna-ileyhi-raciun, is-allahumme-ya-ganiyyu-ya-hamidu | 3227ms |
| r033 | yeni bir eve taşınıyoruz, hayırlı ve ber… | yeni bir eve taşınma, evin hayırlı, bere… | MUMINUN_29, MESKEN_GENISLIGI, EVE_GIRERKEN_DUA | 1 | MUMINUN_29, MESKEN_GENISLIGI, EVE_GIRERKEN_DUA, yolculuk-sehre-girerken, esmaul-husna-es-sekur | 2884ms |
| r035 | yarın ameliyat olacağım, çok korkuyorum,… | yarın ameliyat olacak olmanın getirdiği … | sifa-afiyete-dunya-ahiret, sifa-eselullahel-azime, sikinti-la-ilahe-illallahul-azimul-halim | 13 | sifa-bismillahi-davini, sifa-isfi-abdek, sifa-sefallahu-sekameke, sabah-rabbiyallahu-tevekkel, korunma-dua-i-sifa | 2660ms |
| r034 | büyük bir günah işledim, çok pişmanım, A… | büyük günah işleme sonucu yoğun pişmanlı… | SEYYIDUL_ISTIGFAR, sifa-seyyidul-istigfar, ISTIGFAR | 1 | ISTIGFAR, istigfar-rabbena-zalemna, ozlu-magfiratul-evsa, istigfar-rabbigfirli, istigfar-yunus-duasi | 2927ms |
| r036 | sürekli kabuslar görüyorum, uykularım ka… | sürekli kabuslar, uykusuzluk ve gece kor… | uyku-ayetel-kursi, sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, korunma-muavvizeteyn-felak-nas | 1 | sikinti-euzu-bi-kelimatillahit-tammati-min-gadabihi, SEYTANDAN_SIGINMA, uyku-bismike-rabbi-yatak, uyanis-bismike-ahya-hamd, sikinti-ya-allah-estagfirullah | 2700ms |
| r037 | gece namazına kalkmak istiyorum ama nefs… | gece namazına kalkma isteği ve nefsin ağ… | namaz-iftitah-veccehtu, vitr-kunut-hdini-fimen, sikinti-ya-allah-estagfirullah | 2 | namaz-selamdan-once-zikredinme-yardim, sikinti-ya-allah-estagfirullah, uyku-eslemtu-nefsî, uyanis-bismike-ahya-hamd, 6a59ffb3a9004ba3e9f22057 | 2940ms |
| r038 | eşimle aramız son zamanlarda bozuk, evim… | eşle ilgili anlaşmazlık, iletişim kopukl… | evlilik-nisa-19, evlilik-ellif-beyne-kulubina, evlilik-nisa-128 | 1 | evlilik-ellif-beyne-kulubina, barisma-barekellahu-lekum, evlilik-furkan-74, evlilik-hubbeke-muaz, evlilik-zifaf-hayra-dua | 3252ms |
| r039 | bugün küçük ama benim için çok kıymetli … | yaşanan küçük ama kişisel mucize için de… | tesbih-subhanallahil-azim-ve-bihamdihi, esmaul-husna-es-sekur, sabah-nimet-sukur | 1 | sabah-nimet-sukur, KURBAN_SUKRU_DUASI, is-ibrahim-7-sukur-bereket, uyanis-hamd-ruh, elbise-giyerken-hamd | 2782ms |
| r040 | asdkjaslkdjaslkdj | asdkjaslkdjaslkdj | — | (atlandı) | KEMALILLAHI, cami-giris-cikis-besmele-salavat, esmaul-husna-es-selam, esmaul-husna-el-kuddus, SALAVAT-I ŞERİFE | 2526ms |
| r041 | dua | dua, Allah’a yönelme ve istediğini dilem… | — | (atlandı) | ozlu-bagisla-merhamet-afiyet-rizik, ozlu-hayrin-hepsi-serrin-hepsi, ozlu-rabbi-ainni-kapsamli-kulluk, ozlu-rabbena-atina-haseneten, oruc-kadir-gecesi-afv | 3163ms |
| r042 | kurban bayramı arefe gününde hangi zikir… | Kurban Bayramı arefe günü, ibadet ve sev… | VAHDEHU_LA, hac-arefe-zikri, TESRIK_TEKBIRI | 6 | ESTAGFIRULLAH, ISTIGFAR, SUBHANALLAHI_VE_BIHAMDIHI, KURBAN_SUKRU_DUASI, SALAVAT-I ŞERİFE | 3020ms |
