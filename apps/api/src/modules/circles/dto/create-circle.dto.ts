import {
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { IsDateKey } from '../../../common/validators/is-date-key';

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
  @IsDateKey()
  endDate?: string;
}
