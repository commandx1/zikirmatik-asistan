import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_LOG_COUNT } from '../../dhikr-logs/dto/create-dhikr-log.dto';

// A-02 ile aynı tavan.
const MAX_USER_DHIKR_TARGET = MAX_LOG_COUNT;

export class CreateUserDhikrDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  transliteration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  arabic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meaning?: string;

  @IsOptional()
  @IsInt()
  @Min(0) // 0 = hedef yok (mobil boş hedefi 0 gönderir)
  @Max(MAX_USER_DHIKR_TARGET)
  target?: number;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
