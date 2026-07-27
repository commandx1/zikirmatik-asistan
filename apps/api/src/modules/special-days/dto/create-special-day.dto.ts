import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';
import { SpecialDayPracticeDto } from './special-day-practice.dto';

const SPECIAL_DAY_TYPE = {
  kandil: 'kandil',
  ramazan: 'ramazan',
  bayram: 'bayram',
} as const;

export class CreateSpecialDayDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @IsEnum(SPECIAL_DAY_TYPE)
  type!: 'kandil' | 'ramazan' | 'bayram';

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsString()
  hijriDate!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

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
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  article?: LocalizedTextDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialDayPracticeDto)
  practices?: SpecialDayPracticeDto[];

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
