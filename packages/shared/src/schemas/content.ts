import { z } from 'zod';
import { localized } from './common.js';

const text = z.string().max(5000);
const shortText = z.string().max(300);

export const faqItemSchema = z.object({ q: shortText, a: text });
export type FaqItem = z.infer<typeof faqItemSchema>;
export const faqLocalizedSchema = localized(faqItemSchema);

export const serviceContentSchema = z.object({
  title: shortText,
  excerpt: text,
  overview: text,
  features: z.array(z.object({ title: shortText, body: text })),
  useCases: z.array(shortText),
  faqs: z.array(faqItemSchema),
});
export type ServiceContent = z.infer<typeof serviceContentSchema>;
export const serviceLocalizedSchema = localized(serviceContentSchema);

export const equipmentCategoryContentSchema = z.object({ name: shortText, description: text });
export type EquipmentCategoryContent = z.infer<typeof equipmentCategoryContentSchema>;
export const equipmentCategoryLocalizedSchema = localized(equipmentCategoryContentSchema);

export const equipmentContentSchema = z.object({
  name: shortText,
  summary: text,
  description: text,
  specs: z.array(z.object({ label: shortText, value: shortText })),
  rentalTerms: z.array(shortText),
});
export type EquipmentContent = z.infer<typeof equipmentContentSchema>;
export const equipmentLocalizedSchema = localized(equipmentContentSchema);

export const fleetContentSchema = z.object({
  name: shortText,
  summary: text,
  bestFor: z.array(shortText),
});
export type FleetContent = z.infer<typeof fleetContentSchema>;
export const fleetLocalizedSchema = localized(fleetContentSchema);

export const testimonialContentSchema = z.object({ name: shortText, role: shortText, quote: text });
export type TestimonialContent = z.infer<typeof testimonialContentSchema>;
export const testimonialLocalizedSchema = localized(testimonialContentSchema);

export const projectContentSchema = z.object({
  title: shortText,
  summary: text,
  challenge: text,
  solution: text,
  results: z.array(shortText),
});
export type ProjectContent = z.infer<typeof projectContentSchema>;
export const projectLocalizedSchema = localized(projectContentSchema);

export const teamContentSchema = z.object({ name: shortText, role: shortText, bio: text });
export type TeamContent = z.infer<typeof teamContentSchema>;
export const teamLocalizedSchema = localized(teamContentSchema);

export const blogContentSchema = z.object({
  title: shortText,
  excerpt: text,
  /** Sanitised HTML rendered on the public site (TipTap output). */
  bodyHtml: z.string().max(200_000),
  /** TipTap JSON document, kept for editing. */
  bodyJson: z.unknown().optional(),
});
export type BlogContent = z.infer<typeof blogContentSchema>;
export const blogLocalizedSchema = localized(blogContentSchema);

/** Section content is free-form per section type; each section component validates its own shape. */
export const sectionContentSchema = z.record(z.unknown());
export const sectionLocalizedSchema = localized(sectionContentSchema);

export const pageContentSchema = z.object({ title: shortText, intro: text });
export type PageContent = z.infer<typeof pageContentSchema>;
export const pageLocalizedSchema = localized(pageContentSchema);
