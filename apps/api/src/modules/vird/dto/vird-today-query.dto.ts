import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { IsDateKey } from '../../../common/validators/is-date-key';

export class VirdTodayQueryDto {
  // Belirtilmezse İstanbul takvim günü (bugün) kullanılır.
  @IsOptional()
  @IsString()
  @IsDateKey()
  date?: string;

  // Belirtilmezse en son güncellenen aktif program kullanılır.
  @IsOptional()
  @IsMongoId()
  programId?: string;
}
