import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { TIME_OF_DAY_VALUES, type TimeOfDay } from '../schemas/dhikr.schema';

export class QueryDhikrsDto {
  @IsOptional()
  @IsIn(TIME_OF_DAY_VALUES)
  timeOfDay?: TimeOfDay;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBooleanString()
  isVerified?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
