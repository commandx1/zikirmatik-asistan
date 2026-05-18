import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  dailyReminder?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hatırlatma saati HH:mm formatında olmalı.',
  })
  reminderTime?: string;
}
