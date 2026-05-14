import { IsMongoId, IsOptional } from 'class-validator';

export class QueryAiRecommendationsDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
