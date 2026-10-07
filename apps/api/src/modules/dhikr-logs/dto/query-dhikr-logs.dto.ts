import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { IsDateKey } from '../../../common/validators/is-date-key';

export class QueryDhikrLogsDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  dhikrId?: string;

  @IsOptional()
  @IsString()
  @IsDateKey()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @IsDateKey()
  dateTo?: string;
}
