import { IsBoolean, IsOptional } from 'class-validator';

export class DevicePrefsDto {
  @IsOptional()
  @IsBoolean()
  specialDays?: boolean;

  @IsOptional()
  @IsBoolean()
  friday?: boolean;

  @IsOptional()
  @IsBoolean()
  streak?: boolean;

  @IsOptional()
  @IsBoolean()
  badges?: boolean;
}
