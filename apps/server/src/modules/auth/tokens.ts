import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { isRole, type RoleKey } from '@app/shared';
import { env, isProd } from '../../config/env.js';

export const ACCESS_COOKIE = 'access';
export const REFRESH_COOKIE = 'refresh';
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** The refresh cookie is only ever sent to the auth endpoints. */
export const REFRESH_COOKIE_PATH = '/api/admin/auth';

interface AccessPayload {
  sub: string;
  role: RoleKey;
}

export const signAccessToken = (userId: string, role: RoleKey): string =>
  jwt.sign({ role }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: ACCESS_TTL_SECONDS,
    algorithm: 'HS256',
  });

export const verifyAccessToken = (token: string): AccessPayload | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || !isRole(decoded.role)) return null;
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
};

/**
 * Refresh tokens are opaque random strings, not JWTs: they are looked up in the DB anyway,
 * and only their SHA-256 hash is stored, so a DB leak cannot be replayed.
 */
export const newRefreshToken = () => randomBytes(48).toString('base64url');
export const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');

const baseCookie = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookie(), path: '/', maxAge: ACCESS_TTL_SECONDS * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseCookie(), path: REFRESH_COOKIE_PATH, maxAge: REFRESH_TTL_MS });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: REFRESH_COOKIE_PATH });
};
