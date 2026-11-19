import { z } from 'zod';
import { EMIRATE_KEYS, INQUIRY_TYPES, UAE_PHONE_REGEX } from '../constants/index.js';
import { localeSchema } from './common.js';

export const inquiryCreateSchema = z.object({
  type: z.enum(INQUIRY_TYPES),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).default(''),
  phone: z.string().trim().regex(UAE_PHONE_REGEX, 'Use a UAE number starting with +971'),
  email: z.string().trim().email().max(254),
  serviceType: z.string().max(80).default(''),
  equipmentSlug: z.string().max(120).default(''),
  message: z.string().trim().max(5000).default(''),
  locale: localeSchema.default('en'),
  booking: z
    .object({
      pickup: z.string().max(200),
      pickupEmirate: z.enum(EMIRATE_KEYS),
      dropoff: z.string().max(200),
      dropoffEmirate: z.enum(EMIRATE_KEYS),
      cargoType: z.string().max(120),
      weightKg: z.coerce.number().positive().max(500_000),
      date: z.string().max(40),
    })
    .partial()
    .optional(),
  /** Honeypot: hidden from people, so any value means a bot. */
  website: z.string().max(0).default(''),
});
export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;
