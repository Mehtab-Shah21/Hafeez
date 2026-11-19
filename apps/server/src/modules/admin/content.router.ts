import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import {
  adminBlogSchema,
  adminClientSchema,
  adminEquipmentCategorySchema,
  adminEquipmentSchema,
  adminFaqSchema,
  adminFleetSchema,
  adminPageSchema,
  adminProjectSchema,
  adminRedirectSchema,
  adminSectionSchema,
  adminServiceSchema,
  adminTeamSchema,
  adminTestimonialSchema,
} from '@app/shared';
import { audit } from '../../lib/audit.js';
import { notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { sanitizeRichText } from '../../lib/sanitize.js';
import { invalidateRedirectCache } from '../../middleware/redirects.js';
import { requirePermission } from '../../middleware/rbac.js';
import { crudRouter, type Delegate } from './crud.js';

const d = (x: unknown) => x as Delegate;
const json = (v: unknown) => v as Prisma.InputJsonValue;

/** All content CRUD modules, mounted under /api/admin. */
export function contentRouter(): Router {
  const r = Router();

  r.use('/services', crudRouter({ entity: 'service', delegate: d(prisma.service), schema: adminServiceSchema, search: ['slug'], orderBy: { order: 'asc' }, include: { image: true }, orderable: true }));
  r.use('/equipment-categories', crudRouter({ entity: 'category', delegate: d(prisma.equipmentCategory), schema: adminEquipmentCategorySchema, search: ['slug'], orderBy: { order: 'asc' }, orderable: true }));
  r.use(
    '/equipment',
    crudRouter({
      entity: 'equipment',
      delegate: d(prisma.equipment),
      schema: adminEquipmentSchema,
      search: ['slug'],
      orderBy: { order: 'asc' },
      orderable: true,
      include: { category: true, images: { include: { media: true }, orderBy: { order: 'asc' } } },
      // Gallery: replace the image join rows with the submitted ordered list.
      toData: ({ imageIds, ...rest }, id) => ({
        ...rest,
        content: json(rest.content),
        images: { ...(id ? { deleteMany: {} } : {}), create: imageIds.map((mediaId, order) => ({ mediaId, order })) },
      }),
    }),
  );
  r.use('/fleet', crudRouter({ entity: 'fleet', delegate: d(prisma.fleetType), schema: adminFleetSchema, search: ['slug'], orderBy: { order: 'asc' }, include: { image: true }, orderable: true }));
  r.use('/clients', crudRouter({ entity: 'client', delegate: d(prisma.client), schema: adminClientSchema, search: ['name'], orderBy: { order: 'asc' }, include: { logo: true }, orderable: true }));
  r.use('/testimonials', crudRouter({ entity: 'testimonial', delegate: d(prisma.testimonial), schema: adminTestimonialSchema, search: ['company'], orderBy: { order: 'asc' }, include: { avatar: true }, orderable: true }));
  r.use('/projects', crudRouter({ entity: 'project', delegate: d(prisma.project), schema: adminProjectSchema, search: ['slug'], orderBy: [{ featured: 'desc' }, { year: 'desc' }], include: { cover: true } }));
  r.use('/team', crudRouter({ entity: 'team', delegate: d(prisma.teamMember), schema: adminTeamSchema, orderBy: { order: 'asc' }, include: { photo: true }, orderable: true }));
  r.use('/faqs', crudRouter({ entity: 'faq', delegate: d(prisma.faq), schema: adminFaqSchema, search: ['group'], orderBy: [{ group: 'asc' }, { order: 'asc' }], orderable: true }));
  r.use(
    '/blog',
    crudRouter({
      entity: 'blog',
      delegate: d(prisma.blogPost),
      schema: adminBlogSchema,
      search: ['slug'],
      orderBy: { updatedAt: 'desc' },
      include: { cover: true },
      // Rich text is sanitised on save (and again on read in the public service).
      toData: (v) => ({
        ...v,
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : v.status === 'PUBLISHED' ? new Date() : null,
        content: json({
          en: { ...v.content.en, bodyHtml: sanitizeRichText(v.content.en.bodyHtml) },
          ar: { ...v.content.ar, bodyHtml: sanitizeRichText(v.content.ar.bodyHtml) },
        }),
      }),
    }),
  );
  r.use('/pages', crudRouter({ entity: 'page', delegate: d(prisma.page), schema: adminPageSchema, search: ['key'], orderBy: { key: 'asc' }, include: { sections: { orderBy: { order: 'asc' } } } }));
  r.use(
    '/redirects',
    crudRouter({ entity: 'redirect', delegate: d(prisma.redirect), schema: adminRedirectSchema, write: 'seo:write', search: ['from', 'to'], orderBy: { createdAt: 'desc' }, after: () => invalidateRedirectCache() }),
  );

  // Sections: edits go to draftContent; publishing copies the draft live.
  r.use(
    '/sections',
    crudRouter({
      entity: 'section',
      delegate: d(prisma.section),
      schema: adminSectionSchema,
      orderBy: { order: 'asc' },
      orderable: true,
      toData: (v) => ({ ...v, draftContent: json(v.draftContent), status: 'DRAFT' }),
    }),
  );
  r.post(
    '/sections/:id/publish',
    requirePermission('content:write'),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const s = await prisma.section.findUnique({ where: { id } });
      if (!s) throw notFound();
      const updated = await prisma.section.update({
        where: { id },
        data: { content: json(s.draftContent ?? s.content), draftContent: undefined, status: 'PUBLISHED' },
      });
      await audit(req, 'publish', 'section', id);
      return ok(res, updated);
    }),
  );
  return r;
}
