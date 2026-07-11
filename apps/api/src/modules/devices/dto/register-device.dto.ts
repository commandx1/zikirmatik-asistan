import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DevicePrefsDto } from './device-prefs.dto';

const DEVICE_PLATFORM = {
  ios: 'ios',
  android: 'android',
} as const;

export class RegisterDeviceDto {
  @IsString()
  @MinLength(8)
  deviceId!: string;

  // Optional: a device can register before notification permission is
  // granted (guest onboarding), and gets a token later.
  @IsOptional()
  @IsString()
  @MinLength(8)
  expoPushToken?: string;

  @IsEnum(DEVICE_PLATFORM)
  platform!: 'ios' | 'android';

  @IsOptional()
  @ValidateNested()
  @Type(() => DevicePrefsDto)
  prefs?: DevicePrefsDto;
}
