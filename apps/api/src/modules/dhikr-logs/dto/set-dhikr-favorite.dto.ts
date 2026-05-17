import { IsBoolean, IsMongoId, IsString, ValidateIf } from 'class-validator';

export class SetDhikrFavoriteDto {
  @ValidateIf((payload: SetDhikrFavoriteDto) => !payload.customDhikrId)
  @IsMongoId()
  dhikrId?: string;

  @ValidateIf((payload: SetDhikrFavoriteDto) => !payload.dhikrId)
  @IsString()
  customDhikrId?: string;

  @IsBoolean()
  isFavorite!: boolean;
}
