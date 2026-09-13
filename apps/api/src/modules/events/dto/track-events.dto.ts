import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

// Bir istekte gönderilebilecek üst sınır. Mobil taraf kuyruğu da bu boyutta
// parçalara böler (bkz. apps/mobile/src/lib/analytics.ts).
export const MAX_EVENTS_PER_REQUEST = 50;

// Olay adı: kısa, snake_case, sabit bir sözlük gibi davranmalı (ör.
// `dhikr_completed`, `ai_chat_sent`) — serbest metin değil.
export const EVENT_NAME_PATTERN = /^[a-z_]{2,48}$/;

export class TrackEventsDto {
  @IsString()
  @MinLength(8)
  deviceId!: string;

  // Kasıtlı olarak `@ValidateNested()` KULLANILMIYOR: her eleman
  // EventsService içinde class-validator ile tek tek doğrulanır, böylece
  // tek bir bozuk olay tüm isteği reddetmez (bkz. EventsService.track).
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EVENTS_PER_REQUEST)
  events!: unknown[];
}

// EventsService.track içinde her bir `events[]` elemanı bu şekle
// dönüştürülüp `validateSync` ile ayrı ayrı doğrulanır — global
// ValidationPipe'ın aksine, geçersiz olan yalnızca atlanır.
export class TrackEventItemDto {
  @Matches(EVENT_NAME_PATTERN)
  name!: string;

  @IsISO8601()
  ts!: string;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;
}
