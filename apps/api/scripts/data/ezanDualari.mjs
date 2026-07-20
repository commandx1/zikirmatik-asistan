export const ezanDualari = {
  key: 'ezan-dualari',
  label: {
    tr: 'Ezan Duaları ve Müezzine Uyma',
    en: 'Adhan Supplications and Responding to the Muezzin',
  },
  category: 'gunluk',
  description: {
    tr: 'Ezan okunurken ve sonrasında okunacak dualar.',
    en: 'Supplications to recite during and after the adhan.',
  },
  dhikrItems: [
    {
      key: 'ezan-muezzine-tekrar',
      nameArabic:
        'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
      name: {
        tr: "Müezzini Tekrarlama — Hayye'ye La Havle ile Karşılık",
        en: "Repeating the Muezzin — Answering the Call to Prayer with La Hawla",
      },
      transliteration: {
        tr: "Lâ havle ve lâ kuvvete illâ billâh. (Hayye ale's-salâh ve Hayye ale'l-felâh'a karşılık olarak)",
        en: "La hawla wa la quwwata illa billah. (Recited in response to 'Hayya 'ala-s-salah' and 'Hayya 'ala-l-falah')",
      },
      meaning: {
        tr: "Günahtan kaçınacak güç ve ibadete girecek kuvvet yalnız Allah'ın yardımıyla kazanılabilir.",
        en: "There is no power to turn away from sin and no strength to perform worship except by the help of Allah.",
      },
      virtue: {
        tr: "Resûlullah'ın (sas) buyurduğuna göre: 'Kim müezzini duyduğunda onun söylediği şeyi söylerse cennete girer.' (Sahih-i Müslim). Müezzinin her cümlesi aynısıyla tekrarlanır; tek istisna 'Hayye ale's-salâh' ve 'Hayye ale'l-felâh' cümleleridir — 'Namaza gelin, kurtuluşa gelin' çağrısına 'Güç bende değil, ancak Allah'ın yardımıyla gelirim' anlamında 'Lâ havle ve lâ kuvvete illâ billâh' ile karşılık verilir. Bu ince fark önemlidir: ezanın bütün cümleleri tekrarlanır, fakat bu iki davete 'gelirim' denmez, 'ancak Allah'ın yardımıyla gelebilirim' denir. 'Hayye' kelimesi tam anlamıyla 'koş, gel' demektir; mümin bu çağrıya kibirle değil, acziyet itirafıyla ve Allah'a havale ederek karşılık verir. Böylece ezan boyunca müezzini takip etmek, hem dilde bir tekrar hem de kalpte bir teslimiyet alışkanlığına dönüşür.",
        en: "The Messenger of Allah (peace be upon him) said: 'Whoever says what the muezzin says when he hears him will enter Paradise.' (Sahih Muslim). Every phrase of the muezzin is repeated exactly as spoken, with one exception: when he says 'Hayya 'ala-s-salah' and 'Hayya 'ala-l-falah' — 'Come to prayer, come to success' — the listener responds instead with 'La hawla wa la quwwata illa billah,' meaning 'I have no power of my own; I come only by Allah's help.' This distinction matters: every other phrase of the adhan is echoed word for word, but to these two calls one does not answer 'I am coming,' but rather affirms that coming is only possible through Allah's assistance. The word 'hayya' literally means 'hasten, come' — the believer answers this summons not with self-reliance but with an admission of powerlessness, entrusting the matter to Allah. In this way, following the muezzin becomes both a repetition of speech and a habitual posture of submission in the heart.",
      },
      source: {
        tr: "Sahih-i Buhârî, Ezan, 7 (611); Sahih-i Müslim, Namaz (Salât), 8 (383); Sunan Ebû Dâvûd",
        en: "Sahih al-Bukhari, Adhan, 7 (611); Sahih Muslim, Prayer (Salat), 8 (383); Sunan Abu Dawood",
      },
      tags: ['ezan', 'namaz', 'la havle', 'tekrar', 'günlük', 'müezzin'],
      categories: ['ibadet', 'namaz', 'ezan', 'günlük'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'ezan okunurken',
        'beş vakit ezan dinlenirken',
        'müezzine uyma pratiği',
        'ezan duyulduğunda her seferinde',
        'cennete girmek için köklü bir pratik',
      ],
    },
    {
      key: 'ezan-sehadet-sonrasi-raditu',
      nameArabic:
        'وَأَنَا أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، رَضِيتُ بِاللَّهِ رَبًّا وَبِمُحَمَّدٍ رَسُولًا وَبِالْإِسْلَامِ دِينًا',
      name: {
        tr: 'Ezanda Şehadetten Sonra Razı Oldum Duası',
        en: "After the Shahada in the Adhan — The Supplication of Contentment (Raditu)",
      },
      transliteration: {
        tr: "Ve ene eşhedü en lâ ilâhe illallâhu vahdehû lâ şerîke leh, ve enne Muhammeden abdühû ve rasûlüh. Radîtü billâhi Rabben, ve bi-Muhammedin Rasûlen, ve bil-İslâmi Dînen.",
        en: "Wa ana ashhadu an la ilaha illallahu wahdahu la sharika lah, wa anna Muhammadan 'abduhu wa rasuluh. Raditu billahi Rabban, wa bi-Muhammadin Rasulan, wa bil-Islami Dinan.",
      },
      meaning: {
        tr: "Ben de şehadet ederim ki Allah'tan başka hak ilah yoktur; O birdir, ortağı yoktur. Ve Muhammed O'nun kulu ve elçisidir. Rab olarak Allah'a razı oldum; peygamber olarak Muhammed'e razı oldum; din olarak İslam'a razı oldum.",
        en: "I bear witness that there is no god worthy of worship except Allah, alone, without partner, and that Muhammad is His servant and Messenger. I am content with Allah as my Lord, with Muhammad as my Messenger, and with Islam as my religion.",
      },
      virtue: {
        tr: "Sa'd ibn Ebî Vakkâs radıyallahu anh'ın rivayet ettiği hadiste Resûlullah (sas) şöyle buyurdu: 'Kim ezanda şehadeti duyunca şöyle derse, günahları bağışlanır.' (Sahih-i Müslim). Ezanın iki şehadet cümlesi duyulunca bu dua okunur; günde beş kez tekrarlanan bu 'razı oldum' ilanı, zaman içinde kişinin imanla bütünleşmesini, İslam'ı fırsatçıca değil bütünüyle kabullenmesini pekiştiren bir kök salar. 'Radîtü' — 'Razı oldum' — bir andan daha fazlasını ifade eder: o anki kabulün çok ötesinde, hayatın tamamına yayılmış bir teslimiyet bildirimidir. Rab, Peygamber ve din olmak üzere üç eksenli bu rıza beyanı, imanın yalnızca zihinsel bir onay değil, gönülden bir seçim olduğunu her ezanda yeniden hatırlatır.",
        en: "In the hadith narrated by Sa'd ibn Abi Waqqas, may Allah be pleased with him, the Messenger of Allah (peace be upon him) said: 'Whoever says this upon hearing the two testimonies of faith in the adhan, his sins will be forgiven.' (Sahih Muslim). This supplication is recited upon hearing the adhan's two testimonies of faith; repeated five times a day, this declaration of 'I am content' gradually roots the believer's acceptance of Islam not as a matter of convenience but as a complete, wholehearted commitment. 'Raditu' — 'I am content' — expresses far more than a momentary acknowledgment; it is a declaration of submission that extends well beyond that instant to encompass the whole of one's life. This threefold affirmation of contentment — with Allah as Lord, with the Prophet as Messenger, and with Islam as religion — reminds the believer, at every call to prayer, that faith is not merely a mental assent but a choice made with the heart.",
      },
      source: {
        tr: "Sahih-i Müslim, Namaz (Salât), 10 (386); İbn Huzeyme, es-Sahîh, 1/220; Hısnu'l-Müslim, nr. 23",
        en: "Sahih Muslim, Prayer (Salat), 10 (386); Ibn Khuzaymah, As-Sahih, 1/220; Hisn al-Muslim, no. 23",
      },
      tags: ['ezan', 'şehadet', 'iman', 'rıza', 'İslam', 'günlük'],
      categories: ['ibadet', 'namaz', 'ezan', 'iman', 'günlük'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'ezanda şehadet duyulduğunda',
        'imanı tazeleme',
        'rab-peygamber-din üçlüsüne rıza bildirme',
        'günahların affı için',
        'beş vakit ezan pratik olarak',
      ],
    },
    {
      key: 'ezan-sonrasi-vesile-duasi',
      nameArabic:
        'اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
      name: {
        tr: 'Ezan Sonrası Vesile Duası',
        en: 'The Supplication of Al-Wasilah After the Adhan',
      },
      transliteration: {
        tr: "Allâhümme Rabbe hâzihed-da'vetit-tâmmeti ves-salâtil-kâimeti, âti Muhammeden el-vesîlete vel-fadîlete, veb'ashu makâmen mahmûdeni'llezî ve'adteh.",
        en: "Allahumma Rabba hadhihi-d-da'wati-t-tammati wa-s-salati-l-qa'imati, ati Muhammadani-l-wasilata wa-l-fadilata, wa-b'athu maqaman mahmudani-l-ladhi wa'adtah.",
      },
      meaning: {
        tr: "Bu eksiksiz davetin ve kılınacak namazın Rabbi olan Allah'ım! Muhammed'e vesileyi (cennetteki en yüce makamı) ve fazileti ihsan eyle. Onu, vaat ettiğin Makam-ı Mahmud'a eriştir.",
        en: "O Allah, Lord of this perfect call and of the prayer about to be established! Grant Muhammad al-Wasilah (the highest station in Paradise) and al-Fadilah (excellence), and raise him to the Praised Station (Maqam Mahmud) which You have promised him.",
      },
      virtue: {
        tr: "Resûlullah (sas) şöyle buyurdu: 'Kim ezanı duyduğunda bu duayı okursa, kıyamet günü şefaatim ona vacip olur.' (Sahih-i Buhârî). Duada üç unsur öne çıkar: eksiksiz davet ('ed-da'vetit-tâmme') — ezanın her kelimesinin eksiksiz duyurulması; vesile ve fazilet — cennette Resûlullah'a (sas) tahsis edilmiş tek makam; Makam-ı Mahmud — tüm insanlığın kendisine minnet duyacağı şefaat makamı. Bu duayı okuyan kişi, Resûlullah'ın (sas) o makama ulaşmasını talep eder; karşılığında şefaatten pay alır. Her ezan sonrası yapılan bu dua, farkında olmadan Resûlullah'a (sas) yönelik bir salavat ve vefa borcunun ödenmesine dönüşür.",
        en: "The Messenger of Allah (peace be upon him) said: 'Whoever recites this supplication upon hearing the adhan, my intercession will become obligatory for him on the Day of Judgment.' (Sahih al-Bukhari). Three elements stand out in this supplication: the perfect call ('ad-da'wati-t-tammah') — the complete and unblemished proclamation of every word of the adhan; al-Wasilah and al-Fadilah — the singular station in Paradise reserved exclusively for the Prophet (peace be upon him); and Maqam Mahmud, the Praised Station of intercession for which all of humanity will be grateful. Whoever recites this supplication is asking that the Prophet (peace be upon him) attain that station, and in return receives a share of his intercession. Recited after every adhan, this supplication quietly becomes an act of salawat upon the Prophet (peace be upon him) and a repayment of the debt of loyalty owed to him.",
      },
      source: {
        tr: "Sahih-i Buhârî, Ezan, 8 (614); Sunan et-Tirmizî, Mevâkît, 211; Hısnu'l-Müslim, nr. 25",
        en: "Sahih al-Bukhari, Adhan, 8 (614); Sunan at-Tirmidhi, Prayer Times (Mawaqit), 211; Hisn al-Muslim, no. 25",
      },
      tags: ['ezan', 'şefaat', 'peygamber', 'vesile', 'makam-ı mahmud', 'günlük'],
      categories: ['ibadet', 'namaz', 'ezan', 'salavat', 'günlük'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'ezan bittikten hemen sonra',
        'şefaat için pratik güvence',
        "Resûlullah'a (sas) saygı",
        'beş vakit ezan sonrası alışkanlık',
        'ezan + tekrar + bu dua tamamdır',
      ],
    },
    {
      key: 'ezan-kamet-arasi-serbest-dua',
      nameArabic: 'اللَّهُمَّ إِنَّ هَٰذَا إِقْبَالُ لَيْلِكَ وَإِدْبَارُ نَهَارِكَ',
      name: {
        tr: 'Ezan ile Kamet Arası — Duanın Kabul Vakti',
        en: 'Between the Adhan and the Iqamah — The Time of Answered Supplication',
      },
      transliteration: {
        tr: "Allâhümme inne hâzâ ikbâlü leylike ve idbâru nehârik... (kişi bu vakitte kendi duasını yapar)",
        en: "Allahumma inna hadha iqbalu laylika wa idbaru naharik... (one then makes one's own personal supplication at this time)",
      },
      meaning: {
        tr: "Bu aralık, müstecâb dua vaktidir. Ezan ile kamet arasında reddedilmeyen bir duanın zamanıdır.",
        en: "This interval is a time when supplications are readily accepted. Between the adhan and the iqamah lies a period in which a supplication is not turned away.",
      },
      virtue: {
        tr: "Resûlullah (sas) şöyle buyurdu: 'Ezan ile kamet arasında yapılan dua reddedilmez.' (Sunan et-Tirmizî, Sunan Ebû Dâvûd; hasen sahih). Bu aralık kısa ama değerlidir — genellikle birkaç dakika içinde kamet getirilir. Buradaki dua kabul kapısının 'her zaman açık' olmaktan farkı, bu anın özellikle müstecâb olduğunun hadisle açıkça bildirilmesidir. Ezan duyulunca müezzin tekrarlanır, ardından vesile duası okunur; sonrasında kişi kendi ihtiyacı için Allah'a yönelir — kamet gelene kadar bu aralık tamamen kişinin kendi duasına ayrılmıştır. Büyük ve küçük her ihtiyaç, sır olarak bu vakitte Allah'a açılabilir; günde beş kez tekrarlanan bu fırsat, dua alışkanlığını hayatın merkezine yerleştirir.",
        en: "The Messenger of Allah (peace be upon him) said: 'A supplication made between the adhan and the iqamah is not rejected.' (Sunan at-Tirmidhi, Sunan Abu Dawood; hasan sahih). This interval is brief but precious — the iqamah usually follows within a few minutes. What distinguishes this moment from the door of acceptance being 'always open' is that the hadith explicitly names this particular window as especially answered. Upon hearing the adhan, one repeats the muezzin, then recites the supplication of al-Wasilah; afterward, this remaining interval before the iqamah is left entirely for one's own personal need. Every need, great or small, may be confided to Allah privately in this window; recurring five times a day, this opportunity places the habit of supplication at the very center of daily life.",
      },
      source: {
        tr: "Sunan et-Tirmizî, Namaz (Salât), 42 (212); Sunan Ebû Dâvûd, Namaz (Salât), 36 (521); Ahmed b. Hanbel, el-Müsned; hasen sahih",
        en: "Sunan at-Tirmidhi, Prayer (Salat), 42 (212); Sunan Abu Dawood, Prayer (Salat), 36 (521); Ahmad ibn Hanbal, Al-Musnad; hasan sahih",
      },
      tags: ['ezan', 'kamet', 'dua', 'kabul', 'müstecâb', 'günlük'],
      categories: ['ibadet', 'namaz', 'ezan', 'dua', 'günlük'],
      timeOfDay: 'any',
      recommendedCount: 7,
      suitableFor: [
        'ezan ile kamet arasında',
        'camide veya evde namazı beklerken',
        'kişisel hacet duası için',
        'her türlü dilek ve ihtiyaç için',
        'müstecâb vakti değerlendirme',
      ],
    },
  ],
};
