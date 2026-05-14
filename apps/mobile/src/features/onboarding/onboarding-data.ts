export type PurposeOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};

export type MoodOption = {
  id: string;
  label: string;
  emoji: string;
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

export const MOOD_OPTIONS: MoodOption[] = [
  { id: "uzgun", label: "Üzgün", emoji: "😔" },
  { id: "stresli", label: "Stresli", emoji: "😰" },
  { id: "notr", label: "Nötr", emoji: "😐" },
  { id: "huzurlu", label: "Huzurlu", emoji: "😌" },
  { id: "minnettar", label: "Minnettar", emoji: "🙏" },
  { id: "yorgun", label: "Yorgun", emoji: "😓" },
  { id: "kaygili", label: "Kaygılı", emoji: "😟" },
  { id: "mutlu", label: "Mutlu", emoji: "😊" },
  { id: "yalniz", label: "Yalnız", emoji: "🥺" },
  { id: "ofkeli", label: "Öfkeli", emoji: "😠" },
  { id: "umutsuz", label: "Umutsuz", emoji: "😞" },
  { id: "heyecanli", label: "Heyecanlı", emoji: "🤩" }
];
