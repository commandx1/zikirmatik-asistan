import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  socketId?: string;
}
