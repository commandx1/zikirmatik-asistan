import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AdminSecretGuard } from './admin-secret.guard';

function run(secret: string | undefined, header?: string) {
  const config = { get: () => secret } as unknown as ConfigService;
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: header === undefined ? {} : { 'x-admin-secret': header },
      }),
    }),
  } as unknown as ExecutionContext;
  return () => new AdminSecretGuard(config).canActivate(context);
}

describe('AdminSecretGuard', () => {
  it('env yoksa doğru görünen header ile bile 401 (fail-closed)', () => {
    expect(run(undefined, '')).toThrow(UnauthorizedException);
    expect(run('', 'x')).toThrow(UnauthorizedException);
  });

  it('header yok veya yanlış → 401', () => {
    expect(run('s3cret')).toThrow(UnauthorizedException);
    expect(run('s3cret', 'wrong')).toThrow(UnauthorizedException);
  });

  it('doğru header → true', () => {
    expect(run('s3cret', 's3cret')()).toBe(true);
  });
});
