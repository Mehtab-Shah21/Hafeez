import type { RequestHandler } from 'express';
import { hasPermission, type Permission } from '@app/shared';
import { forbidden, unauthorized } from '../lib/errors.js';

/** Use after requireAuth. Passes when the user's role grants every listed permission. */
export const requirePermission =
  (...permissions: Permission[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    const role = req.user.role;
    if (!permissions.every((p) => hasPermission(role, p))) return next(forbidden());
    next();
  };
