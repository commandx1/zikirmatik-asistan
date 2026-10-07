import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { VIRD_SLOT_KEY_ENUM, type VirdSlotKey } from '../../vird/vird.types';
import { IsDateKey } from '../../../common/validators/is-date-key';

export const MAX_LOG_COUNT = 100_000;

const LOG_SOURCE = {
  manual: 'manual',
  ai: 'ai',
  specialDay: 'special-day',
  notification: 'notification',
  circle: 'circle',
} as const;

export class CreateDhikrLogDto {
  // Sunucu yok sayar, token sahibini kullanır; eski istemci hâlâ gönderiyor.
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ValidateIf((payload: CreateDhikrLogDto) => !payload.customDhikrId)
  @IsMongoId()
  dhikrId?: string;

  @ValidateIf((payload: CreateDhikrLogDto) => !payload.dhikrId)
  @IsString()
  customDhikrId?: string;

  @IsOptional()
  @IsString()
  customDhikrName?: string;

  @IsOptional()
  @IsString()
  customDhikrArabic?: string;

  @IsOptional()
  @IsMongoId()
  aiRecommendationId?: string;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsString()
  aiAssistantNote?: string;

  // A-02: tek kayıtta en fazla 100.000 sayım (halka hilesi + hatalı istemci).
  @IsInt()
  @Min(0)
  @Max(MAX_LOG_COUNT, {
    message: `count en fazla ${MAX_LOG_COUNT} olabilir.`,
  })
  count!: number;

  @IsInt()
  @Min(0)
  targetCount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sessionDuration?: number;

  @IsOptional()
  @IsEnum(LOG_SOURCE)
  source?: 'manual' | 'ai' | 'special-day' | 'notification' | 'circle';

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsString()
  @IsDateKey()
  date!: string;

  // --- Vird Programı alanları (opsiyonel) ---
  @IsOptional()
  @IsMongoId()
  virdProgramId?: string;

  @IsOptional()
  @IsEnum(VIRD_SLOT_KEY_ENUM)
  virdSlot?: VirdSlotKey;

  @IsOptional()
  @IsInt()
  @Min(1)
  virdDayIndex?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  virdPrayerIndex?: number;

  // --- Zikir Halkası (opsiyonel) ---
  // Verilirse log halkaya sayılır; halka ile vird alanları birlikte
  // gönderilemez (bkz. DhikrLogsService.create).
  @IsOptional()
  @IsMongoId()
  circleId?: string;
}
