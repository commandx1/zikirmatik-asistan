import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { QueryAiRecommendationsDto } from './dto/query-ai-recommendations.dto';
import { SelectAiRecommendationDto } from './dto/select-ai-recommendation.dto';
import { resolveAiRecommendationLocale } from './utils/locale';

@Controller('v1/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  createRecommendation(
    @Body() payload: CreateAiRecommendationDto,
    @CurrentUserId() userId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    payload.userId = userId;
    const locale = resolveAiRecommendationLocale(acceptLanguage);
    return this.aiService.createRecommendation(payload, locale);
  }

  @Get('quota')
  getDailyQuota(@CurrentUserId() userId: string) {
    return this.aiService.getDailyQuota(userId);
  }

  @Get('credits')
  getCredits(@CurrentUserId() userId: string) {
    return this.aiService.getCredits(userId);
  }

  @Get('recommendations')
  listRecommendations(
    @Query() query: QueryAiRecommendationsDto,
    @CurrentUserId() userId: string,
  ) {
    query.userId = userId;
    return this.aiService.listRecommendations(query);
  }

  @Patch('recommendations/:id/select')
  selectRecommendation(
    @Param('id') id: string,
    @Body() payload: SelectAiRecommendationDto,
    @CurrentUserId() userId: string,
  ) {
    return this.aiService.selectRecommendation(id, payload, userId);
  }
}
