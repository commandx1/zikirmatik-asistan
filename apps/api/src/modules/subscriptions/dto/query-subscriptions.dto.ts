import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

const SUBSCRIPTION_PLAN = {
  free: 'free',
  premium: 'premium',
} as const;

const SUBSCRIPTION_PROVIDER = {
  apple: 'apple',
  google: 'google',
} as const;

const SUBSCRIPTION_STATUS = {
  active: 'active',
  expired: 'expired',
  cancelled: 'cancelled',
} as const;

export class QuerySubscriptionsDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsEnum(SUBSCRIPTION_PLAN)
  plan?: 'free' | 'premium';

  @IsOptional()
  @IsEnum(SUBSCRIPTION_PROVIDER)
  provider?: 'apple' | 'google';

  @IsOptional()
  @IsEnum(SUBSCRIPTION_STATUS)
  status?: 'active' | 'expired' | 'cancelled';
}
