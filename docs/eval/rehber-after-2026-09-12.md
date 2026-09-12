# AI Rehber Eval Raporu

- Tarih: 2026-09-12T15:52:44.188Z
- Git SHA: `c06c96f`
- runId: `2026-09-12T15-47-41-092Z`
- Locale: tr+en
- Modeller: expand=gpt-5-mini, select=gpt-5
- AI_PASSAGE_MIN_SCORE: 0.68
- Dataset boyutu: 42 (çalıştırılan: 42)
- Pipeline maliyeti: $0.3622
- Judge maliyeti (gpt-5): $0.3929
- **Toplam maliyet: $0.7551**

## Özet

| Metrik | Değer |
| --- | --- |
| Toplam vaka | 42 |
| kind eşleşme oranı | 100% |
| tagsAny isabet oranı | 91% |
| clarification oranı | 0% |
| offTopic oranı | 14% |
| hata oranı | 0% |
| gecikme p50 | 8589ms |
| gecikme p95 | 12135ms |
| judge overall (ort.) | 4.19 |
| judge verdict dağılımı | pass=30, weak=6 |
| outcome dağılımı | recommendations=36, offTopic=6 |

## Vakalar

| id | input | outcome | expected | checks | judge | latency |
| --- | --- | --- | --- | --- | --- | --- |
| r003 | günahlarımdan tövbe etmek istiyorum | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 9861ms |
| r001 | çok kaygılıyım, içim huzursuz | recommendations | recommendations | kind ✓, tagsAny ✗ | pass (4/5) | 10354ms |
| r005 | asdfgh123 | offTopic | offTopic | kind ✓ | (atlandı) | 1074ms |
| r002 | Allah'a şükretmek istiyorum | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 10716ms |
| r004 | sınavım var, başarı ve kolaylık için dua | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 10358ms |
| r006 | içim kan ağlıyor, çok üzgünüm | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 10343ms |
| r007 | sürekli sinirleniyorum, öfkemi kontrol edemiyorum | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 9887ms |
| r009 | gelecek kaygısı beni her gün eziyor, ne olacağını … | recommendations | recommendations | kind ✓, tagsAny ✗ | pass (4/5) | 8566ms |
| r008 | kendimi çok yalnız hissediyorum, kimsem yok gibi | recommendations | recommendations | kind ✓, tagsAny ✓ | weak (3/5) | 12210ms |
| r010 | sabah namazından sonra ne okumalıyım | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 8043ms |
| r011 | yatmadan önce hangi duaları okumalıyım | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 9304ms |
| r012 | cuma günü için özel bir zikir var mı | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 8603ms |
| r013 | hastayım, şifa bulmak için dua istiyorum | recommendations | recommendations | kind ✓, tagsAny ✓ | weak (4/5) | 9562ms |
| r014 | annem hastanede yatıyor, ona şifa duası okumak ist… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 10117ms |
| r015 | yarın uzun bir yolculuğa çıkıyorum, yolculuk duası… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 9388ms |
| r017 | çocuğum için hayırlı bir evlat olması adına dua et… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 9850ms |
| r016 | evleniyorum, huzurlu ve bereketli bir evlilik için… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 8785ms |
| r018 | hacdayım, Safa tepesindeyim şu an ne okumalıyım | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 9276ms |
| r020 | ramazanda iftar vaktinde okunacak dua nedir | recommendations | recommendations | kind ✓, tagsAny ✓ | weak (3/5) | 8472ms |
| r019 | umre için Kabe'yi ilk gördüğüm anda ne okumalıyım | recommendations | recommendations | kind ✓, tagsAny ✓ | weak (3/5) | 8371ms |
| r022 | huzur | recommendations | any | kind ✓ | pass (4/5) | 8362ms |
| r024 | sllsd asdasd 1234 | offTopic | offTopic | kind ✓ | (atlandı) | 1070ms |
| r025 | nasılsın | offTopic | offTopic | kind ✓ | (atlandı) | 1008ms |
| r026 | python kodu yaz bana | offTopic | offTopic | kind ✓ | (atlandı) | 1074ms |
| r021 | abdest alırken hangi duayı okumalıyım | recommendations | recommendations | kind ✓, tagsAny ✓ | weak (3/5) | 8616ms |
| r023 | yardım | recommendations | any | kind ✓ | pass (4/5) | 8074ms |
| r029 | how are you today, what's up | offTopic | offTopic | kind ✓ | (atlandı) | 1321ms |
| r027 | I feel very anxious lately and can't sleep at nigh… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 7053ms |
| r028 | I want to thank Allah for everything He has given … | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 6128ms |
| r030 | son zamanlarda hayatım çok karışık, işimde sürekli… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 7937ms |
| r031 | geçen hafta işimi kaybettim, aynı gün eve dönerken… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 8010ms |
| r032 | işten kovulacağım diye çok korkuyorum, rızkım için… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 9628ms |
| r033 | yeni bir eve taşınıyoruz, hayırlı ve bereketli olm… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 8059ms |
| r034 | büyük bir günah işledim, çok pişmanım, Allah'tan a… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 7984ms |
| r035 | yarın ameliyat olacağım, çok korkuyorum, benim içi… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 7184ms |
| r036 | sürekli kabuslar görüyorum, uykularım kaçtı, korun… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 8055ms |
| r037 | gece namazına kalkmak istiyorum ama nefsime yenili… | recommendations | recommendations | kind ✓, tagsAny ✗ | weak (3/5) | 9077ms |
| r040 | asdkjaslkdjaslkdj | offTopic | offTopic | kind ✓ | (atlandı) | 1137ms |
| r038 | eşimle aramız son zamanlarda bozuk, evimize huzur … | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 8575ms |
| r039 | bugün küçük ama benim için çok kıymetli bir mucize… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (5/5) | 9351ms |
| r041 | dua | recommendations | any | kind ✓ | pass (4/5) | 13715ms |
| r042 | kurban bayramı arefe gününde hangi zikirleri çekme… | recommendations | recommendations | kind ✓, tagsAny ✓ | pass (4/5) | 23145ms |

