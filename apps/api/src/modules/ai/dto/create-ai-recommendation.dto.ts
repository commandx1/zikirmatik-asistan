import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

class TimeContextDto {
  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsBoolean()
  isSpecialDay!: boolean;

  @IsOptional()
  @IsString()
  specialDayName?: string;
}

export class CreateAiRecommendationDto {
  @IsMongoId()
  userId!: string;

  @IsOptional()
  @IsString()
  freeText?: string;

  @IsOptional()
  @Type(() => TimeContextDto)
  timeContext?: TimeContextDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxRecommendations?: number;

  @IsOptional()
  @IsString()
  socketId?: string;

  /**
   * Fallback belirsiz kaldığında (needsClarification) kullanıcıya sunulan
   * kategori önerilerinden birinin seçilip geri gönderilmesi için. 'genel'
   * özel değeri zaman tabanlı genel öneriyi tetikler.
   */
  @IsOptional()
  @IsString()
  selectedCategory?: string;
}
