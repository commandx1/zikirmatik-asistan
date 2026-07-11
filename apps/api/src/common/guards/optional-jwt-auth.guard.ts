import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyAccessToken } from '../auth/access-token';

type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  authUser?: {
    userId: string;
  };
};

// Same bearer-token parsing as JwtAuthGuard, but never rejects the request.
// Used by endpoints that must work for guests (no token) while still
// linking the caller's user when a valid token is present.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      return true;
    }

    const secret = this.getAccessTokenSecret();
    const claims = verifyAccessToken({ token, secret });
    if (claims && isObjectId(claims.sub)) {
      request.authUser = { userId: claims.sub };
    }

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
