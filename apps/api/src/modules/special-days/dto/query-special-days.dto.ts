import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

const SPECIAL_DAY_TYPE = {
  kandil: 'kandil',
  ramazan: 'ramazan',
  bayram: 'bayram',
} as const;

export class QuerySpecialDaysDto {
  @IsOptional()
  @IsEnum(SPECIAL_DAY_TYPE)
  type?: 'kandil' | 'ramazan' | 'bayram';

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string;
}
