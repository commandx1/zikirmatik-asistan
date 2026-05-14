import { IsMongoId } from 'class-validator';

export class SelectAiRecommendationDto {
  @IsMongoId()
  selectedDhikrId!: string;
}
