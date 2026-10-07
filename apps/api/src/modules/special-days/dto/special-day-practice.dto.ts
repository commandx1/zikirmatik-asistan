import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';

/**
 * Özel güne ait tek bir ibadet tavsiyesi. Create/Update DTO'larında
 * practices[] elemanı olarak kullanılır.
 */
export class SpecialDayPracticeDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;
}
