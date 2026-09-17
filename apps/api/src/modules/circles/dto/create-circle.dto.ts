import {
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateCircleDto {
  // Verilmezse zikrin adı (name.tr) kullanılır — bkz. CirclesService.create.
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsMongoId()
  dhikrId!: string;

  @IsInt()
  @Min(1)
  @Max(10_000_000)
  goalCount!: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}
