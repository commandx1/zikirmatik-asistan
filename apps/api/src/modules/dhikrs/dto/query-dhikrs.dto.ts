import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';

const TIME_OF_DAY = {
  morning: 'morning',
  evening: 'evening',
  night: 'night',
  any: 'any',
} as const;

export class QueryDhikrsDto {
  @IsOptional()
  @IsEnum(TIME_OF_DAY)
  timeOfDay?: 'morning' | 'evening' | 'night' | 'any';

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
