import { IsOptional, IsString } from 'class-validator';
import { IsDateKey } from '../../../common/validators/is-date-key';

export class VirdHistoryQueryDto {
  // İkisi de opsiyoneldir; belirtilmezse son 30 gün (bugün dahil) döner.
  @IsOptional()
  @IsString()
  @IsDateKey()
  from?: string;

  @IsOptional()
  @IsString()
  @IsDateKey()
  to?: string;
}
