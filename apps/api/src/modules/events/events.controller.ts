import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { TrackEventsDto } from './dto/track-events.dto';
import { EventsService } from './events.service';

@Controller('v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Misafirler için de çalışmalı: bir bearer token varsa OptionalJwtAuthGuard
  // onu çözer ve olaylar o kullanıcıya bağlanır. Geçersiz tekil olaylar
  // EventsService içinde atlanır; istek her zaman 200 döner — analitik ana
  // akışı asla bozulmamalı.
  @Post()
  @HttpCode(200)
  @UseGuards(OptionalJwtAuthGuard)
  track(
    @Body() payload: TrackEventsDto,
    @CurrentUserId() userId: string | undefined,
  ) {
    return this.eventsService.track(payload, userId);
  }
}
