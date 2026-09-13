import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';
import {
  VIRD_PROGRAM_KIND_ENUM,
  VIRD_PROGRAM_SOURCE_ENUM,
  type VirdProgramKind,
  type VirdProgramSource,
} from '../vird.types';

export class VirdItemDto {
  @ValidateIf((item: VirdItemDto) => !item.customDhikrId)
  @IsMongoId()
  dhikrId?: string;

  @ValidateIf((item: VirdItemDto) => !item.dhikrId)
  @IsString()
  customDhikrId?: string;

  @IsInt()
  @Min(1)
  target!: number;
}

export class VirdPhaseSlotsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VirdItemDto)
  morning?: VirdItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VirdItemDto)
  prayer?: VirdItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VirdItemDto)
  evening?: VirdItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VirdItemDto)
  night?: VirdItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VirdItemDto)
  free?: VirdItemDto[];
}

export class VirdPhaseDto {
  @IsInt()
  @Min(1)
  fromDay!: number;

  // null = bir sonraki faz başlayana dek (ya da son fazsa sonsuza dek) sürer.
  @IsOptional()
  @IsInt()
  @Min(1)
  toDay?: number | null;

  @IsOptional()
  @IsString()
  note?: string;

  @ValidateNested()
  @Type(() => VirdPhaseSlotsDto)
  slots!: VirdPhaseSlotsDto;
}

export class VirdReminderSlotsDto {
  @IsBoolean()
  morning!: boolean;

  @IsBoolean()
  prayer!: boolean;

  @IsBoolean()
  evening!: boolean;

  @IsBoolean()
  night!: boolean;
}

export class VirdRemindersDto {
  @IsBoolean()
  enabled!: boolean;

  @ValidateNested()
  @Type(() => VirdReminderSlotsDto)
  slots!: VirdReminderSlotsDto;
}

export class CreateVirdProgramDto {
  // İstemcinin offline oluşturma / retry için ürettiği idempotency anahtarı.
  @IsOptional()
  @IsString()
  clientId?: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @IsEnum(VIRD_PROGRAM_KIND_ENUM)
  kind!: VirdProgramKind;

  // Belirtilmezse 'manual' kabul edilir. 'template'|'ai' kabul edilir (400
  // ile reddedilmez) ama premium kontrolüne tabidir — şablon/AI çözümlemesi
  // (phases'in doldurulması) sonraki görevdedir.
  @IsOptional()
  @IsEnum(VIRD_PROGRAM_SOURCE_ENUM)
  source?: VirdProgramSource;

  @IsOptional()
  @IsString()
  templateKey?: string;

  // Manuel (source: 'manual') programlarda zorunludur (servis katmanında
  // doğrulanır); template/ai kaynaklı programlarda boş/atlanmış olabilir.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => VirdPhaseDto)
  phases?: VirdPhaseDto[];

  // Manuel/AI kaynaklı programlarda zorunludur (servis katmanında doğrulanır
  // — bkz. phases/title deseni). Şablon kaynaklı (source:'template' +
  // templateKey) programlarda opsiyoneldir: verilmezse şablonun anchorDate'i,
  // o da yoksa bugün (İstanbul) kullanılır.
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @IsArray()
  @IsIn([1, 2, 3, 4, 5], { each: true })
  prayerSelection?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => VirdRemindersDto)
  reminders?: VirdRemindersDto;
}
