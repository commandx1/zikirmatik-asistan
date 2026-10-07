// A-21: sunucu kişisel zikir adını boş bırakabilir (name null/boş). Ekranda
// ad → okunuş → yerelleştirilmiş yedek ad sırasıyla gösterilir.
export function resolvePersonalDhikrName(
  item: { name?: string | null; transliteration?: string | null },
  fallback: string
): string {
  return item.name?.trim() || item.transliteration?.trim() || fallback;
}
