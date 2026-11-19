/**
 * Idempotent seed: safe to run repeatedly. Rows without a natural unique key use
 * deterministic ids (`seed-…`) so re-runs update instead of duplicating.
 * The admin account comes from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD; there is no default password.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Prisma } from '@prisma/client';
import { LOCALES, ROLES, ROLE_PERMISSIONS, type SeoEntityType } from '@app/shared';
import * as s from './seed-data/settings.js';
import { categories, equipment, fleet, services, toEquipmentContent } from './seed-data/catalogue.js';
import { pages } from './seed-data/pages.js';
import { blog, clients, faqs, projects, team, testimonials } from './seed-data/trust.js';

const prisma = new PrismaClient();
type L<T> = { en: T; ar: T };
type Seo = { title: string; description: string; focusKeyword: string };
const json = (v: unknown) => v as Prisma.InputJsonValue;

async function upsertSeo(entityType: SeoEntityType, entityId: string, seo: L<Seo>) {
  for (const locale of LOCALES) {
    const v = seo[locale];
    // Only fill defaults; never overwrite what an SEO manager has edited.
    await prisma.seoMeta.upsert({
      where: { entityType_entityId_locale: { entityType, entityId, locale } },
      update: {},
      create: { entityType, entityId, locale, title: v.title, description: v.description, focusKeyword: v.focusKeyword },
    });
  }
}

const autoSeo = (en: { name: string; summary: string }, ar: { name: string; summary: string }, suffix: L<string>): L<Seo> => ({
  en: { title: `${en.name} ${suffix.en}`.slice(0, 60), description: en.summary.slice(0, 160), focusKeyword: en.name.toLowerCase() },
  ar: { title: `${ar.name} ${suffix.ar}`.slice(0, 60), description: ar.summary.slice(0, 160), focusKeyword: ar.name },
});

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) in .env before seeding.');
  }

  // Roles + admin
  const roleIds: Record<string, string> = {};
  for (const key of ROLES) {
    const name = key.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const role = await prisma.role.upsert({
      where: { key },
      update: { permissions: json(ROLE_PERMISSIONS[key]) },
      create: { key, name, permissions: json(ROLE_PERMISSIONS[key]) },
    });
    roleIds[key] = role.id;
  }
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: { email, name: 'Administrator', passwordHash: await bcrypt.hash(password, 12), roleId: roleIds.SUPER_ADMIN! },
    });
  }

  // Settings: create only, so admin edits survive re-seeding.
  const settings: [string, unknown][] = [
    ['company', s.company],
    ['theme', s.theme],
    ['navbar', s.navbar],
    ['footer', s.footer],
    ['hero', s.hero],
    ['seo.global', s.seoGlobal],
    ['robots', s.robots],
    ['analytics', s.analytics],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: json(value) } });
  }

  // Pages + sections
  for (const pg of pages) {
    const page = await prisma.page.upsert({
      where: { key: pg.key },
      update: {},
      create: { key: pg.key, slug: pg.slug || 'home', content: json(pg.content) },
    });
    for (const [i, sec] of pg.sections.entries()) {
      const id = `seed-section-${pg.key}-${sec.type}`;
      await prisma.section.upsert({
        where: { id },
        update: {},
        create: { id, pageId: page.id, type: sec.type, order: i, content: json(sec.content) },
      });
    }
    await upsertSeo('page', pg.key, pg.seo);
  }

  // Services
  for (const [i, sv] of services.entries()) {
    const row = await prisma.service.upsert({
      where: { slug: sv.slug },
      update: {},
      create: { slug: sv.slug, icon: sv.icon, featured: sv.featured, order: i, content: json(sv.content) },
    });
    await upsertSeo('service', row.id, sv.seo);
  }

  // Equipment categories + equipment
  const catIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const row = await prisma.equipmentCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, order: i, content: json(c.content) },
    });
    catIds[c.slug] = row.id;
    await upsertSeo(
      'category',
      row.id,
      autoSeo(
        { name: c.content.en.name, summary: c.content.en.description },
        { name: c.content.ar.name, summary: c.content.ar.description },
        { en: 'for rent in the UAE', ar: 'للإيجار في الإمارات' },
      ),
    );
  }
  for (const [i, e] of equipment.entries()) {
    const categoryId = catIds[e.category];
    if (!categoryId) throw new Error(`Unknown category ${e.category}`);
    const row = await prisma.equipment.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        categoryId,
        capacityValue: e.capacityValue,
        capacityUnit: e.capacityUnit,
        withOperator: e.withOperator,
        operatorOptional: e.operatorOptional,
        featured: e.featured,
        availability: e.availability,
        order: i,
        content: json(toEquipmentContent(e)),
      },
    });
    await upsertSeo('equipment', row.id, autoSeo(e.en, e.ar, { en: 'rental UAE', ar: 'للإيجار في الإمارات' }));
  }

  // Fleet
  for (const [i, f] of fleet.entries()) {
    await prisma.fleetType.upsert({
      where: { slug: f.slug },
      update: {},
      create: { slug: f.slug, order: i, payloadTonnes: f.payloadTonnes, deckLengthM: f.deckLengthM, content: json(f.content) },
    });
  }

  // Clients, testimonials, team, FAQs (deterministic ids)
  for (const c of clients) {
    const id = `seed-client-${c.order + 1}`;
    await prisma.client.upsert({ where: { id }, update: {}, create: { id, name: c.name, order: c.order } });
  }
  for (const [i, t] of testimonials.entries()) {
    const id = `seed-testimonial-${i + 1}`;
    await prisma.testimonial.upsert({
      where: { id },
      update: {},
      create: { id, rating: t.rating, company: t.company, order: i, content: json(t.content) },
    });
  }
  for (const [i, m] of team.entries()) {
    const id = `seed-team-${i + 1}`;
    await prisma.teamMember.upsert({ where: { id }, update: {}, create: { id, order: i, content: json(m) } });
  }
  for (const [i, f] of faqs.entries()) {
    const id = `seed-faq-${i + 1}`;
    await prisma.faq.upsert({ where: { id }, update: {}, create: { id, group: f.group, order: i, content: json(f.content) } });
  }

  // Projects
  for (const pr of projects) {
    const row = await prisma.project.upsert({
      where: { slug: pr.slug },
      update: {},
      create: { slug: pr.slug, year: pr.year, emirate: pr.emirate, featured: pr.featured, gallery: json([]), content: json(pr.content) },
    });
    await upsertSeo(
      'project',
      row.id,
      autoSeo(
        { name: pr.content.en.title, summary: pr.content.en.summary },
        { name: pr.content.ar.title, summary: pr.content.ar.summary },
        { en: '', ar: '' },
      ),
    );
  }

  // Blog
  const admin = await prisma.user.findUniqueOrThrow({ where: { email } });
  for (const b of blog) {
    const row = await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        slug: b.slug,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - b.daysAgo * 86_400_000),
        authorId: admin.id,
        tags: json(b.tags),
        content: json(b.content),
      },
    });
    await upsertSeo('blog', row.id, b.seo);
  }

  const counts = {
    services: await prisma.service.count(),
    equipment: await prisma.equipment.count(),
    categories: await prisma.equipmentCategory.count(),
    fleet: await prisma.fleetType.count(),
    clients: await prisma.client.count(),
    testimonials: await prisma.testimonial.count(),
    projects: await prisma.project.count(),
    team: await prisma.teamMember.count(),
    faqs: await prisma.faq.count(),
    blog: await prisma.blogPost.count(),
    pages: await prisma.page.count(),
    seoMeta: await prisma.seoMeta.count(),
    users: await prisma.user.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
