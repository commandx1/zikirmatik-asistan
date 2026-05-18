import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

const FONT_FAMILY = {
  default: 'default',
  merriweather: 'merriweather',
  'intel-one-mono': 'intel-one-mono',
} as const;

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsEnum(FONT_FAMILY)
  fontFamily?: 'default' | 'merriweather' | 'intel-one-mono';

  @IsOptional()
  @IsBoolean()
  hapticsEnabled?: boolean;
}
