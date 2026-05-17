import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyAccessToken } from '../auth/access-token';

type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  authUser?: {
    userId: string;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Bearer token gerekli.');
    }

    const secret = this.getAccessTokenSecret();
    const claims = verifyAccessToken({ token, secret });
    if (!claims || !isObjectId(claims.sub)) {
      throw new UnauthorizedException(
        'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.',
      );
    }

    request.authUser = { userId: claims.sub };
    return true;
  }

  private extractBearerToken(raw: string | string[] | undefined) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) {
      return null;
    }

    const [scheme, token] = value.trim().split(/\s+/);
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
      return null;
    }

    return token;
  }

  private getAccessTokenSecret() {
    return (
      this.configService.get<string>('AUTH_ACCESS_TOKEN_SECRET')?.trim() ||
      'local-dev-access-secret'
    );
  }
}

function isObjectId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}
