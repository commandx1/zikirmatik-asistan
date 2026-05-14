import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateDhikrLogDto } from './create-dhikr-log.dto';

export class CreateDhikrLogBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDhikrLogDto)
  items!: CreateDhikrLogDto[];
}
