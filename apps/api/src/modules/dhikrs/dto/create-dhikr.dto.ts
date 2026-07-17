import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_OF_DAY = {
  morning: 'morning',
  evening: 'evening',
  night: 'night',
  any: 'any',
} as const;

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

  @IsOptional()
  @IsEnum(TIME_OF_DAY)
  timeOfDay?: 'morning' | 'evening' | 'night' | 'any';

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
