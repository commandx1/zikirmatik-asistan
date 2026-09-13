// Kampanya bildirim metinleri (TR). Device şemasında bir dil alanı yok, bu
// yüzden tüm sunucu tetikli push kampanyaları şimdilik yalnızca Türkçe
// gönderir (bkz. runbook "Bilinen kısıtlar"). İçerik burada sabit kod olarak
// tutuluyor çünkü ürün metni, İslami içerik/fazilet metinlerinin aksine
// (bkz. proje hafızası) editoryal onay gerektirmeyen kısa ürün bildirimidir.

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

export function kandilEveTemplate(name: string): {
  title: string;
  body: string;
} {
  return {
    title: name,
    body: `Yarın ${name}. Hazırlık için özel gün rehberine göz at.`,
  };
}

export function kandilDayTemplate(name: string): {
  title: string;
  body: string;
} {
  return {
    title: name,
    body: `Bugün ${name}. Gecenin faziletleri ve amelleri için rehbere dokun.`,
  };
}

export function weeklySummaryPremiumTemplate(
  totalCount: number,
  activeDays: number,
): { title: string; body: string } {
  return {
    title: 'Haftalık özetin hazır',
    body: `Geçen hafta ${totalCount} zikir, ${activeDays} aktif gün. Böyle devam!`,
  };
}

export function weeklySummaryFreeTemplate(totalCount: number): {
  title: string;
  body: string;
} {
  return {
    title: 'Haftalık özetin hazır',
    body: `Geçen hafta ${totalCount} zikir. Detaylı haftalık raporun Premium'da.`,
  };
}
