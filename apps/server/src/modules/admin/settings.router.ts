import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import type { ZodTypeAny } from 'zod';
import {
  analyticsSettingsSchema,
  companySettingsSchema,
  footerSettingsSchema,
  heroSettingsSchema,
  navbarSettingsSchema,
  robotsSettingsSchema,
  seoGlobalSettingsSchema,
  themeSettingsSchema,
  type Permission,
} from '@app/shared';
import { audit } from '../../lib/audit.js';
import { AppError, notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { requirePermission } from '../../middleware/rbac.js';

/** Each setting key, its schema and who may change it. SEO settings belong to the SEO Manager. */
const SETTINGS: Record<string, { schema: ZodTypeAny; write: Permission }> = {
  company: { schema: companySettingsSchema, write: 'settings:write' },
  theme: { schema: themeSettingsSchema, write: 'settings:write' },
  navbar: { schema: navbarSettingsSchema, write: 'settings:write' },
  footer: { schema: footerSettingsSchema, write: 'settings:write' },
  hero: { schema: heroSettingsSchema, write: 'content:write' },
  'seo.global': { schema: seoGlobalSettingsSchema, write: 'seo:write' },
  analytics: { schema: analyticsSettingsSchema, write: 'seo:write' },
  robots: { schema: robotsSettingsSchema, write: 'seo:write' },
};

export function settingsRouter(): Router {
  const r = Router();
  r.get(
    '/',
    requirePermission('content:read'),
    asyncHandler(async (_req, res) => {
      const rows = await prisma.setting.findMany();
      return ok(res, Object.fromEntries(rows.map((s) => [s.key, s.value])));
    }),
  );
  r.get(
    '/:key',
    requirePermission('content:read'),
    asyncHandler(async (req, res) => {
      const row = await prisma.setting.findUnique({ where: { key: String(req.params.key) } });
      if (!row) throw notFound();
      return ok(res, row.value);
    }),
  );
  r.put(
    '/:key',
    asyncHandler(async (req, res, next) => {
      const key = String(req.params.key);
      const def = SETTINGS[key];
      if (!def) throw notFound('Unknown setting');
      // Permission depends on the key, so check inline.
      await new Promise<void>((resolve, reject) => requirePermission(def.write)(req, res, (e?: unknown) => (e ? reject(e) : resolve())));
      const parsed = def.schema.safeParse(req.body);
      if (!parsed.success) return next(parsed.error);
      const before = await prisma.setting.findUnique({ where: { key } });
      if (key === 'analytics' && typeof (parsed.data as { customHead?: string }).customHead === 'string') {
        const head = (parsed.data as { customHead: string }).customHead;
        if (head.length > 20_000) throw new AppError(400, 'VALIDATION_ERROR', 'Custom head code is too long');
      }
      const row = await prisma.setting.upsert({
        where: { key },
        update: { value: parsed.data as Prisma.InputJsonValue },
        create: { key, value: parsed.data as Prisma.InputJsonValue },
      });
      await audit(req, 'update', `setting:${key}`, key, { before: before?.value, after: parsed.data as unknown });
      return ok(res, row.value);
    }),
  );
  return r;
}
