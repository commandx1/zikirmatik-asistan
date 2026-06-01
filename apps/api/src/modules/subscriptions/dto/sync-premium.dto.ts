import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

const SUBSCRIPTION_PROVIDER = {
  apple: 'apple',
  google: 'google',
} as const;

export class SyncPremiumDto {
  @IsOptional()
  @IsBoolean()
  hasActivePremiumEntitlement?: boolean;

  @IsOptional()
  @IsEnum(SUBSCRIPTION_PROVIDER)
  provider?: 'apple' | 'google';
}
