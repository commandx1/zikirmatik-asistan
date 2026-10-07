import { ValidateBy, buildMessage } from 'class-validator';
import { isValidDateKey } from '../utils/date-keys';

/**
 * YYYY-MM-DD gün anahtarı: biçim + gerçek takvim günü (2026-02-30, 2026-13-01
 * reddedilir). Yalnız regex, takvimde olmayan günleri geçirip shiftDateKey'in
 * sessizce normalize etmesine yol açıyordu (B19).
 */
export function IsDateKey() {
  return ValidateBy({
    name: 'isDateKey',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && isValidDateKey(value),
      defaultMessage: buildMessage(
        (prefix) => `${prefix}$property must be a valid YYYY-MM-DD date`,
      ),
    },
  });
}
