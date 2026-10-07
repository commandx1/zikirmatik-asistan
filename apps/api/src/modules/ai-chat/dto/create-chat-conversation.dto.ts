import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChatConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  // B16: yalnız boşluk → 400 (trim sonrası boş mesaj ajana gidip kredi düşürmesin).
  @Matches(/\S/, { message: 'firstMessage boş olamaz.' })
  firstMessage!: string;

  @IsOptional()
  @IsIn(['tr', 'en'])
  locale?: 'tr' | 'en';

  @IsOptional()
  @IsString()
  socketId?: string;

  /**
   * A-11: istemci mesaj anahtarı (UUID). Aynı kullanıcı + aynı anahtar →
   * ikinci kredi/mesaj yok, ilk yanıt döner. Yoksa eski davranış (eski sürümler).
   */
  @IsOptional()
  @IsUUID()
  clientMessageId?: string;
}
