import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { type z } from 'zod';
import { LOCALES, SEO_ENTITY_TYPES, isLocale, seoMetaSchema, type Locale } from '@app/shared';
import { audit } from '../../lib/audit.js';
import { AppError, notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { listSeoEntities, type SeoEntity } from '../../lib/seo/entities.js';
import { scoreSeo } from '../../lib/seo/score.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';

const metaInput = seoMetaSchema.omit({ entityType: true, entityId: true, locale: true });

function langParam(v: unknown): Locale {
  if (!isLocale(v)) throw new AppError(400, 'VALIDATION_ERROR', 'Unknown locale');
  return v;
}

async function findEntity(type: string, id: string, lang: Locale): Promise<SeoEntity> {
  const e = (await listSeoEntities(lang)).find((x) => x.type === type && x.id === id);
  if (!e) throw notFound('Unknown SEO entity');
  return e;
}

/** Levenshtein distance for 404 → redirect suggestions. */
function distance(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n]!;
}

export function seoRouter(): Router {
  const r = Router();

  // Bulk table: every entity × locale with its meta and score.
  r.get(
    '/entities',
    requirePermission('content:read'),
    asyncHandler(async (_req, res) => {
      const rows = await prisma.seoMeta.findMany();
      const byKey = new Map(rows.map((m) => [`${m.entityType}:${m.entityId}:${m.locale}`, m]));
      const out = [];
      for (const lang of LOCALES) {
        for (const e of await listSeoEntities(lang)) {
          const m = byKey.get(`${e.type}:${e.id}:${lang}`);
          out.push({ type: e.type, id: e.id, locale: lang, name: e.name, path: `/${lang}${e.path}`, title: m?.title ?? '', description: m?.description ?? '', focusKeyword: m?.focusKeyword ?? '', robotsIndex: m?.robotsIndex ?? true, score: m?.score ?? 0 });
        }
      }
      return ok(res, out);
    }),
  );

  r.get(
    '/meta/:type/:id/:locale',
    requirePermission('content:read'),
    asyncHandler(async (req, res) => {
      const type = String(req.params.type);
      if (!(SEO_ENTITY_TYPES as readonly string[]).includes(type)) throw notFound();
      const lang = langParam(req.params.locale);
      const entity = await findEntity(type, String(req.params.id), lang);
      const meta = await prisma.seoMeta.findUnique({ where: { entityType_entityId_locale: { entityType: type, entityId: entity.id, locale: lang } } });
      const values = { title: meta?.title ?? '', description: meta?.description ?? '', focusKeyword: meta?.focusKeyword ?? '' };
      return ok(res, { entity, meta, ...scoreSeo(values, entity) });
    }),
  );

  r.put(
    '/meta/:type/:id/:locale',
    requirePermission('seo:write'),
    validate(metaInput),
    asyncHandler(async (req, res) => {
      const type = String(req.params.type);
      if (!(SEO_ENTITY_TYPES as readonly string[]).includes(type)) throw notFound();
      const lang = langParam(req.params.locale);
      const entity = await findEntity(type, String(req.params.id), lang);
      const body = req.body as z.infer<typeof metaInput>;
      const { score } = scoreSeo(body, entity);
      const data = { ...body, score, jsonLdOverride: (body.jsonLdOverride ?? undefined) as Prisma.InputJsonValue | undefined };
      const row = await prisma.seoMeta.upsert({
        where: { entityType_entityId_locale: { entityType: type, entityId: entity.id, locale: lang } },
        update: data,
        create: { entityType: type, entityId: entity.id, locale: lang, ...data },
      });
      await audit(req, 'update', `seo:${type}`, `${entity.id}:${lang}`, body);
      return ok(res, row);
    }),
  );

  // Recompute every stored score (after bulk content edits).
  r.post(
    '/rescore',
    requirePermission('seo:write'),
    asyncHandler(async (_req, res) => {
      let n = 0;
      for (const lang of LOCALES) {
        const entities = await listSeoEntities(lang);
        for (const e of entities) {
          const m = await prisma.seoMeta.findUnique({ where: { entityType_entityId_locale: { entityType: e.type, entityId: e.id, locale: lang } } });
          if (!m) continue;
          await prisma.seoMeta.update({ where: { id: m.id }, data: { score: scoreSeo(m, e).score } });
          n++;
        }
      }
      return ok(res, { rescored: n });
    }),
  );

  // 404 log with the three closest real paths as redirect suggestions.
  r.get(
    '/not-found',
    requirePermission('content:read'),
    asyncHandler(async (_req, res) => {
      const [logs, en, ar] = await Promise.all([prisma.notFoundLog.findMany({ orderBy: [{ hits: 'desc' }, { lastSeenAt: 'desc' }], take: 200 }), listSeoEntities('en'), listSeoEntities('ar')]);
      const known = [...en.map((e) => `/en${e.path}`), ...ar.map((e) => `/ar${e.path}`)].filter((p) => !p.includes('?'));
      return ok(
        res,
        logs.map((l) => ({
          ...l,
          suggestions: known
            .map((p) => ({ p, d: distance(l.path, p) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, 3)
            .map((x) => x.p),
        })),
      );
    }),
  );
  r.delete(
    '/not-found/:id',
    requirePermission('seo:write'),
    asyncHandler(async (req, res) => {
      await prisma.notFoundLog.delete({ where: { id: String(req.params.id) } }).catch(() => undefined);
      return ok(res, { deleted: true });
    }),
  );
  return r;
}
