import { IsOptional, IsString, Matches } from 'class-validator';

export class VirdHistoryQueryDto {
  // İkisi de opsiyoneldir; belirtilmezse son 30 gün (bugün dahil) döner.
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}
