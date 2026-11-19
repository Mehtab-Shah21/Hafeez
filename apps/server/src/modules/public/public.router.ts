import { createHash } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  DEFAULT_LOCALE,
  ERROR_CODES,
  inquiryCreateSchema,
  isLocale,
  type ApiFailure,
  type InquiryCreateInput,
  type Locale,
  type TrackingDTO,
} from '@app/shared';
import { notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middleware/validate.js';
import { publicService as svc } from './public.service.js';

const langOf = (q: unknown): Locale => {
  const l = (q as { lang?: unknown } | undefined)?.lang;
  return isLocale(l) ? l : DEFAULT_LOCALE;
};

/** Public content changes rarely: short browser cache, longer stale-while-revalidate. ETag handles revalidation. */
const cacheable: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
  res.vary('Accept-Language');
  next();
};

const equipmentQuerySchema = z.object({
  lang: z.string().optional(),
  category: z.string().max(60).optional(),
  capacityMin: z.coerce.number().min(0).optional(),
  capacityMax: z.coerce.number().min(0).optional(),
  operator: z.enum(['with', 'without']).optional(),
  featured: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const trackIdSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9-]{4,40}$/) });

export interface PublicRouterOptions {
  inquiryMax: number;
  inquiryWindowMs: number;
}

export function publicRouter({ inquiryMax, inquiryWindowMs }: PublicRouterOptions): Router {
  const r = Router();

  r.get('/settings', cacheable, asyncHandler(async (req, res) => ok(res, await svc.settings(langOf(req.query)))));

  r.get(
    '/pages/:slug',
    cacheable,
    asyncHandler(async (req, res) => {
      const page = await svc.page(String(req.params.slug), langOf(req.query));
      if (!page) throw notFound('Page not found');
      return ok(res, page);
    }),
  );

  r.get('/services', cacheable, asyncHandler(async (req, res) => ok(res, await svc.services(langOf(req.query)))));
  r.get(
    '/services/:slug',
    cacheable,
    asyncHandler(async (req, res) => {
      const item = await svc.service(String(req.params.slug), langOf(req.query));
      if (!item) throw notFound('Service not found');
      return ok(res, item);
    }),
  );

  r.get('/equipment-categories', cacheable, asyncHandler(async (req, res) => ok(res, await svc.equipmentCategories(langOf(req.query)))));
  r.get(
    '/equipment',
    cacheable,
    validate(equipmentQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const { lang, ...q } = req.query as z.infer<typeof equipmentQuerySchema>;
      const result = await svc.equipment(isLocale(lang) ? lang : DEFAULT_LOCALE, q);
      return ok(res, result.items, result.meta);
    }),
  );
  r.get(
    '/equipment/:slug',
    cacheable,
    asyncHandler(async (req, res) => {
      const item = await svc.equipmentItem(String(req.params.slug), langOf(req.query));
      if (!item) throw notFound('Equipment not found');
      return ok(res, item);
    }),
  );

  r.get('/fleet', cacheable, asyncHandler(async (req, res) => ok(res, await svc.fleet(langOf(req.query)))));
  r.get('/clients', cacheable, asyncHandler(async (req, res) => ok(res, await svc.clients(langOf(req.query)))));
  r.get('/testimonials', cacheable, asyncHandler(async (req, res) => ok(res, await svc.testimonials(langOf(req.query)))));
  r.get('/projects', cacheable, asyncHandler(async (req, res) => ok(res, await svc.projects(langOf(req.query)))));
  r.get(
    '/projects/:slug',
    cacheable,
    asyncHandler(async (req, res) => {
      const item = await svc.project(String(req.params.slug), langOf(req.query));
      if (!item) throw notFound('Project not found');
      return ok(res, item);
    }),
  );
  r.get(
    '/blog',
    cacheable,
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Number((req.query as { page?: string }).page) || 1);
      const result = await svc.blog(langOf(req.query), page);
      return ok(res, result.items, result.meta);
    }),
  );
  r.get(
    '/blog/:slug',
    cacheable,
    asyncHandler(async (req, res) => {
      const item = await svc.blogPost(String(req.params.slug), langOf(req.query));
      if (!item) throw notFound('Post not found');
      return ok(res, item);
    }),
  );
  r.get(
    '/faqs',
    cacheable,
    asyncHandler(async (req, res) => {
      const group = (req.query as { group?: unknown }).group;
      return ok(res, await svc.faqs(langOf(req.query), typeof group === 'string' ? group : undefined));
    }),
  );

  // ---- Inquiries: rate limited per IP, honeypot, Zod. File upload is added with the contact page (Step 5).
  const inquiryLimiter = rateLimit({
    windowMs: inquiryWindowMs,
    limit: inquiryMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      const body: ApiFailure = { ok: false, error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests. Please call or WhatsApp us instead.' } };
      res.status(429).json(body);
    },
  });

  // Honeypot runs before validation so bots get the same 201 as people and learn nothing.
  const honeypot: RequestHandler = (req, res, next) => {
    const website = (req.body as { website?: unknown } | undefined)?.website;
    if (typeof website === 'string' && website.length > 0) {
      res.status(201).json({ ok: true, data: { received: true } });
      return;
    }
    next();
  };

  r.post(
    '/inquiries',
    inquiryLimiter,
    honeypot,
    validate(inquiryCreateSchema),
    asyncHandler(async (req, res) => {
      const input = req.body as InquiryCreateInput;
      const ipHash = createHash('sha256').update(req.ip ?? '').digest('hex').slice(0, 32);
      const row = await prisma.inquiry.create({
        data: {
          type: input.type,
          name: input.name,
          company: input.company,
          phone: input.phone,
          email: input.email,
          serviceType: input.serviceType,
          equipmentSlug: input.equipmentSlug,
          message: input.message,
          locale: input.locale,
          payload: input.booking ?? {},
          notes: [],
          ipHash,
          userAgent: (req.get('user-agent') ?? '').slice(0, 300),
        },
      });
      // Email notification is wired in Step 5 (Nodemailer); the inbox shows it immediately.
      return ok(res, { received: true, reference: row.id.slice(-8).toUpperCase() }, undefined, 201);
    }),
  );

  // ---- Tracking: a clean stub so the UI can be built now. Replace with the real carrier lookup later.
  r.get(
    '/track/:id',
    validate(trackIdSchema, 'params'),
    (req, res) => {
      const id = String(req.params.id).toUpperCase();
      const steps: TrackingDTO['status'][] = ['booked', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'];
      const reached = [...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % steps.length;
      const now = Date.now();
      const places = ['Jebel Ali, Dubai', 'Al Quoz hub, Dubai', 'Sheikh Mohammed bin Zayed Rd', 'Industrial Area 13, Sharjah', 'Delivered to recipient'];
      const dto: TrackingDTO = {
        id,
        status: steps[reached]!,
        isDemo: true,
        events: steps.slice(0, reached + 1).map((s, i) => ({
          at: new Date(now - (reached - i) * 3 * 3600_000).toISOString(),
          status: s,
          location: places[i]!,
        })),
      };
      res.set('Cache-Control', 'no-store');
      return ok(res, dto);
    },
  );

  return r;
}
