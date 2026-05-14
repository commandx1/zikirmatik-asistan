import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const TIME_OF_DAY = {
  morning: 'morning',
  evening: 'evening',
  night: 'night',
  any: 'any',
} as const;

export class UpdateDhikrDto {
  @IsOptional()
  @IsString()
  nameArabic?: string;

  @IsOptional()
  @IsString()
  nameTurkish?: string;

  @IsOptional()
  @IsString()
  transliteration?: string;

  @IsOptional()
  @IsString()
  meaning?: string;

  @IsOptional()
  @IsString()
  virtue?: string;

  @IsOptional()
  @IsString()
  source?: string;

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
