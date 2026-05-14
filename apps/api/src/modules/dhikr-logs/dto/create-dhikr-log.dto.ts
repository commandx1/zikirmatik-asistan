import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

const LOG_SOURCE = {
  manual: 'manual',
  ai: 'ai',
  kandil: 'kandil',
  notification: 'notification',
} as const;

export class CreateDhikrLogDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  dhikrId!: string;

  @IsInt()
  @Min(0)
  count!: number;

  @IsInt()
  @Min(1)
  targetCount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sessionDuration?: number;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsEnum(LOG_SOURCE)
  source?: 'manual' | 'ai' | 'kandil' | 'notification';

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
