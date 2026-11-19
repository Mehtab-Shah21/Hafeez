import type { RequestHandler } from 'express';
import { isRole, type AuthUser } from '@app/shared';
import { unauthorized } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../modules/auth/tokens.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Requires a valid access-token cookie for an active user; attaches `req.user`. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[ACCESS_COOKIE];
  if (typeof token !== 'string' || !token) return next(unauthorized());

  const payload = verifyAccessToken(token);
  if (!payload) return next(unauthorized('Session expired'));

  // Re-check the user on each request so deactivation or a role change applies immediately.
  prisma.user
    .findUnique({ where: { id: payload.sub }, include: { role: true } })
    .then((user) => {
      if (!user || !user.isActive || !isRole(user.role.key)) return next(unauthorized());
      req.user = { id: user.id, email: user.email, name: user.name, role: user.role.key };
      next();
    })
    .catch(next);
};
