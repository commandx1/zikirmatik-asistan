import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createAccessToken } from '../auth/access-token';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const secret = 'guard-secret';
  const configService = { get: jest.fn() };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    configService.get.mockReset();
    configService.get.mockImplementation((key: string) =>
      key === 'AUTH_ACCESS_TOKEN_SECRET' ? secret : undefined,
    );
    guard = new JwtAuthGuard(configService as never);
  });

  it('authorization header yoksa 401 fırlatır', () => {
    const request = { headers: {} };
    expect(() => guard.canActivate(contextFor(request))).toThrow(
      UnauthorizedException,
    );
  });

  it("'Basic' şeması reddedilir (yalnızca Bearer kabul edilir)", () => {
    const request = { headers: { authorization: 'Basic abc123' } };
    expect(() => guard.canActivate(contextFor(request))).toThrow(
      UnauthorizedException,
    );
  });

  it('geçersiz imzalı token 401 fırlatır', () => {
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret: 'wrong-secret',
      ttlSeconds: 3600,
    });
    const request = { headers: { authorization: `Bearer ${token}` } };
    expect(() => guard.canActivate(contextFor(request))).toThrow(
      UnauthorizedException,
    );
  });

  it('süresi geçmiş token 401 fırlatır', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000_000);
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 60,
    });
    nowSpy.mockReturnValue(1_000_000_000 + 120_000);

    const request = { headers: { authorization: `Bearer ${token}` } };
    expect(() => guard.canActivate(contextFor(request))).toThrow(
      UnauthorizedException,
    );

    nowSpy.mockRestore();
  });

  it('geçerli token için true döner ve request.authUser.userId set edilir', () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = createAccessToken({ userId, secret, ttlSeconds: 3600 });
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };

    const result = guard.canActivate(contextFor(request));

    expect(result).toBe(true);
    expect(request.authUser).toEqual({ userId });
  });

  it('sub geçerli bir ObjectId değilse 401 fırlatır', () => {
    const token = createAccessToken({
      userId: 'not-an-object-id',
      secret,
      ttlSeconds: 3600,
    });
    const request = { headers: { authorization: `Bearer ${token}` } };

    expect(() => guard.canActivate(contextFor(request))).toThrow(
      UnauthorizedException,
    );
  });

  it('AUTH_ACCESS_TOKEN_SECRET tanımsızsa local-dev-access-secret varsayılanı kullanılır', () => {
    configService.get.mockReturnValue(undefined);
    const userId = '507f1f77bcf86cd799439011';
    const token = createAccessToken({
      userId,
      secret: 'local-dev-access-secret',
      ttlSeconds: 3600,
    });
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUser).toEqual({ userId });
  });
});
