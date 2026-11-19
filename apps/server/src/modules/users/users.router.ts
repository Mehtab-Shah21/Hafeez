import { Router } from 'express';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { requirePermission } from '../../middleware/rbac.js';

/** Minimal users module (list only). Full CRUD arrives with the admin panel in Step 6. */
export function usersRouter(): Router {
  const router = Router();
  router.get(
    '/',
    requirePermission('users:manage'),
    asyncHandler(async (_req, res) => {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, isActive: true, lastLoginAt: true, role: { select: { key: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return ok(res, users.map(({ role, ...u }) => ({ ...u, role: role.key })));
    }),
  );
  return router;
}
