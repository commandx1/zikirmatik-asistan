import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { TIME_OF_DAY_VALUES, type TimeOfDay } from '../schemas/dhikr.schema';
import { normalizeTimeOfDay } from '../utils/time-of-day';

// Şema her iki dili de zorunlu kılar (trim sonrası boş = Mongoose ValidationError
// → 500). Burada 400'e çevrilir; fazilet (virtue) için "fazilet + amaç zorunlu"
// kuralının API kapısıdır (B15).
const NOT_BLANK = /\S/;
const NOT_BLANK_MESSAGE = '$property boş olamaz.';

export class LocalizedTextDto {
  @IsString()
  @Matches(NOT_BLANK, { message: NOT_BLANK_MESSAGE })
  tr!: string;

  @IsString()
  @Matches(NOT_BLANK, { message: NOT_BLANK_MESSAGE })
  en!: string;
}

export class CreateDhikrDto {
  @IsString()
  @Matches(NOT_BLANK, { message: NOT_BLANK_MESSAGE })
  nameArabic!: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  transliteration!: LocalizedTextDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  meaning!: LocalizedTextDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  virtue!: LocalizedTextDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  source!: LocalizedTextDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  // Türkçe/İngilizce karışık girişleri (ör. 'sabah', ['gece','yatsi']) sabit
  // enum'a normalize eder; geçersiz değerlerde ham veriyi bırakır ki IsIn
  // doğru validasyon hatasını üretebilsin (bkz. utils/time-of-day.ts).
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => {
    try {
      return normalizeTimeOfDay(value);
    } catch {
      return value;
    }
  })
  @IsArray()
  @IsIn(TIME_OF_DAY_VALUES, { each: true })
  timeOfDay?: TimeOfDay[];

  @IsOptional()
  @IsInt()
  @Min(1)
  recommendedCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitableFor?: string[];

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  audioUrl?: string;
}
