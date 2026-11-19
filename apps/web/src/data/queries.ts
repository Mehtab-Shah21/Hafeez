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
  faqs: (lang: Locale, group?: string) =>
    queryOptions({ queryKey: ['faqs', lang, group ?? 'all'], queryFn: () => src.faqs(lang, group) }),
});
export type Queries = ReturnType<typeof createQueries>;
