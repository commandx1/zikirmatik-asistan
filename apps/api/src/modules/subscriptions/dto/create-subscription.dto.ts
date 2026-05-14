import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsMongoId, IsString } from 'class-validator';

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

export class CreateSubscriptionDto {
  @IsMongoId()
  userId!: string;

  @IsEnum(SUBSCRIPTION_PLAN)
  plan!: 'free' | 'premium';

  @IsEnum(SUBSCRIPTION_PROVIDER)
  provider!: 'apple' | 'google';

  @IsEnum(SUBSCRIPTION_STATUS)
  status!: 'active' | 'expired' | 'cancelled';

  @IsString()
  productId!: string;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;
}
