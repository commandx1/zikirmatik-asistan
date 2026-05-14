import { IsMongoId, IsOptional } from 'class-validator';

export class QuerySpecialDayDetailDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
