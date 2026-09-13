import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AppEvent, AppEventSchema } from './schemas/app-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppEvent.name, schema: AppEventSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
