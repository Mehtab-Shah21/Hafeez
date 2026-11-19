import { z } from 'zod';
import { LOCALES, PUBLISH_STATUSES } from '../constants/index.js';

/** Wrap a per-locale schema so a row stores `{ en: {...}, ar: {...} }`. */
export const localized = <T extends z.ZodTypeAny>(schema: T) => z.object({ en: schema, ar: schema });

export const localeSchema = z.enum(LOCALES);
export const publishStatusSchema = z.enum(PUBLISH_STATUSES);
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');
export const idSchema = z.string().min(1);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
