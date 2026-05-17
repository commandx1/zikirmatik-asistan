import { IsMongoId, IsString, ValidateIf } from 'class-validator';

export class DeleteDhikrLogsByDhikrDto {
  @ValidateIf((payload: DeleteDhikrLogsByDhikrDto) => !payload.customDhikrId)
  @IsMongoId()
  dhikrId?: string;

  @ValidateIf((payload: DeleteDhikrLogsByDhikrDto) => !payload.dhikrId)
  @IsString()
  customDhikrId?: string;
}
