import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDhikrDto } from './dto/create-user-dhikr.dto';
import { UpdateUserDhikrDto } from './dto/update-user-dhikr.dto';
import { UserDhikrsService } from './user-dhikrs.service';

@Controller('v1/user-dhikrs')
@UseGuards(JwtAuthGuard)
export class UserDhikrsController {
  constructor(private readonly userDhikrsService: UserDhikrsService) {}

  @Post()
  create(@Body() payload: CreateUserDhikrDto, @CurrentUserId() userId: string) {
    return this.userDhikrsService.createOrUpdate(userId, payload);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.userDhikrsService.findAll(userId);
  }

  @Patch(':clientId')
  update(
    @Param('clientId') clientId: string,
    @Body() payload: UpdateUserDhikrDto,
    @CurrentUserId() userId: string,
  ) {
    return this.userDhikrsService.updateByClientId(userId, clientId, payload);
  }

  @Delete(':clientId')
  remove(@Param('clientId') clientId: string, @CurrentUserId() userId: string) {
    return this.userDhikrsService.removeByClientId(userId, clientId);
  }
}
