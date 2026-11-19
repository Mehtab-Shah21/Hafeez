import { Prisma } from '@prisma/client';
import {
  type BlogContent,
  type CompanySettings,
  type EquipmentContent,
  type EquipmentQuery,
  type FaqItem,
  type FleetContent,
  type FooterSettings,
  type HeroSettings,
  type Locale,
  type NavbarSettings,
  type ProjectContent,
  type PublicDataSource,
  type PublicSettingsDTO,
  type SeoEntityType,
  type SeoGlobalSettings,
  type ServiceContent,
  type TestimonialContent,
  type ThemeSettings,
  type AnalyticsSettings,
  type EquipmentCategoryContent,
  type PageContent,
  type TeamContent,
  type CreditDTO,
} from '@app/shared';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { sanitizeRichText } from '../../lib/sanitize.js';
import { pick, toMedia, toSeo } from './mappers.js';

const PUBLISHED = 'PUBLISHED';

async function settingValue<T>(key: string): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) throw new Error(`Missing setting "${key}". Run npm run seed.`);
  return row.value as T;
}

async function seoFor(entityType: SeoEntityType, ids: string[], lang: Locale) {
  const rows = await prisma.seoMeta.findMany({ where: { entityType, entityId: { in: ids }, locale: lang } });
  const ogIds = rows.map((r) => r.ogImageId).filter((x): x is string => !!x);
  const media = ogIds.length ? await prisma.media.findMany({ where: { id: { in: ogIds } } }) : [];
  const og = new Map(media.map((m) => [m.id, toMedia(m, lang)?.src ?? null]));
  return new Map(rows.map((r) => [r.entityId, toSeo(r, r.ogImageId ? og.get(r.ogImageId) ?? null : null)]));
}

async function mediaById(id: string | null, lang: Locale) {
  if (!id) return null;
  return toMedia(await prisma.media.findUnique({ where: { id } }), lang);
}

const localizeNav = <T extends { href: string; label: Record<Locale, string>; children?: { href: string; label: Record<Locale, string> }[] }>(
  item: T,
  lang: Locale,
) => ({
  href: item.href,
  label: item.label[lang],
  ...(item.children ? { children: item.children.map((c) => ({ href: c.href, label: c.label[lang] })) } : {}),
});

const equipmentInclude = { category: true, images: { include: { media: true }, orderBy: { order: 'asc' } } } as const;
type EquipmentRow = Prisma.EquipmentGetPayload<{ include: typeof equipmentInclude }>;

