import { z } from 'zod';
import { EMIRATE_KEYS, EQUIPMENT_CATEGORIES, FAQ_GROUPS, INQUIRY_STATUSES, PUBLISH_STATUSES, ROLES } from '../constants/index.js';
import { localized, slugSchema } from './common.js';
import {
  blogContentSchema,
  equipmentCategoryContentSchema,
  equipmentContentSchema,
  faqItemSchema,
  fleetContentSchema,
  pageContentSchema,
  projectContentSchema,
  serviceContentSchema,
  teamContentSchema,
  testimonialContentSchema,
} from './content.js';

/** Admin write schemas, one per module. Used by the API (validation) and the admin forms. */
const status = z.enum(PUBLISH_STATUSES);
const mediaId = z.string().min(1).nullable();
const order = z.coerce.number().int().min(0).max(100_000);

export const adminServiceSchema = z.object({
  slug: slugSchema,
  icon: z.string().max(40).default('crane'),
  imageId: mediaId.default(null),
  featured: z.boolean().default(false),
  order: order.default(0),
  status: status.default('PUBLISHED'),
  content: localized(serviceContentSchema),
});

export const adminEquipmentCategorySchema = z.object({
  slug: slugSchema,
  order: order.default(0),
  content: localized(equipmentCategoryContentSchema),
});

export const adminEquipmentSchema = z.object({
  slug: slugSchema,
  categoryId: z.string().min(1),
  capacityValue: z.coerce.number().min(0).max(100_000),
  capacityUnit: z.enum(['t', 'kg', 'm', 'kVA']),
  withOperator: z.boolean().default(true),
  operatorOptional: z.boolean().default(true),
  featured: z.boolean().default(false),
  availability: z.enum(['available', 'limited', 'on-request']).default('available'),
  order: order.default(0),
  status: status.default('PUBLISHED'),
  imageIds: z.array(z.string()).max(12).default([]),
  content: localized(equipmentContentSchema),
});

export const adminFleetSchema = z.object({
  slug: slugSchema,
  order: order.default(0),
  payloadTonnes: z.coerce.number().min(0).max(1000),
  deckLengthM: z.coerce.number().min(0).max(100),
  imageId: mediaId.default(null),
  status: status.default('PUBLISHED'),
  content: localized(fleetContentSchema),
});

export const adminClientSchema = z.object({
  name: z.string().min(1).max(120),
  logoId: mediaId.default(null),
  url: z.union([z.string().url(), z.literal('')]).default(''),
  order: order.default(0),
  isVisible: z.boolean().default(true),
});

export const adminTestimonialSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).default(5),
  avatarId: mediaId.default(null),
  company: z.string().max(160),
  order: order.default(0),
  isVisible: z.boolean().default(true),
  content: localized(testimonialContentSchema),
});

export const adminProjectSchema = z.object({
  slug: slugSchema,
  year: z.coerce.number().int().min(1950).max(2100),
  emirate: z.enum(EMIRATE_KEYS),
  coverId: mediaId.default(null),
  gallery: z.array(z.string()).max(24).default([]),
  featured: z.boolean().default(false),
  status: status.default('PUBLISHED'),
  content: localized(projectContentSchema),
});

export const adminTeamSchema = z.object({
  photoId: mediaId.default(null),
  order: order.default(0),
  isVisible: z.boolean().default(true),
  content: localized(teamContentSchema),
});

export const adminFaqSchema = z.object({
  group: z.enum(FAQ_GROUPS),
  order: order.default(0),
  isVisible: z.boolean().default(true),
  content: localized(faqItemSchema),
});

export const adminBlogSchema = z.object({
  slug: slugSchema,
  coverId: mediaId.default(null),
  status: status.default('DRAFT'),
  publishedAt: z.string().datetime().nullable().default(null),
  tags: z.array(z.string().max(40)).max(20).default([]),
  content: localized(blogContentSchema),
});

export const adminPageSchema = z.object({
  status: status.default('PUBLISHED'),
  content: localized(pageContentSchema),
});

export const adminSectionSchema = z.object({
  type: z.string().min(1).max(40),
  order: order.default(0),
  isVisible: z.boolean().default(true),
  /** Edits are saved as a draft; POST /sections/:id/publish copies the draft to `content`. */
  draftContent: localized(z.record(z.unknown())),
});

export const adminRedirectSchema = z.object({
  from: z.string().startsWith('/').max(500),
  to: z.string().max(1000).default(''),
  code: z.coerce.number().refine((n) => n === 301 || n === 302 || n === 410, 'Use 301, 302 or 410'),
  isActive: z.boolean().default(true),
});

export const adminUserCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().min(1).max(120),
  role: z.enum(ROLES),
  password: z.string().min(12, 'At least 12 characters').max(200),
  isActive: z.boolean().default(true),
});
export const adminUserUpdateSchema = adminUserCreateSchema.partial().extend({
  password: z.string().min(12, 'At least 12 characters').max(200).optional().or(z.literal('')),
});

export const adminInquiryUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  note: z.string().trim().min(1).max(2000).optional(),
});

export const adminMediaUpdateSchema = z.object({
  alt: localized(z.string().trim().min(1, 'Alt text is required').max(250)),
  folder: z.string().max(60).optional(),
});

export const reorderSchema = z.object({ ids: z.array(z.string()).min(1).max(500) });

/** Category slugs are fixed by the constants only for the seed; admins may add more. */
export const KNOWN_CATEGORY_SLUGS = EQUIPMENT_CATEGORIES;