## Başarısızlıklar

### r001 (emotion)
- freeText: çok kaygılıyım, içim huzursuz
- outcome: recommendations — beklenen: recommendations
- summary: Kalbinin bu yoğun kaygı ve huzursuzlukla daraldığını hissediyorum; Allah kabul etsin, bu halin feraha dönmesi için güzel bir niyetle geldin. İnşallah bu akşam sakinleşmene ve içinin yumuşamasına vesile olacak birkaç zikir paylaşacağım. Rahmetin kapıları açıktır; Allah dilediğine sekînet indirir. Maşallah, yönelişin kıymetli—Rabbim gönlüne genişlik versin.
- öneriler:
  - Yâ Selâm, Yâ Latîf, Yâ Vedûd [sıkıntı, kaygı, kalp sükûneti, sevgi, esma terkibi] — Kaygı ve kalp sıkışması anında özellikle sükûnet ve sevgi iklimi kazandırmayı hedefler; bu akşam içini yumuşatıp dinginlik vermesi için çok yerindedir.
  - Sekine Ayeti [sıkıntı, kaygı, panik, sekine, sükûnet, kuran, kriz] — Sekîne, Kur’an’da kalbe indirilen ilahî sükûnettir; kaygı ve panik dalgasında doğrudan sükûnet talebine vesile olur, akşam saatinde de kalbi toparlar.
  - İnşirah Suresi [sıkıntı, kaygı, kriz, inşirah, panik, dua, gelecek kaygısı] — İç daralması ve stres anlarında manevi genişlik müjdesini taşır; zorlukla beraber kolaylık vurgusu bu huzursuzlukta yüreğine nefes olur.
