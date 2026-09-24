import { ExecutionContext } from '@nestjs/common';
import { createAccessToken } from '../auth/access-token';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('OptionalJwtAuthGuard', () => {
  const secret = 'optional-guard-secret';
  const configService = { get: jest.fn() };
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    configService.get.mockReset();
    configService.get.mockImplementation((key: string) =>
      key === 'AUTH_ACCESS_TOKEN_SECRET' ? secret : undefined,
    );
    guard = new OptionalJwtAuthGuard(configService as never);
  });

  it('token yoksa true döner ve authUser set edilmez', () => {
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: {},
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUser).toBeUndefined();
  });

  it('geçersiz token ile true döner ama authUser set edilmez (guest gibi davranır)', () => {
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret: 'wrong-secret',
      ttlSeconds: 3600,
    });
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUser).toBeUndefined();
  });

  it('geçerli token ile true döner ve authUser.userId set edilir', () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = createAccessToken({ userId, secret, ttlSeconds: 3600 });
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUser).toEqual({ userId });
  });

  it("'Basic' şeması ile true döner ama authUser set edilmez", () => {
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: { authorization: 'Basic abc123' },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUser).toBeUndefined();
  });

  it('sub geçerli ObjectId değilse authUser set edilmez', () => {
    const token = createAccessToken({
      userId: 'not-an-object-id',
      secret,
      ttlSeconds: 3600,
    });
    const request: { headers: Record<string, string>; authUser?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUser).toBeUndefined();
  });
});
