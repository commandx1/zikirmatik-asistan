import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TIME_OF_DAY_VALUES, type TimeOfDay } from '../schemas/dhikr.schema';
import { normalizeTimeOfDay } from '../utils/time-of-day';

export class LocalizedTextDto {
  @IsString()
  tr!: string;

  @IsString()
  en!: string;
}

export class CreateDhikrDto {
  @IsString()
  nameArabic!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  transliteration!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  meaning!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  virtue!: LocalizedTextDto;

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
