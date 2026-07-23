import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChatConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  firstMessage!: string;

  @IsOptional()
  @IsIn(['tr', 'en'])
  locale?: 'tr' | 'en';

  @IsOptional()
  @IsString()
  socketId?: string;
}
