import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiCreditsService } from './ai-credits.service';
import { AiPipelineExceptionFilter } from './ai-pipeline.filter';
import { AiService } from './ai.service';
import { AiVirdService } from './ai-vird.service';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { CreateAiVirdProgramDto } from './dto/create-ai-vird-program.dto';
import { QueryAiRecommendationsDto } from './dto/query-ai-recommendations.dto';
import { SelectAiRecommendationDto } from './dto/select-ai-recommendation.dto';
import { resolveAiRecommendationLocale } from './utils/locale';

@Controller('v1/ai')
@UseGuards(JwtAuthGuard)
@UseFilters(AiPipelineExceptionFilter)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiCreditsService: AiCreditsService,
    private readonly aiVirdService: AiVirdService,
  ) {}

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
    return this.aiCreditsService.getDailyQuota(userId);
  }

  @Get('credits')
  getCredits(@CurrentUserId() userId: string) {
    return this.aiCreditsService.getCredits(userId);
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

  @Post('vird-programs')
  createVirdProgram(
    @Body() payload: CreateAiVirdProgramDto,
    @CurrentUserId() userId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const locale =
      payload.locale ?? resolveAiRecommendationLocale(acceptLanguage);
    return this.aiVirdService.createVirdProgram(userId, payload, locale);
  }
}
