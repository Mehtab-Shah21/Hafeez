import type { Locale, SeoEntityType } from '@app/shared';
import { prisma } from '../prisma.js';

type L<T> = Partial<Record<Locale, T>>;

/** One indexable thing on the site, resolved for a locale: what the SEO tools score and the sitemap lists. */
export interface SeoEntity {
  type: SeoEntityType;
  id: string;
  name: string;
  /** Path after the language prefix, e.g. "/services/heavy-transport" ("" for home). */
  path: string;
  h1: string;
  firstParagraph: string;
  bodyText: string;
  images: { alt: string }[];
  internalLinks: number;
  updatedAt: Date;
  published: boolean;
}

const PAGE_PATHS: Record<string, string> = {
  home: '',
  about: '/about',
  services: '/services',
  equipment: '/equipment',
  logistics: '/logistics',
  contact: '/contact',
  projects: '/projects',
  blog: '/blog',
  privacy: '/privacy',
  terms: '/terms',
};

const pick = <T>(c: unknown, lang: Locale): T => {
  const v = (c as L<T>)[lang] ?? (c as L<T>).en;
  return (v ?? {}) as T;
};
const text = (...parts: unknown[]) =>
  parts
    .flat(3)
    .map((p) => (typeof p === 'string' ? p : p && typeof p === 'object' ? Object.values(p).join(' ') : ''))
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const altOf = (m: { alt: unknown } | null | undefined, lang: Locale) => ({ alt: m ? (pick<string>(m.alt, lang) as unknown as string) || '' : '' });

/** All SEO-managed entities for one locale (pages, services, categories, equipment, projects, posts). */
export async function listSeoEntities(lang: Locale): Promise<SeoEntity[]> {
  const [pages, services, categories, equipment, projects, posts] = await Promise.all([
    prisma.page.findMany({ include: { sections: true } }),
    prisma.service.findMany({ include: { image: true } }),
    prisma.equipmentCategory.findMany(),
    prisma.equipment.findMany({ include: { images: { include: { media: true } } } }),
    prisma.project.findMany({ include: { cover: true } }),
    prisma.blogPost.findMany({ include: { cover: true } }),
  ]);
  const out: SeoEntity[] = [];
  for (const p of pages) {
    const c = pick<{ title: string; intro: string }>(p.content, lang);
    out.push({
      type: 'page', id: p.key, name: c.title, path: PAGE_PATHS[p.key] ?? `/${p.slug}`, h1: c.title, firstParagraph: c.intro,
      bodyText: text(c.intro, p.sections.map((s) => pick(s.content, lang))), images: [], internalLinks: 3, updatedAt: p.updatedAt, published: p.status === 'PUBLISHED',
    });
  }
  for (const s of services) {
    const c = pick<{ title: string; excerpt: string; overview: string; features: unknown[]; useCases: string[]; faqs: unknown[] }>(s.content, lang);
    out.push({
      type: 'service', id: s.id, name: c.title, path: `/services/${s.slug}`, h1: c.title, firstParagraph: c.overview,
      bodyText: text(c.excerpt, c.overview, c.features, c.useCases, c.faqs), images: s.image ? [altOf(s.image, lang)] : [], internalLinks: 2, updatedAt: s.updatedAt, published: s.status === 'PUBLISHED',
    });
  }
  for (const c0 of categories) {
    const c = pick<{ name: string; description: string }>(c0.content, lang);
    out.push({ type: 'category', id: c0.id, name: c.name, path: `/equipment?category=${c0.slug}`, h1: c.name, firstParagraph: c.description, bodyText: c.description, images: [], internalLinks: 1, updatedAt: c0.updatedAt, published: true });
  }
  for (const e of equipment) {
    const c = pick<{ name: string; summary: string; description: string; specs: unknown[]; rentalTerms: string[] }>(e.content, lang);
    out.push({
      type: 'equipment', id: e.id, name: c.name, path: `/equipment/${e.slug}`, h1: c.name, firstParagraph: c.description,
      bodyText: text(c.summary, c.description, c.specs, c.rentalTerms), images: e.images.map((i) => altOf(i.media, lang)), internalLinks: 3, updatedAt: e.updatedAt, published: e.status === 'PUBLISHED',
    });
  }
  for (const p of projects) {
    const c = pick<{ title: string; summary: string; challenge: string; solution: string; results: string[] }>(p.content, lang);
    out.push({
      type: 'project', id: p.id, name: c.title, path: `/projects/${p.slug}`, h1: c.title, firstParagraph: c.summary,
      bodyText: text(c.summary, c.challenge, c.solution, c.results), images: p.cover ? [altOf(p.cover, lang)] : [], internalLinks: 2, updatedAt: p.updatedAt, published: p.status === 'PUBLISHED',
    });
  }
  for (const b of posts) {
    const c = pick<{ title: string; excerpt: string; bodyHtml: string }>(b.content, lang);
    const html = c.bodyHtml ?? '';
    out.push({
      type: 'blog', id: b.id, name: c.title, path: `/blog/${b.slug}`, h1: c.title,
      firstParagraph: (html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? c.excerpt).replace(/<[^>]+>/g, ''),
      bodyText: text(c.excerpt, html),
      images: [...(b.cover ? [altOf(b.cover, lang)] : []), ...[...html.matchAll(/<img[^>]*>/g)].map((m) => ({ alt: m[0].match(/alt="([^"]*)"/)?.[1] ?? '' }))],
      internalLinks: (html.match(/href="\/(en|ar)\//g) ?? []).length + 1,
      updatedAt: b.updatedAt,
      published: b.status === 'PUBLISHED' && !!b.publishedAt && b.publishedAt <= new Date(),
    });
  }
  return out;
}
