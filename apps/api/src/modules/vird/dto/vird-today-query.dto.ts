import { IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

export class VirdTodayQueryDto {
  // Belirtilmezse İstanbul takvim günü (bugün) kullanılır.
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  // Belirtilmezse en son güncellenen aktif program kullanılır.
  @IsOptional()
  @IsMongoId()
  programId?: string;
}
