import { IsOptional, IsString } from 'class-validator';

export class UpdateOnboardingDto {
  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
