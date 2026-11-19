import { z } from 'zod';
import { SEO_ENTITY_TYPES } from '../constants/index.js';
import { localeSchema } from './common.js';

export const seoMetaSchema = z.object({
  entityType: z.enum(SEO_ENTITY_TYPES),
  entityId: z.string().min(1),
  locale: localeSchema,
  title: z.string().max(120),
  description: z.string().max(320),
  focusKeyword: z.string().max(120).default(''),
  canonical: z.string().url().nullable().default(null),
  robotsIndex: z.boolean().default(true),
  robotsFollow: z.boolean().default(true),
  ogTitle: z.string().max(120).default(''),
  ogDescription: z.string().max(320).default(''),
  ogImageId: z.string().nullable().default(null),
  twitterCard: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
  jsonLdOverride: z.unknown().nullable().default(null),
});
export type SeoMetaInput = z.infer<typeof seoMetaSchema>;

export const redirectSchema = z.object({
  from: z.string().startsWith('/'),
  to: z.string(),
  code: z.union([z.literal(301), z.literal(302), z.literal(410)]),
  isActive: z.boolean().default(true),
});
export type RedirectInput = z.infer<typeof redirectSchema>;
