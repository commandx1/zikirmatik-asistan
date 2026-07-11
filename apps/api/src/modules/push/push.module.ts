import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { PushSenderService } from './push-sender.service';

@Module({
  imports: [DevicesModule],
  providers: [PushSenderService],
  exports: [PushSenderService],
})
export class PushModule {}
