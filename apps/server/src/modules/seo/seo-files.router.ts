import { Router } from 'express';
import { LOCALE_TAGS, LOCALES, type Locale } from '@app/shared';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { listSeoEntities } from '../../lib/seo/entities.js';

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Dynamic /sitemap.xml (both languages, hreflang alternates incl. x-default, lastmod) and
 * /robots.txt (text from Admin → Global SEO, sitemap line appended). Both are generated from the
 * DB on each request and cached briefly by clients.
 */
export function seoFilesRouter(): Router {
  const r = Router();
  const base = env.PUBLIC_SITE_URL.replace(/\/$/, '');

  r.get(
    '/sitemap.xml',
    asyncHandler(async (_req, res) => {
      const [company, metas] = await Promise.all([
        prisma.setting.findUnique({ where: { key: 'company' } }),
        prisma.seoMeta.findMany({ where: { robotsIndex: false }, select: { entityType: true, entityId: true, locale: true } }),
      ]);
      const defaultLocale = ((company?.value as { defaultLocale?: Locale } | null)?.defaultLocale ?? 'en') as Locale;
      const noindex = new Set(metas.map((m) => `${m.entityType}:${m.entityId}:${m.locale}`));
      const perLocale = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, await listSeoEntities(l)] as const))) as Record<Locale, Awaited<ReturnType<typeof listSeoEntities>>>;

      const urls: string[] = [];
      // Category filter URLs (?category=) are canonicalised to the catalogue and not listed separately.
      for (const e of perLocale.en.filter((x) => x.published && !x.path.includes('?') && x.id !== 'privacy' && x.id !== 'terms')) {
        const variants = LOCALES.filter((l) => !noindex.has(`${e.type}:${e.id}:${l}`));
        for (const l of variants) {
          const self = perLocale[l].find((x) => x.type === e.type && x.id === e.id) ?? e;
          const alts = variants
            .map((v) => `<xhtml:link rel="alternate" hreflang="${LOCALE_TAGS[v]}" href="${xmlEscape(`${base}/${v}${e.path}`)}"/>`)
            .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${base}/${defaultLocale}${e.path}`)}"/>`)
            .join('');
          urls.push(
            `<url><loc>${xmlEscape(`${base}/${l}${e.path}`)}</loc><lastmod>${self.updatedAt.toISOString().slice(0, 10)}</lastmod>${alts}<changefreq>${e.type === 'page' && e.id === 'home' ? 'daily' : 'weekly'}</changefreq><priority>${e.type === 'page' && e.id === 'home' ? '1.0' : e.type === 'page' ? '0.8' : '0.6'}</priority></url>`,
          );
        }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
      res.set('Cache-Control', 'public, max-age=3600');
      res.type('application/xml').send(xml);
    }),
  );

  r.get(
    '/robots.txt',
    asyncHandler(async (_req, res) => {
      const row = await prisma.setting.findUnique({ where: { key: 'robots' } });
      const content = ((row?.value as { content?: string } | null)?.content ?? 'User-agent: *\nAllow: /\n').trim();
      const body = /^sitemap:/im.test(content) ? content : `${content}\n\nSitemap: ${base}/sitemap.xml`;
      res.set('Cache-Control', 'public, max-age=3600');
      res.type('text/plain').send(`${body}\n`);
    }),
  );
  return r;
}