- judge: verdict=pass, overall=4/5, summaryTone=5/5
  - S1: relevance=5/5, grounded=true, note="Kaygı ve kalp sıkışmasına sükûnet ve sevgi iklimi hedefi listede var; akşam vurgusu ek ama asli gerekçe uyumlu."
  - S2: relevance=5/5, grounded=true, note="Sekîne’nin Kur’an’da kalbe indirilen sükûnet oluşu ve panik/krizde okunması metinde var; akşam ifadesi ek ayrıntı."
  - S3: relevance=5/5, grounded=true, note="İç daralması ve ‘zorlukla beraber kolaylık’ vurgusu metindeki anlamla örtüşüyor."
### r009 (emotion)
- freeText: gelecek kaygısı beni her gün eziyor, ne olacağını bilmiyorum
- outcome: recommendations — beklenen: recommendations
- summary: Gelecek belirsizliği insanı yorabilir; hissini görüyor ve kalbinden dua ediyorum. Allah kabul etsin, inşallah bu süreçte kalbine sükûnet ve teslimiyet indirilsin. Kontrol edemediklerini Rahmân’a emanet edip, O’na güvenerek adım adım ilerlemen için birkaç özel zikir derledim. İnşallah her biri sana akşam vakti de yoldaş olur.
- öneriler:
  - Sekiz Şeyden Sığınma Duası — Kaygı ve Keder [kaygı, üzüntü, acizlik, borç, sığınma, sekiz şey, istiaze] — Geleceğe dair kaygı ve geçmişe dair üzüntüye karşı doğrudan sığınmayı öğretir; Resûlullah’ın çokça okuduğu güçlü bir duadır. Kaygı ezicileştiğinde diline kolayca gelen net bir kalkan olur.
  - Rahmetine Sığınma Duası [sıkıntı, kaygı, rahmet, teslimiyet, acizlik, sorumluluk, dua] — “Bütün işlerimi” ifadesiyle kontrol edemediğin belirsizliği Rahmet’e tevdi etmeye çağırır; kısa anlarda dahi nefsine bırakılmaman için sıcak bir yakarıştır.
  - Yâ Mü'min [sıkıntı, kaygı, korku, emniyet, esma] — Emniyet ve iç huzur manasıyla kalbe güven duygusu yerleştirir; belirsizlik karşısında sarsılan gönle sakin bir dayanak sunar.
- judge: verdict=pass, overall=4/5, summaryTone=5/5
  - S1: relevance=4/5, grounded=true, note="Kaygı/üzüntüye doğrudan; rivayet ve sekiz şey açıklamasıyla örtüşüyor. Zaman sabah odaklı, ama kaygı anında da uygun."
  - S2: relevance=5/5, grounded=true, note="‘Bütün işlerimi’ ve ‘tarfete aynin’ vurgusu kaynakla tam uyumlu; gelecek belirsizliği için doğrudan."
  - S3: relevance=5/5, grounded=true, note="İsmin manası ve kullanım bağlamı (gelecek kaygısı, emniyet) metinle uyumlu; akşama da uygun."
### r008 (emotion)
- freeText: kendimi çok yalnız hissediyorum, kimsem yok gibi
- outcome: recommendations — beklenen: recommendations
- summary: Yalnızlık duygunu yüreğimde hissediyorum; Allah kalbine ferahlık ve yoldaşlık versin. Bu halin akşama vurması ağır olabilir ama Senin duanı ve zikrini O duyuyor, inşallah içini genişletecek. Allah kabul etsin; her an yanında ve şah damarından daha yakın olan Rabbinle bağın kuvvetlensin. İnşallah bu zikirlere sarıldıkça yalnızlığın yerini huzur ve güven duygusu alır.
- öneriler:
  - El-Vâhid [esma, esmaul husna, tevhid, yalnızlık, kalp] — Bu isim, ‘tek olan’a yönelerek kalbi masivadan arındırmaya ve yalnızlık korkusunu hafifletmeye doğrudan niyetlenir; tevhid bilincini tazeler.
  - Gece Panik ve Vesvese Sığınma Duası [sıkıntı, kaygı, gece paniği, vesvese, sığınma, dua] — Akşam/gece yoğunlayan yalnızlık ve kaygı için özellikle sığınma içeriğiyle kalbe emniyet dili taşır; vesvese ve gece paniğine karşı koruyucu bir dua sunar.
  - Yâ Selâm, Yâ Latîf, Yâ Vedûd [sıkıntı, kaygı, kalp sükûneti, sevgi, esma terkibi] — Kalp sükûneti ve sevgi iklimi için bu esma terkibi, kaygı ve iç daralmasında yumuşatıcı bir tesir niyeti taşır; rahmet ve şefkat dengesini hatırlatır.
