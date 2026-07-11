import { IsString, MinLength } from 'class-validator';

export class UnlinkDeviceDto {
  @IsString()
  @MinLength(8)
  deviceId!: string;
}
