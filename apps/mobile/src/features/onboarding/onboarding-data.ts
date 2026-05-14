export type PurposeOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};

export const PURPOSE_OPTIONS: PurposeOption[] = [
  {
    id: "habit",
    title: "Günlük ibadet alışkanlığı",
    subtitle: "Düzenli zikir rutini oluştur",
    icon: "🙏"
  },
  {
    id: "calm",
    title: "Huzur & sakinleşmek",
    subtitle: "Ruhsal dinginlik bul",
    icon: "🪷"
  },
  {
    id: "tracking",
    title: "Belirli zikirleri düzenli çekmek",
    subtitle: "Özel tesbihat takibi",
    icon: "☸️"
  },
  {
    id: "special-days",
    title: "Özel günlerde daha aktif olmak",
    subtitle: "Kandil ve mübarek geceler",
    icon: "☪️"
  }
];