- judge: verdict=weak, overall=3/5, summaryTone=5/5
  - S1: relevance=5/5, grounded=true, note="Yalnızlık korkusu ve tevhid bilinciyle doğrudan örtüşüyor; fazilet metniyle tam uyumlu."
  - S2: relevance=4/5, grounded=true, note="Gece/akşam yalnızlık ve kaygı için sığınma; vesvese ve emniyet vurgusu kaynakta var. Akşam-gece sınırı hafif belirsiz."
  - S3: relevance=3/5, grounded=true, note="Kaygı ve kalp sükuneti için uygun; yalnızlık doğrudan geçmiyor ama faziletiyle uyumlu bir rahatlatma önerisi."
### r013 (health)
- freeText: hastayım, şifa bulmak için dua istiyorum
- outcome: recommendations — beklenen: recommendations
- summary: Rabbim şifanı yakın eylesin, kalbine huzur ve sabır versin; inşallah bu süreç senin için arınma ve yükselişe vesile olur. Allah kabul etsin, akşamın bereketiyle duana rahmet kapıları açılsın. Yalnız değilsin; Rahmân’a yönelen her niyaz duyulur ve karşılıksız kalmaz.
- öneriler:
  - Ezhibi'l-Be'se Duası [şifa, hastalık, dua, rukye, hasta ziyareti] — Doğrudan hastalığın giderilmesi ve şifanın Allah’tan istenmesi için en sahih şifa dualarından biridir; kendin için de okunabilir. Sıcak ve yalın ifadesi, şu anki ihtiyacına tam karşılık gelir.
  - Es'elullâhe'l-Azîm Duası [şifa, hastalık, hasta ziyareti, dua, arş] — Ağır veya inatçı hastalıkta ümidi tazeleyen güçlü bir şifa duasıdır. Allah’ın Azîm ismine sığınarak açıkça şifa talep eder, kalbe tevekkül verir.
  - Dâvinî bi-Devâike Duası [şifa, hastalık, dua, tedavi, afiyet, tevekkül] — Tedavi sürecindeyken hem sebeplere sarılıp hem de şifayı yalnız Allah’tan istemeyi öğretir. Manevi ve tıbbî şifayı birlikte niyaz etmek isteyenler için uygundur.
- judge: verdict=weak, overall=4/5, summaryTone=5/5
  - S1: relevance=5/5, grounded=true, note="Fazileti ve kullanım bağlamı (kendine şifa, en sahih) metinle örtüşüyor; son cümledeki duygusal ifade desteklenmiyor."
  - S2: relevance=3/5, grounded=false, note="Ağır hastalık/tevekkül kısmı örtüşse de ‘inatçı’ vurgusu ve şahıs kullanımına dair uyumsuzluk var (daha çok başkası için). ‘7 kez’ fazileti zikredilmemiş."
  - S3: relevance=5/5, grounded=true, note="Tedavi/ilaç bağlamı ve şifayı Allah’tan isteme vurgusu doğrudan metinden."
