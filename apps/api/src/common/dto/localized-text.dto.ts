import { IsString, Matches } from 'class-validator';

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

/**
 * Şemada zorunlu (boş olamayan) başlık/ad alanları için: tr ve en trim sonrası
 * boşsa 400 (aksi halde Mongoose `required` hatası 500 olurdu).
 */
export class RequiredLocalizedTextDto {
  @IsString()
  @Matches(/\S/, { message: '$property boş olamaz.' })
  tr!: string;

  @IsString()
  @Matches(/\S/, { message: '$property boş olamaz.' })
  en!: string;
}
