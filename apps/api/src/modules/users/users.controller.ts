import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() payload: CreateUserDto) {
    return this.usersService.createUser(payload);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/onboarding')
  saveOnboarding(
    @Param('id') id: string,
    @Body() payload: UpdateOnboardingDto,
  ) {
    return this.usersService.saveOnboarding(id, payload);
  }

  @Patch(':id/preferences')
  savePreferences(
    @Param('id') id: string,
    @Body() payload: UpdateUserPreferencesDto,
  ) {
    return this.usersService.savePreferences(id, payload);
  }
}