### r020 (niche)
- freeText: ramazanda iftar vaktinde okunacak dua nedir
- outcome: recommendations — beklenen: recommendations
- summary: Allah kabul etsin; Ramazan’da iftar anı duanın en mübarek vakitlerinden biridir. Bu niyetin çok kıymetli, inşallah o anda edilen sözler kalbe sekine olur. İftarın şükrünü ve oruç ibadetinin manasını taşıyan duaları birlikte paylaşayım. Rabbimiz, ihlasla edilen bu niyetleri kabul buyursun.
- öneriler:
  - İftar Duası [ramazan, oruç, iftar, dua, özel gün] — İftarın Allah için tutulduğunu ve O’nun rızkıyla açıldığını açıkça dile getirir; Ramazan ve iftar bağlamına doğrudan uygundur.
  - İftar Duası — Susuzluk Gitti [oruç, iftar, ramazan, şükür, dua] — İftarı açtıktan sonra şükür ve ecrin sabit olmasını ifade eder; iftar vaktinin hissiyatına tam oturur.
  - İftar Duası — Rahmetinle Bağışla [oruç, iftar, ramazan, istiğfar, mağfiret, dua] — İftar anında Allah’ın her şeyi kuşatan rahmetiyle bağışlanmayı isteyen özlü bir istiğfar niteliğindedir; kalbe yumuşaklık verir.
- judge: verdict=weak, overall=3/5, summaryTone=5/5
  - S1: relevance=5/5, grounded=true, note="Ramazan iftarında okunacak temel dua; içerik ve bağlam tam uyumlu."
  - S2: relevance=5/5, grounded=true, note="İftar açtıktan sonra okunur; anlamı ve fazileti gerekçede yansıtılmış."
  - S3: relevance=4/5, grounded=true, note="İftar anında mağfiret talebi; uygun ama S1–S2 kadar yaygın değil."
### r019 (niche)
- freeText: umre için Kabe'yi ilk gördüğüm anda ne okumalıyım
- outcome: recommendations — beklenen: recommendations
- summary: Allah kabul etsin, ne güzel bir anı soruyorsunuz; Kâbe’yi ilk görüş, kalbin yıllardır beklediği kavuşma anıdır. O anda ellerinizi kaldırıp samimiyetle yönelmeniz çok kıymetli; inşallah dualarınız makbul olur. Rabbim bu ziyareti bereketlendirsin, gönlünüze huzur ve emniyet indirsin. Dönüşte de hep güzel hatıralarla yâd etmeyi nasip etsin.
- öneriler:
  - Mekke Haremîne Varınca Dua [hac, umre, mekke, harem, dua] — Harem sınırına varıldığında özel olarak öğretilmiş bu dua, tam da Mekke Harem’ine girişin ve kavuşma eşiğinin duasıdır; cehennemden korunma, kıyamet günü emniyet ve Allah’ın dostları arasına katılma niyazlarını içerir.
  - Tavaf Başlangıcı (Hacerülesved Karşısında) [hac, umre, tavaf, kabe, zikir] — Kâbe’yi görüp tavafa yöneldiğiniz ilk anda, Hacerülesved karşısında okunur; iman, sözünü tutma ve sünnete uyma bilinciyle başlangıcı bereketlendirir.
  - Telbiye [hac, umre, ihrâm, telbiye, zikir] — İhrâmdayken dilde canlı tutulması sünnet olan telbiye, “Lebbeyk” teslimiyetini taşır; o ilk karşılaşmanın heyecanını Allah’a ‘hazırım’ deyişiyle ifade etmenize yardımcı olur.
- judge: verdict=weak, overall=3/5, summaryTone=5/5
  - S1: relevance=3/5, grounded=true, note="Harem’e girişte okunur; Kâbe’yi ilk görme anına özel değil."
  - S2: relevance=3/5, grounded=true, note="Hacerülesved’de, tavafa başlarken okunur; ilk görüşten hemen sonraya daha uygun."
  - S3: relevance=2/5, grounded=false, note="Telbiye ihram süresince; Kâbe’yi ilk görüş anına mahsus değil."
