import type { RequestHandler } from 'express';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

interface Rule {
  to: string;
  code: number;
}

const TTL_MS = 60_000;
let cache: { at: number; rules: Map<string, Rule> } | null = null;

/** Called by the admin redirect manager after edits so changes apply immediately. */
export const invalidateRedirectCache = () => {
  cache = null;
};

async function rules(): Promise<Map<string, Rule>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  const rows = await prisma.redirect.findMany({ where: { isActive: true }, select: { from: true, to: true, code: true } });
  const map = new Map(rows.map((r) => [normalise(r.from), { to: r.to, code: r.code }]));
  cache = { at: Date.now(), rules: map };
  return map;
}

/** Lower-case, no trailing slash (except root), no query. URLs on this site are lowercase-hyphen. */
const normalise = (p: string) => {
  const path = p.split('?')[0] ?? '/';
  const lower = path.toLowerCase();
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower;
};

/**
 * Applies DB-managed 301/302 redirects and 410 Gone before routing. Only GET/HEAD page requests;
 * API and static assets are skipped. Hit counts are incremented without blocking the response.
 */
export const redirects: RequestHandler = (req, res, next) => {
  if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
    return next();
  }
  const key = normalise(req.path);
  rules()
    .then((map) => {
      const rule = map.get(key);
      if (!rule) return next();
      void prisma.redirect
        .update({ where: { from: key }, data: { hits: { increment: 1 } } })
        .catch((err: unknown) => logger.warn({ err }, 'redirect hit count failed'));
      if (rule.code === 410) {
        res.status(410).type('text/plain').send('Gone');
        return;
      }
      const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
      res.redirect(rule.code === 302 ? 302 : 301, rule.to.includes('?') ? rule.to : rule.to + qs);
    })
    .catch(next);
};

/** Records a 404 for the SEO manager's 404 log (deduplicated by path). Never throws. */
export async function logNotFound(path: string, referrer: string) {
  const p = normalise(path).slice(0, 500);
  try {
    await prisma.notFoundLog.upsert({
      where: { path: p },
      update: { hits: { increment: 1 }, lastSeenAt: new Date(), referrer: referrer.slice(0, 500) },
      create: { path: p, referrer: referrer.slice(0, 500) },
    });
  } catch (err) {
    logger.warn({ err }, 'notFound log failed');
  }
}
