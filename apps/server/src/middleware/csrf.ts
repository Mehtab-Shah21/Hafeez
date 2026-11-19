import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { RequestHandler, Response } from 'express';
import { ERROR_CODES } from '@app/shared';
import { env, isProd } from '../config/env.js';
import { AppError } from '../lib/errors.js';

/**
 * Double-submit CSRF: a signed random token sits in a readable cookie and must be echoed in the
 * `x-csrf-token` header on every state-changing request. A cross-site attacker can make the browser
 * send the cookie but cannot read it to set the header. The HMAC stops a cookie planted by a
 * sibling subdomain from being accepted.
 */
export const CSRF_COOKIE = 'csrf';
export const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const sign = (nonce: string) => createHmac('sha256', env.CSRF_SECRET).update(nonce).digest('base64url');

export const issueCsrfToken = (res: Response): string => {
  const nonce = randomBytes(24).toString('base64url');
  const token = `${nonce}.${sign(nonce)}`;
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
  return token;
};

const isValidToken = (token: string): boolean => {
  const [nonce, mac] = token.split('.');
  if (!nonce || !mac) return false;
  const expected = Buffer.from(sign(nonce));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
};

export const requireCsrf: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookie: unknown = req.cookies?.[CSRF_COOKIE];
  const header = req.get(CSRF_HEADER);
  if (typeof cookie !== 'string' || !header || cookie !== header || !isValidToken(header)) {
    return next(new AppError(403, ERROR_CODES.CSRF, 'Missing or invalid CSRF token'));
  }
  next();
};
