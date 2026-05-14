import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { QueryAiRecommendationsDto } from './dto/query-ai-recommendations.dto';
import { SelectAiRecommendationDto } from './dto/select-ai-recommendation.dto';

@Controller('v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  createRecommendation(@Body() payload: CreateAiRecommendationDto) {
    return this.aiService.createRecommendation(payload);
  }

  @Get('recommendations')
  listRecommendations(@Query() query: QueryAiRecommendationsDto) {
    return this.aiService.listRecommendations(query);
  }

  @Patch('recommendations/:id/select')
  selectRecommendation(
    @Param('id') id: string,
    @Body() payload: SelectAiRecommendationDto,
  ) {
    return this.aiService.selectRecommendation(id, payload);
  }
}
