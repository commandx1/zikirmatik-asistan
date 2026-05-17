import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUserDhikrDto {
  @IsString()
  @MaxLength(120)
  clientId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  transliteration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  arabic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meaning?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  target?: number;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
