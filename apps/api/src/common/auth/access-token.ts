import { createHmac, timingSafeEqual } from 'node:crypto';

export type AccessTokenClaims = {
  sub: string;
  iat: number;
  exp: number;
};

export function createAccessToken(input: {
  userId: string;
  secret: string;
  ttlSeconds: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenClaims = {
    sub: input.userId,
    iat: now,
    exp: now + Math.max(60, input.ttlSeconds),
  };

  const headerEncoded = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const payloadEncoded = encodeSegment(payload);
  const signature = signSegment(
    `${headerEncoded}.${payloadEncoded}`,
    input.secret,
  );

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export function verifyAccessToken(input: {
  token: string;
  secret: string;
}): AccessTokenClaims | null {
  const segments = input.token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  if (!headerSegment || !payloadSegment || !signatureSegment) {
    return null;
  }

  const expectedSignature = signSegment(
    `${headerSegment}.${payloadSegment}`,
    input.secret,
  );
  if (!safeTimingEqual(signatureSegment, expectedSignature)) {
    return null;
  }

  const header = decodeSegment(headerSegment);
  if (!header || header.alg !== 'HS256' || header.typ !== 'JWT') {
    return null;
  }

  const payload = decodeSegment(payloadSegment) as AccessTokenClaims | null;
  if (!payload || typeof payload.sub !== 'string') {
    return null;
  }
  if (
    !Number.isFinite(payload.iat) ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return payload;
}

function encodeSegment(value: unknown) {
  return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64url');
}

function decodeSegment(value: string) {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf-8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function signSegment(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeTimingEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
