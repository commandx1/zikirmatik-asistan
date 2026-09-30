// Kampanya bildirim metinleri (TR + EN). Dil cihaz başınadır
// (devices.locale); alanı olmayan cihaz (eski sürüm) 'tr' alır. İçerik burada
// sabit kod olarak tutuluyor çünkü ürün metni, İslami içerik/fazilet
// metinlerinin aksine (bkz. proje hafızası) editoryal onay gerektirmeyen kısa
// ürün bildirimidir. EN metinlerde fazilet/sevap/kabul vaadi YOK.

export type PushLocale = 'tr' | 'en';

type PushText = { title: string; body: string };

const enCount = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const WINBACK_TEMPLATES = {
  day3: {
    title: 'Zikirmatik seni bekliyor',
    body: 'Bugün birkaç dakikanı zikre ayırmak ister misin?',
  },
  day7: {
    title: 'Ne zaman istersen',
    body: 'Hazır olduğunda birkaç zikirle güne dönebilirsin.',
  },
} as const;

const WINBACK_TEMPLATES_EN = {
  day3: {
    title: 'Zikirmatik is waiting for you',
    body: 'Would you like to set aside a few minutes for dhikr today?',
  },
  day7: {
    title: 'Whenever you like',
    body: 'When you are ready, you can come back with a few dhikrs.',
  },
} as const;

export function winbackTemplate(
  window: 'day3' | 'day7',
  locale: PushLocale = 'tr',
): PushText {
  return (locale === 'en' ? WINBACK_TEMPLATES_EN : WINBACK_TEMPLATES)[window];
}

export function kandilEveTemplate(
  name: string,
  locale: PushLocale = 'tr',
): PushText {
  if (locale === 'en') {
    return {
      title: name,
      body: `${name} is tomorrow. Take a look at the special day guide to prepare.`,
    };
  }
  return {
    title: name,
    body: `Yarın ${name}. Hazırlık için özel gün rehberine göz at.`,
  };
}

export function kandilDayTemplate(
  name: string,
  locale: PushLocale = 'tr',
): PushText {
  if (locale === 'en') {
    // TR'deki "faziletleri" bilinçli olarak çevrilmedi (vaat yok).
    return {
      title: name,
      body: `${name} is today. Tap to open the guide for tonight.`,
    };
  }
  return {
    title: name,
    body: `Bugün ${name}. Gecenin faziletleri ve amelleri için rehbere dokun.`,
  };
}

export function weeklySummaryPremiumTemplate(
  totalCount: number,
  activeDays: number,
  locale: PushLocale = 'tr',
): PushText {
  if (locale === 'en') {
    return {
      title: 'Your weekly summary is ready',
      body: `Last week: ${enCount(totalCount, 'dhikr', 'dhikrs')}, ${enCount(activeDays, 'active day', 'active days')}. Keep it up!`,
    };
  }
  return {
    title: 'Haftalık özetin hazır',
    body: `Geçen hafta ${totalCount} zikir, ${activeDays} aktif gün. Böyle devam!`,
  };
}

export function weeklySummaryFreeTemplate(
  totalCount: number,
  locale: PushLocale = 'tr',
): PushText {
  if (locale === 'en') {
    return {
      title: 'Your weekly summary is ready',
      body: `Last week: ${enCount(totalCount, 'dhikr', 'dhikrs')}. Your detailed weekly report is in Premium.`,
    };
  }
  return {
    title: 'Haftalık özetin hazır',
    body: `Geçen hafta ${totalCount} zikir. Detaylı haftalık raporun Premium'da.`,
  };
}
