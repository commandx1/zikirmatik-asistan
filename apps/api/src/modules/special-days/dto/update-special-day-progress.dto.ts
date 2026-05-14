import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';

export class UpdateSpecialDayProgressDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  dhikrId!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
