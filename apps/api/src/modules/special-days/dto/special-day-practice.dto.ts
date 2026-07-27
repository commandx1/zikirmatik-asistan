import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';

/**
 * Özel güne ait tek bir ibadet tavsiyesi. Create/Update DTO'larında
 * practices[] elemanı olarak kullanılır.
 */
export class SpecialDayPracticeDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;
}
