import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProviderVerifyDto } from './dto/provider-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/provider/verify')
  @HttpCode(200)
  verifyProvider(@Body() payload: ProviderVerifyDto) {
    return this.authService.verifyProvider(payload);
  }

  @Post('auth/refresh')
  @HttpCode(200)
  refresh(@Body() payload: RefreshTokenDto) {
    return this.authService.refresh(payload.refreshToken);
  }

  /** A-20: refresh token ailesini iptal eder. Bearer gerekmez; idempotent 204. */
  @Post('auth/logout')
  @HttpCode(204)
  async logout(@Body() payload: RefreshTokenDto): Promise<void> {
    await this.authService.logout(payload.refreshToken);
  }
}
