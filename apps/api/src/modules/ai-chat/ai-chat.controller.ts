import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiPipelineExceptionFilter } from '../ai/ai-pipeline.filter';
import { resolveAiRecommendationLocale } from '../ai/utils/locale';
import { AiChatService } from './ai-chat.service';
import { CreateChatConversationDto } from './dto/create-chat-conversation.dto';
import { QueryPaginationDto } from './dto/query-pagination.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

/**
 * `AiPipelineExceptionFilter` sınıf seviyesinde uygulanır: REST rotaları
 * (createConversation, sendMessage, listConversations, listMessages) için
 * `AiPipelineError` fırlatıldığında standart 503 gövdesine çevrilir. SSE
 * rotaları (@Res() ile manuel yanıt yazan createConversationStream/
 * sendMessageStream) kendi hata yönetimini (AiChatService.handleStreamFailure)
 * içeride yapar ve Nest'in filter zincirine hiç düşmez — bu filter onlar için
 * etkisizdir, zararsızdır.
 */
@Controller('v1/ai/chat')
@UseGuards(JwtAuthGuard)
@UseFilters(AiPipelineExceptionFilter)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('conversations')
  createConversation(
    @Body() payload: CreateChatConversationDto,
    @CurrentUserId() userId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale =
      payload.locale ?? resolveAiRecommendationLocale(acceptLanguage);
    return this.aiChatService.createConversation(userId, {
      firstMessage: payload.firstMessage,
      locale,
      socketId: payload.socketId,
    });
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() payload: SendChatMessageDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiChatService.sendMessage(userId, id, payload);
  }

  /**
   * SSE ile token-token akan yanıt üretir. REST karşılığı (yukarıdaki
   * createConversation) yerinde bırakılır — mobil fallback/non-stream
   * durumlarda hâlâ onu kullanabilir. Guard ve DTO validasyonu normal
   * çalışır; yalnızca yanıt @Res() ile manuel yazılır çünkü Nest'in
   * response interceptor/exception filter zinciri SSE akışıyla uyumlu değil.
   */
  @Post('conversations/stream')
  async createConversationStream(
    @Body() payload: CreateChatConversationDto,
    @CurrentUserId() userId: string,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const locale =
      payload.locale ?? resolveAiRecommendationLocale(acceptLanguage);
    await this.aiChatService.streamCreateConversation(
      userId,
      {
        firstMessage: payload.firstMessage,
        locale,
        socketId: payload.socketId,
      },
      req,
      res,
    );
  }

  /** bkz. createConversationStream — aynı SSE deseni, var olan konuşma için. */
  @Post('conversations/:id/messages/stream')
  async sendMessageStream(
    @Param('id') id: string,
    @Body() payload: SendChatMessageDto,
    @CurrentUserId() userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.aiChatService.streamSendMessage(userId, id, payload, req, res);
  }

  @Get('conversations')
  listConversations(
    @Query() query: QueryPaginationDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiChatService.listConversations(
      userId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('conversations/:id/messages')
  listMessages(
    @Param('id') id: string,
    @Query() query: QueryPaginationDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiChatService.listMessages(
      userId,
      id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
