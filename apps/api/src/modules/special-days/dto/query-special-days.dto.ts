import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { IsDateKey } from '../../../common/validators/is-date-key';

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
  @IsDateKey()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @IsDateKey()
  dateTo?: string;
}
