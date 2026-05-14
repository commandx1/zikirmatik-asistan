import { IsEnum, IsString } from 'class-validator';
import type { AuthProvider, ClientPlatform } from '../auth.types';

const AUTH_PROVIDER = {
  apple: 'apple',
  google: 'google',
} as const;

const CLIENT_PLATFORM = {
  ios: 'ios',
  android: 'android',
} as const;

export class ProviderVerifyDto {
  @IsEnum(AUTH_PROVIDER)
  provider!: AuthProvider;

  @IsString()
  idToken!: string;

  @IsEnum(CLIENT_PLATFORM)
  platform!: ClientPlatform;

  @IsString()
  deviceId!: string;
}
