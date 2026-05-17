import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUserId() userId: string) {
    assertSelfUser(id, userId);
    return this.usersService.getUserById(id);
  }

  @Patch(':id/onboarding')
  saveOnboarding(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() payload: UpdateOnboardingDto,
  ) {
    assertSelfUser(id, userId);
    return this.usersService.saveOnboarding(id, payload);
  }

  @Patch(':id/preferences')
  savePreferences(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() payload: UpdateUserPreferencesDto,
  ) {
    assertSelfUser(id, userId);
    return this.usersService.savePreferences(id, payload);
  }
}

function assertSelfUser(targetUserId: string, currentUserId: string) {
  if (targetUserId !== currentUserId) {
    throw new ForbiddenException('Sadece kendi kullanıcı kaydını yönetebilirsin.');
  }
}
