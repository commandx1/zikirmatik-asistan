import { IsString } from 'class-validator';

/**
 * İki dilli metin alanı ({ tr, en }) için ortak doğrulama DTO'su.
 * ValidateNested + Type(() => LocalizedTextDto) ile iç içe kullanılır.
 * Karşılığı: common/types/localized-text.ts içindeki LocalizedText tipi.
 */
export class LocalizedTextDto {
  @IsString()
  tr!: string;

  @IsString()
  en!: string;
}
