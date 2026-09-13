import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';
import {
  VIRD_PROGRAM_STATUS_ENUM,
  type VirdProgramStatus,
} from '../vird.types';
import { VirdPhaseDto, VirdRemindersDto } from './create-vird-program.dto';

/**
 * PATCH programs/:id. `kind`, `source`, `startDate`, `templateKey`,
 * `clientId` kasıtlı olarak dahil edilmez — oluşturulduktan sonra
 * değişmeyecek program kimliği/temel alanları kabul edilir. `status:'active'`
 * DTO seviyesinde kabul edilir (aksi halde tek bir jenerik enum hatası
 * dönerdi) ama serviste açıkça reddedilir: draft/paused -> active geçişi
 * yalnız aktif sayısı limitini kontrol eden POST programs/:id/activate
 * üzerinden yapılır — hata mesajı kullanıcıyı oraya yönlendirir.
 */
export class UpdateVirdProgramDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title?: LocalizedTextDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => VirdPhaseDto)
  phases?: VirdPhaseDto[];

  @IsOptional()
  @IsArray()
  @IsIn([1, 2, 3, 4, 5], { each: true })
  prayerSelection?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => VirdRemindersDto)
  reminders?: VirdRemindersDto;

  @IsOptional()
  @IsEnum(VIRD_PROGRAM_STATUS_ENUM)
  status?: VirdProgramStatus;
}
