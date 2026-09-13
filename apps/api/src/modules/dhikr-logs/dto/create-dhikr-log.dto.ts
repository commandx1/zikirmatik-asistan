import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { VIRD_SLOT_KEY_ENUM, type VirdSlotKey } from '../../vird/vird.types';

const LOG_SOURCE = {
  manual: 'manual',
  ai: 'ai',
  specialDay: 'special-day',
  notification: 'notification',
} as const;

export class CreateDhikrLogDto {
  @IsMongoId()
  userId!: string;

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

  @IsInt()
  @Min(0)
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
  source?: 'manual' | 'ai' | 'special-day' | 'notification';

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
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
}
