import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

// Protects the internal campaign trigger endpoints. The caller (GitHub
// Actions cron, or a manual curl) must send the shared secret in the
// `x-campaign-secret` header, matching the CAMPAIGN_TRIGGER_SECRET env var.
@Injectable()
export class CampaignTriggerGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('CAMPAIGN_TRIGGER_SECRET');
    if (!secret) {
      // Not configured → endpoints are disabled, never open.
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-campaign-secret'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (!provided) {
      throw new UnauthorizedException();
    }

    const expected = Buffer.from(secret);
    const actual = Buffer.from(provided);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
