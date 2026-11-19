import { queryOptions } from '@tanstack/react-query';
import type { EquipmentQuery, Locale, PublicDataSource } from '@app/shared';

/**
 * Query definitions shared by server prefetch and client components. Keys must be identical on both
 * sides so the dehydrated cache satisfies the first client render without refetching.
 */
export const createQueries = (src: PublicDataSource) => ({
  settings: (lang: Locale) => queryOptions({ queryKey: ['settings', lang], queryFn: () => src.settings(lang) }),
  page: (key: string, lang: Locale) => queryOptions({ queryKey: ['page', key, lang], queryFn: () => src.page(key, lang) }),
  services: (lang: Locale) => queryOptions({ queryKey: ['services', lang], queryFn: () => src.services(lang) }),
  service: (slug: string, lang: Locale) =>
    queryOptions({ queryKey: ['service', slug, lang], queryFn: () => src.service(slug, lang) }),
  equipment: (lang: Locale, q: EquipmentQuery = {}) =>
    queryOptions({ queryKey: ['equipment', lang, q], queryFn: () => src.equipment(lang, q) }),
  equipmentItem: (slug: string, lang: Locale) => queryOptions({ queryKey: ['equipmentItem', slug, lang], queryFn: () => src.equipmentItem(slug, lang) }),
  equipmentCategories: (lang: Locale) => queryOptions({ queryKey: ['equipmentCategories', lang], queryFn: () => src.equipmentCategories(lang) }),
  fleet: (lang: Locale) => queryOptions({ queryKey: ['fleet', lang], queryFn: () => src.fleet(lang) }),
  clients: (lang: Locale) => queryOptions({ queryKey: ['clients', lang], queryFn: () => src.clients(lang) }),
  testimonials: (lang: Locale) => queryOptions({ queryKey: ['testimonials', lang], queryFn: () => src.testimonials(lang) }),
  projects: (lang: Locale) => queryOptions({ queryKey: ['projects', lang], queryFn: () => src.projects(lang) }),
  project: (slug: string, lang: Locale) => queryOptions({ queryKey: ['project', slug, lang], queryFn: () => src.project(slug, lang) }),
  blog: (lang: Locale, page = 1) => queryOptions({ queryKey: ['blog', lang, page], queryFn: () => src.blog(lang, page) }),
  blogPost: (slug: string, lang: Locale) => queryOptions({ queryKey: ['blogPost', slug, lang], queryFn: () => src.blogPost(slug, lang) }),
  team: (lang: Locale) => queryOptions({ queryKey: ['team', lang], queryFn: () => src.team(lang) }),
  credits: (lang: Locale) => queryOptions({ queryKey: ['credits', lang], queryFn: () => src.credits(lang) }),
  faqs: (lang: Locale, group?: string) =>
    queryOptions({ queryKey: ['faqs', lang, group ?? 'all'], queryFn: () => src.faqs(lang, group) }),
});
export type Queries = ReturnType<typeof createQueries>;
