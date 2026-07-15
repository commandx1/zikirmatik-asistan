import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const AUTH_PROVIDER = {
  google: 'google',
  apple: 'apple',
  email: 'email',
} as const;

const FONT_SIZE = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const;

const FONT_FAMILY = {
  default: 'default',
  merriweather: 'merriweather',
  'intel-one-mono': 'intel-one-mono',
  'finlandica-headline': 'finlandica-headline',
  'indie-flower': 'indie-flower',
} as const;

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(AUTH_PROVIDER)
  authProvider?: 'google' | 'apple' | 'email';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsEnum(FONT_FAMILY)
  fontFamily?:
    | 'default'
    | 'merriweather'
    | 'intel-one-mono'
    | 'finlandica-headline'
    | 'indie-flower';

  @IsOptional()
  @IsEnum(FONT_SIZE)
  fontSize?: 'small' | 'medium' | 'large';
}
