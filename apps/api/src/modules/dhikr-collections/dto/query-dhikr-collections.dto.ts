import { IsOptional, IsString } from 'class-validator';

export class QueryDhikrCollectionsDto {
  @IsOptional()
  @IsString()
  category?: string;
}
