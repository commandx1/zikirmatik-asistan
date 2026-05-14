import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const SPECIAL_DAY_TYPE = {
  kandil: 'kandil',
  ramazan: 'ramazan',
  bayram: 'bayram',
} as const;

export class UpdateSpecialDayDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SPECIAL_DAY_TYPE)
  type?: 'kandil' | 'ramazan' | 'bayram';

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsString()
  hijriDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  eventKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayIndex?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  recommendedDhikrIds?: string[];

  @IsOptional()
  @IsBoolean()
  hasSpecialFlow?: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(10080, { each: true })
  notifyBeforeMinutes?: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
