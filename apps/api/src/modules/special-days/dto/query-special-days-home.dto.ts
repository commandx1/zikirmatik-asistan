import { IsOptional, IsString } from 'class-validator';
import { IsDateKey } from '../../../common/validators/is-date-key';

export class QuerySpecialDaysHomeDto {
  @IsOptional()
  @IsString()
  @IsDateKey()
  date?: string;
}
