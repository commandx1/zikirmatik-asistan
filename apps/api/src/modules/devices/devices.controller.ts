import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UnlinkDeviceDto } from './dto/unlink-device.dto';

@Controller('v1/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // Public: guests must be able to register for push before ever signing
  // in. If the request carries a valid access token, OptionalJwtAuthGuard
  // resolves it and the device is linked to that user.
  @Post('register')
  @HttpCode(200)
  @UseGuards(OptionalJwtAuthGuard)
  register(
    @Body() payload: RegisterDeviceDto,
    @CurrentUserId() userId: string | undefined,
  ) {
    return this.devicesService.register(payload, userId);
  }

  // Public by design: called from the client right as the session is torn
  // down on logout, so we key off deviceId rather than requiring a
  // (possibly already-cleared) bearer token.
  @Post('unlink')
  @HttpCode(200)
  unlink(@Body() payload: UnlinkDeviceDto) {
    return this.devicesService.unlinkUser(payload.deviceId);
  }
}