### r021 (worship)
- freeText: abdest alırken hangi duayı okumalıyım
- outcome: recommendations — beklenen: recommendations
- summary: Niyetin çok güzel; Allah kabul etsin. Abdest alırken ve sonrasında kalben yönelmen, inşallah hem temizliğini hem huzurunu artırır. Bu süreçte dilini zikirle ıslatman, kalbinin de ibadete hazırlanmasına vesile olur. Akşam vakti de olsa, abdestin her zamanındaki bu dualar inşallah feyiz olur.
- öneriler:
  - Abdest Sonrası Şehadet ve Dua [abdest, şehadet, temizlik, cennet, günlük, sünnet] — Abdest bittikten hemen sonra okunması sünnet olan bu şehadet ve dua, rivayette cennetin kapılarına vesile oluşuyla özellikle teşvik edilmiştir; abdest pratiğini tamamlaman için birebir.
  - Mesken Genişliği ve Bereket Duası [ev, bereket, mağfiret, rızık, mesken, dua, abdest] — Aday açıkça “abdest alırken” okunabilecek bir dua olarak belirtilmiş; mağfiret, evde ferahlık ve rızık bereketini birlikte niyaz ettiğin için abdest anını bereketlendirmek isteyen niyetine uygundur.
  - Tuvaletten Çıktıktan Sonra Dua [tuvalet, istiğfar, af, günlük, sünnet] — Tuvaletten çıktıktan hemen sonra okunur; abdestten önce tuvalet ihtiyacını görenler için kısa ve öz istiğfarla süreci edebe uygun biçimde bağlar.
- judge: verdict=weak, overall=3/5, summaryTone=5/5
  - S1: relevance=2/5, grounded=true, note="Abdestten sonra; niyetle kısmen alakalı ama zamanlama farklı."
  - S2: relevance=5/5, grounded=true, note="Açıkça abdest alırken okunabileceği belirtilmiş; niyetle tam uyumlu."
  - S3: relevance=1/5, grounded=false, note="Tuvaletten sonra için; abdest anına dair gerekçe çıkarımsal."
### r037 (worship)
- freeText: gece namazına kalkmak istiyorum ama nefsime yeniliyorum, yardımcı olacak bir zikir var mı
- outcome: recommendations — beklenen: recommendations
- summary: Niyetin çok kıymetli; Allah kabul etsin. Geceye hazırlanırken kalbinle Rabbini anman, inşallah şeytanın düğümlerini çözüp kalkmayı kolaylaştırır. Nefsle mücadeleni görüyorum; küçük ve sürekli adımlar bile büyük bir kapı aralar. Azimle sürdür, Allah yardımcın olsun.
- öneriler:
  - Uyku ve Uyanış İkiz Duası [uyku, uyanış, gece, sabah, dua, günlük] — Yatarken ve uyanınca okunacak kısa iki cümle, geceyi niyetle bağlayıp uyanışı hamd ile başlatmana yardımcı olur; gece namazına kalkma hedefini zihin ve kalpte canlı tutar.
  - Nefsimi Sana Teslim Ettim (Yatmadan Önce Son Dua) [uyku, gece, dua, iman, tevekkül, son dua] — Yatmadan hemen önce teslimiyet ve tevekkül dili kurar; gece boyu kalbini koruyup kalkış niyetini güçlendirmene destek olur.
  - Şeytanın Şerrinden Sığınma Duası [mevlid kandili, dua, korunma, sığınma, kandil] — Vesveseye ve dağınıklığa karşı sığınma sağlar; kalkma anında zihnini meşgul eden fısıltılardan Allah’a yönelerek uzaklaşmana yardımcı olur.
- judge: verdict=weak, overall=3/5, summaryTone=5/5
  - S1: relevance=4/5, grounded=false, note="Yatma/uyanma için uygun; ancak “hedefi canlı tutar” gibi faydalar metinde yok."
  - S2: relevance=3/5, grounded=false, note="Yatmadan önce okunur; kalkmayı kolaylaştırma/niyeti güçlendirme iddiası dayanaklı değil."
  - S3: relevance=4/5, grounded=true, note="Vesveseden korunma ve gece ibadeti etiketiyle doğrudan ilgili; verilen fayda metne uyuyor."
