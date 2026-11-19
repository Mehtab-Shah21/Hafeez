import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { adminInquiryUpdateSchema, adminUserCreateSchema, adminUserUpdateSchema, INQUIRY_STATUSES, INQUIRY_TYPES, ROLE_PERMISSIONS } from '@app/shared';
import { audit } from '../../lib/audit.js';
import { AppError, notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { privateUploadsDir } from '../../lib/storage.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';

/* ------------------------------------------------------------------ Inquiries */

const inquiryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(INQUIRY_STATUSES).optional(),
  type: z.enum(INQUIRY_TYPES).optional(),
  q: z.string().max(100).optional(),
});

const inquiryWhere = (q: z.infer<typeof inquiryQuery>): Prisma.InquiryWhereInput => ({
  ...(q.status ? { status: q.status } : {}),
  ...(q.type ? { type: q.type } : {}),
  ...(q.q ? { OR: [{ name: { contains: q.q } }, { email: { contains: q.q } }, { company: { contains: q.q } }, { phone: { contains: q.q } }] } : {}),
});

/** CSV cell: quote, double quotes, and neutralise spreadsheet formulas (CSV injection). */
const csvCell = (v: unknown) => {
  let s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export function inquiriesRouter(): Router {
  const r = Router();
  r.use(requirePermission('inquiries:manage'));

  r.get(
    '/',
    validate(inquiryQuery, 'query'),
    asyncHandler(async (req, res) => {
      const q = req.query as unknown as z.infer<typeof inquiryQuery>;
      const where = inquiryWhere(q);
      const [total, items] = await Promise.all([
        prisma.inquiry.count({ where }),
        prisma.inquiry.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      ]);
      return ok(res, items, { page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) });
    }),
  );

  r.get(
    '/export.csv',
    validate(inquiryQuery, 'query'),
    asyncHandler(async (req, res) => {
      const q = req.query as unknown as z.infer<typeof inquiryQuery>;
      const rows = await prisma.inquiry.findMany({ where: inquiryWhere(q), orderBy: { createdAt: 'desc' }, take: 10_000 });
      const cols = ['createdAt', 'type', 'status', 'name', 'company', 'phone', 'email', 'serviceType', 'equipmentSlug', 'message', 'payload', 'locale'] as const;
      const csv = [cols.join(','), ...rows.map((row) => cols.map((c) => csvCell(c === 'createdAt' ? row.createdAt.toISOString() : row[c])).join(','))].join('\r\n');
      await audit(req, 'export', 'inquiry', '', { count: rows.length });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send('﻿' + csv); // BOM so Excel opens Arabic text correctly
    }),
  );

  r.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const item = await prisma.inquiry.findUnique({ where: { id: String(req.params.id) } });
      if (!item) throw notFound();
      return ok(res, item);
    }),
  );

  r.get(
    '/:id/attachment',
    asyncHandler(async (req, res) => {
      const item = await prisma.inquiry.findUnique({ where: { id: String(req.params.id) } });
      if (!item?.attachmentId || !/^[0-9a-f-]+\.(pdf|png|jpeg|webp)$/.test(item.attachmentId)) throw notFound();
      res.setHeader('Content-Disposition', `attachment; filename="${item.attachmentId}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(resolve(privateUploadsDir, item.attachmentId), (err) => {
        if (err && !res.headersSent) res.status(404).end();
      });
    }),
  );

  r.patch(
    '/:id',
    validate(adminInquiryUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const body = req.body as z.infer<typeof adminInquiryUpdateSchema>;
      const item = await prisma.inquiry.findUnique({ where: { id } });
      if (!item) throw notFound();
      const notes = Array.isArray(item.notes) ? (item.notes as unknown[]) : [];
      const updated = await prisma.inquiry.update({
        where: { id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.note ? { notes: [...notes, { at: new Date().toISOString(), by: req.user?.name ?? '', text: body.note }] as Prisma.InputJsonValue } : {}),
        },
      });
      await audit(req, 'update', 'inquiry', id, body);
      return ok(res, updated);
    }),
  );
  return r;
}

/* ------------------------------------------------------------------ Users */

export function usersRouter(): Router {
  const r = Router();
  r.use(requirePermission('users:manage'));
  const select = { id: true, email: true, name: true, isActive: true, lastLoginAt: true, createdAt: true, role: { select: { key: true } } } as const;
  const shape = ({ role, ...u }: { role: { key: string } } & Record<string, unknown>) => ({ ...u, role: role.key });
  const roleId = async (key: string) => (await prisma.role.findUniqueOrThrow({ where: { key } })).id;

  r.get('/', asyncHandler(async (_req, res) => ok(res, (await prisma.user.findMany({ select, orderBy: { createdAt: 'asc' } })).map(shape))));

  r.post(
    '/',
    validate(adminUserCreateSchema),
    asyncHandler(async (req, res) => {
      const b = req.body as z.infer<typeof adminUserCreateSchema>;
      const u = await prisma.user
        .create({ data: { email: b.email, name: b.name, isActive: b.isActive, roleId: await roleId(b.role), passwordHash: await bcrypt.hash(b.password, 12) }, select })
        .catch(() => {
          throw new AppError(409, 'CONFLICT', 'A user with this email already exists');
        });
      await audit(req, 'create', 'user', u.id, { email: b.email, role: b.role });
      return ok(res, shape(u), undefined, 201);
    }),
  );

  r.put(
    '/:id',
    validate(adminUserUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const b = req.body as z.infer<typeof adminUserUpdateSchema>;
      // Never let the last active Super Admin lock everyone out.
      if (id === req.user?.id && (b.isActive === false || (b.role && b.role !== 'SUPER_ADMIN'))) {
        throw new AppError(400, 'VALIDATION_ERROR', 'You cannot deactivate or demote your own account');
      }
      const u = await prisma.user.update({
        where: { id },
        data: {
          ...(b.email ? { email: b.email } : {}),
          ...(b.name ? { name: b.name } : {}),
          ...(b.isActive !== undefined ? { isActive: b.isActive } : {}),
          ...(b.role ? { roleId: await roleId(b.role) } : {}),
          ...(b.password ? { passwordHash: await bcrypt.hash(b.password, 12) } : {}),
        },
        select,
      });
      // Password or access change: end that user's existing sessions.
      if (b.password || b.isActive === false || b.role) {
        await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await audit(req, 'update', 'user', id, { ...b, password: b.password ? '[changed]' : undefined });
      return ok(res, shape(u));
    }),
  );

  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      if (id === req.user?.id) throw new AppError(400, 'VALIDATION_ERROR', 'You cannot delete your own account');
      await prisma.user.delete({ where: { id } });
      await audit(req, 'delete', 'user', id);
      return ok(res, { deleted: true });
    }),
  );

  r.get('/roles/list', (_req, res) => ok(res, Object.entries(ROLE_PERMISSIONS).map(([key, permissions]) => ({ key, permissions }))));
  return r;
}

/* ------------------------------------------------------------------ Audit log + dashboard */

export function systemRouter(): Router {
  const r = Router();
  r.get(
    '/audit-log',
    requirePermission('audit:read'),
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1);
      const pageSize = 50;
      const [total, items] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } }, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      return ok(res, items, { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    }),
  );

  r.get(
    '/dashboard/summary',
    requirePermission('content:read'),
    asyncHandler(async (_req, res) => {
      const since = new Date(Date.now() - 30 * 86_400_000);
      const [newInquiries, quotes30, total30, recentInquiries, recentActivity, seo, services, equipment, posts, notFound] = await Promise.all([
        prisma.inquiry.count({ where: { status: 'NEW' } }),
        prisma.inquiry.count({ where: { type: 'quote', createdAt: { gte: since } } }),
        prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
        prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, type: true, status: true, createdAt: true, company: true } }),
        prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true } } } }),
        prisma.seoMeta.findMany({ select: { title: true, description: true, score: true } }),
        prisma.service.count(),
        prisma.equipment.count(),
        prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
        prisma.notFoundLog.count(),
      ]);
      const scored = seo.filter((s) => s.score > 0);
      return ok(res, {
        newInquiries,
        quotes30,
        total30,
        recentInquiries,
        recentActivity,
        counts: { services, equipment, posts },
        seo: {
          entries: seo.length,
          avgScore: scored.length ? Math.round(scored.reduce((n, s) => n + s.score, 0) / scored.length) : null,
          missingDescription: seo.filter((s) => !s.description.trim()).length,
          titleOutOfRange: seo.filter((s) => s.title.length < 30 || s.title.length > 65).length,
          notFound,
        },
      });
    }),
  );
  return r;
}
