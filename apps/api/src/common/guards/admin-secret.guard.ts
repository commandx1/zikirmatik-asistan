import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Katalog yazma rotaları (dhikrs, special-days) için `x-admin-secret` ↔
 * ADMIN_API_SECRET. Fail-closed: env boşsa HER ortamda 401 (dev bypass yok).
 */
@Injectable()
export class AdminSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const expected = this.configService.get<string>('ADMIN_API_SECRET')?.trim();
    const header = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>()
      .headers['x-admin-secret'];
    const given = typeof header === 'string' ? header.trim() : '';

    if (!expected || !given || !safeEquals(given, expected)) {
      throw new UnauthorizedException('Geçersiz admin secret.');
    }
    return true;
  }
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