/** The in-process implementation of the public read model, used by both the REST API and SSR. */
export const publicService: PublicDataSource = {
  async settings(lang) {
    const [company, theme, navbar, footer, hero, seo, analytics] = await Promise.all([
      settingValue<CompanySettings>('company'),
      settingValue<ThemeSettings>('theme'),
      settingValue<NavbarSettings>('navbar'),
      settingValue<FooterSettings>('footer'),
      settingValue<HeroSettings>('hero'),
      settingValue<SeoGlobalSettings>('seo.global'),
      settingValue<AnalyticsSettings>('analytics'),
    ]);
    const [logoLight, logoDark, poster, background, ogImage] = await Promise.all([
      mediaById(company.logoLightId, lang),
      mediaById(company.logoDarkId, lang),
      mediaById(hero.posterId, lang),
      mediaById(hero.backgroundId, lang),
      mediaById(seo.defaultOgImageId, lang),
    ]);
    const heroText = hero.text[lang];
    const dto: PublicSettingsDTO = {
      siteUrl: env.PUBLIC_SITE_URL,
      locale: lang,
      company: {
        name: company.name[lang],
        tagline: company.tagline[lang],
        about: company.about[lang],
        logoLight,
        logoDark,
        phones: company.phones,
        whatsapp: company.whatsapp,
        emails: company.emails,
        branches: company.branches.map((b) => ({
          id: b.id,
          emirate: b.emirate,
          isHeadOffice: b.isHeadOffice,
          lat: b.lat,
          lng: b.lng,
          phone: b.phone,
          name: b.text[lang].name,
          address: b.text[lang].address,
        })),
        workingHours: company.workingHours[lang],
        social: company.social,
        tradeLicence: company.tradeLicence,
        trn: company.trn,
        defaultLocale: company.defaultLocale,
      },
      theme,
      navbar: {
        items: navbar.items.map((i) => localizeNav(i, lang)),
        ctaLabel: navbar.ctaLabel[lang],
        ctaHref: navbar.ctaHref,
      },
      footer: {
        text: footer.text[lang],
        quoteBand: footer.quoteBand[lang],
        columns: footer.columns.map((c) => ({ title: c.title[lang], links: c.links.map((l) => localizeNav(l, lang)) })),
      },
      hero: {
        mode: hero.mode,
        intensity: hero.intensity,
        videoUrl: hero.videoUrl,
        videoUrlMobile: hero.videoUrlMobile,
        poster,
        background,
        ...heroText,
      },
      seo: {
        titleTemplate: seo.titleTemplate[lang],
        defaultOgImage: ogImage?.src ?? null,
        googleVerification: seo.googleVerification,
        bingVerification: seo.bingVerification,
      },
      // Tracking IDs and custom code are only executed client-side after cookie consent.
      analytics: { ga4Id: analytics.ga4Id, gtmId: analytics.gtmId, metaPixelId: analytics.metaPixelId, customHead: analytics.customHead, customBody: analytics.customBody },
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ?? '',
      favicon: (await mediaById(company.faviconId, lang))?.src ?? null,
    };
    return dto;
  },

  async page(key, lang) {
    const page = await prisma.page.findFirst({
      where: { key, status: PUBLISHED },
      include: { sections: { where: { isVisible: true, status: PUBLISHED }, orderBy: { order: 'asc' } } },
    });
    if (!page) return null;
    const content = pick<PageContent>(page.content, lang);
    const seo = await seoFor('page', [page.key], lang);
    return {
      key: page.key,
      slug: page.slug,
      title: content.title,
      intro: content.intro,
      sections: page.sections.map((s) => ({ id: s.id, type: s.type, content: pick<Record<string, unknown>>(s.content, lang) })),
      seo: seo.get(page.key) ?? null,
      updatedAt: page.updatedAt.toISOString(),
    };
  },

  async services(lang) {
    const rows = await prisma.service.findMany({ where: { status: PUBLISHED }, orderBy: { order: 'asc' }, include: { image: true } });
    const seo = await seoFor('service', rows.map((r) => r.id), lang);
    return rows.map((r) => ({
      ...pick<ServiceContent>(r.content, lang),
      id: r.id,
      slug: r.slug,
      icon: r.icon,
      featured: r.featured,
      image: toMedia(r.image, lang),
      seo: seo.get(r.id) ?? null,
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  async service(slug, lang) {
    const r = await prisma.service.findFirst({ where: { slug, status: PUBLISHED }, include: { image: true } });
    if (!r) return null;
    const seo = await seoFor('service', [r.id], lang);
    return {
      ...pick<ServiceContent>(r.content, lang),
      id: r.id,
      slug: r.slug,
      icon: r.icon,
      featured: r.featured,
      image: toMedia(r.image, lang),
      seo: seo.get(r.id) ?? null,
      updatedAt: r.updatedAt.toISOString(),
    };
  },

  async equipmentCategories(lang) {
    const rows = await prisma.equipmentCategory.findMany({ orderBy: { order: 'asc' } });
    return rows.map((c) => ({ id: c.id, slug: c.slug, ...pick<EquipmentCategoryContent>(c.content, lang) }));
  },

  async equipment(lang, q: EquipmentQuery = {}) {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 24));
    const where: Prisma.EquipmentWhereInput = {
      status: PUBLISHED,
      ...(q.category ? { category: { slug: q.category } } : {}),
      ...(q.featured ? { featured: true } : {}),
      ...(q.capacityMin != null || q.capacityMax != null
        ? { capacityValue: { ...(q.capacityMin != null ? { gte: q.capacityMin } : {}), ...(q.capacityMax != null ? { lte: q.capacityMax } : {}) } }
        : {}),
      ...(q.operator === 'with' ? { withOperator: true } : {}),
      ...(q.operator === 'without' ? { OR: [{ withOperator: false }, { operatorOptional: true }] } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({ where, include: equipmentInclude, orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    const seo = await seoFor('equipment', rows.map((r) => r.id), lang);
    return {
      items: rows.map((r) => mapEquipment(r, lang, seo.get(r.id) ?? null)),
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  },

  async equipmentItem(slug, lang) {
    const r = await prisma.equipment.findFirst({ where: { slug, status: PUBLISHED }, include: equipmentInclude });
    if (!r) return null;
    const seo = await seoFor('equipment', [r.id], lang);
    return mapEquipment(r, lang, seo.get(r.id) ?? null);
  },

  async fleet(lang) {
    const rows = await prisma.fleetType.findMany({ where: { status: PUBLISHED }, orderBy: { order: 'asc' }, include: { image: true } });
    return rows.map((r) => ({
      ...pick<FleetContent>(r.content, lang),
      id: r.id,
      slug: r.slug,
      payloadTonnes: r.payloadTonnes,
      deckLengthM: r.deckLengthM,
      image: toMedia(r.image, lang),
    }));
  },

  async clients(lang) {
    const rows = await prisma.client.findMany({ where: { isVisible: true }, orderBy: { order: 'asc' }, include: { logo: true } });
    return rows.map((r) => ({ id: r.id, name: r.name, url: r.url, logo: toMedia(r.logo, lang) }));
  },

  async testimonials(lang) {
    const rows = await prisma.testimonial.findMany({ where: { isVisible: true }, orderBy: { order: 'asc' }, include: { avatar: true } });
    return rows.map((r) => ({
      ...pick<TestimonialContent>(r.content, lang),
      id: r.id,
      rating: r.rating,
      company: r.company,
      avatar: toMedia(r.avatar, lang),
    }));
  },

  async projects(lang) {
    const rows = await prisma.project.findMany({ where: { status: PUBLISHED }, orderBy: [{ featured: 'desc' }, { year: 'desc' }], include: { cover: true } });
    const seo = await seoFor('project', rows.map((r) => r.id), lang);
    return rows.map((r) => ({
      ...pick<ProjectContent>(r.content, lang),
      id: r.id,
      slug: r.slug,
      year: r.year,
      emirate: r.emirate,
      featured: r.featured,
      cover: toMedia(r.cover, lang),
      seo: seo.get(r.id) ?? null,
    }));
  },

  async project(slug, lang) {
    const r = await prisma.project.findFirst({ where: { slug, status: PUBLISHED }, include: { cover: true } });
    if (!r) return null;
    const seo = await seoFor('project', [r.id], lang);
    return {
      ...pick<ProjectContent>(r.content, lang),
      id: r.id,
      slug: r.slug,
      year: r.year,
      emirate: r.emirate,
      featured: r.featured,
      cover: toMedia(r.cover, lang),
      seo: seo.get(r.id) ?? null,
    };
  },

  async blog(lang, page = 1) {
    const pageSize = 12;
    const where = { status: PUBLISHED, publishedAt: { lte: new Date() } };
    const [total, rows] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({ where, orderBy: { publishedAt: 'desc' }, include: { cover: true, author: true }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    const seo = await seoFor('blog', rows.map((r) => r.id), lang);
    return {
      items: rows.map((r) => mapBlog(r, lang, seo.get(r.id) ?? null)),
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  },

  async blogPost(slug, lang) {
    const r = await prisma.blogPost.findFirst({
      where: { slug, status: PUBLISHED, publishedAt: { lte: new Date() } },
      include: { cover: true, author: true },
    });
    if (!r) return null;
    const seo = await seoFor('blog', [r.id], lang);
    return mapBlog(r, lang, seo.get(r.id) ?? null);
  },

  async team(lang) {
    const rows = await prisma.teamMember.findMany({ where: { isVisible: true }, orderBy: { order: 'asc' }, include: { photo: true } });
    return rows.map((r) => ({ id: r.id, ...pick<TeamContent>(r.content, lang), photo: toMedia(r.photo, lang) }));
  },

  async credits(lang) {
    const rows = await prisma.media.findMany({ where: { credit: { not: Prisma.AnyNull } }, orderBy: { createdAt: 'asc' } });
    return rows
      .map((m) => toMedia(m, lang))
      .filter((m): m is NonNullable<typeof m> => !!m?.credit)
      .map((m): CreditDTO => ({ id: m.id, alt: m.alt, src: m.src, credit: m.credit! }));
  },

  async faqs(lang, group) {
    const rows = await prisma.faq.findMany({ where: { isVisible: true, ...(group ? { group } : {}) }, orderBy: [{ group: 'asc' }, { order: 'asc' }] });
    return rows.map((r) => ({ id: r.id, group: r.group, ...pick<FaqItem>(r.content, lang) }));
  },
};

function mapEquipment(r: EquipmentRow, lang: Locale, seo: ReturnType<typeof toSeo>) {
  return {
    ...pick<EquipmentContent>(r.content, lang),
    id: r.id,
    slug: r.slug,
    category: { id: r.category.id, slug: r.category.slug, ...pick<EquipmentCategoryContent>(r.category.content, lang) },
    capacityValue: r.capacityValue,
    capacityUnit: r.capacityUnit,
    withOperator: r.withOperator,
    operatorOptional: r.operatorOptional,
    featured: r.featured,
    availability: r.availability,
    images: r.images.map((i) => toMedia(i.media, lang)).filter((m): m is NonNullable<typeof m> => m !== null),
    seo,
    updatedAt: r.updatedAt.toISOString(),
  };
}

type BlogRow = Prisma.BlogPostGetPayload<{ include: { cover: true; author: true } }>;
function mapBlog(r: BlogRow, lang: Locale, seo: ReturnType<typeof toSeo>) {
  const c = pick<BlogContent>(r.content, lang);
  return {
    id: r.id,
    slug: r.slug,
    title: c.title,
    excerpt: c.excerpt,
    // Defence in depth: the admin sanitises on save, and we sanitise again on read.
    bodyHtml: sanitizeRichText(c.bodyHtml),
    tags: (r.tags as string[] | null) ?? [],
    publishedAt: r.publishedAt?.toISOString() ?? null,
    cover: toMedia(r.cover, lang),
    author: r.author?.name ?? '',
    seo,
    updatedAt: r.updatedAt.toISOString(),
  };
}
