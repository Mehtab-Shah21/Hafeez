import { z } from 'zod';
import { EMIRATE_KEYS, LOCALES } from '../constants/index.js';
import { localized } from './common.js';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const branchSchema = z.object({
  id: z.string(),
  emirate: z.enum(EMIRATE_KEYS),
  isHeadOffice: z.boolean(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string(),
  text: localized(z.object({ name: z.string(), address: z.string() })),
});

export const companySettingsSchema = z.object({
  name: localized(z.string().min(1)),
  tagline: localized(z.string()),
  about: localized(z.string()),
  logoLightId: z.string().nullable(),
  logoDarkId: z.string().nullable(),
  faviconId: z.string().nullable(),
  phones: z.array(z.string()),
  whatsapp: z.string(),
  emails: z.array(z.string().email()),
  branches: z.array(branchSchema),
  workingHours: localized(z.array(z.object({ days: z.string(), hours: z.string() }))),
  social: z.array(z.object({ network: z.string(), url: z.string().url() })),
  tradeLicence: z.string(),
  trn: z.string(),
  defaultLocale: z.enum(LOCALES),
});
export type CompanySettings = z.infer<typeof companySettingsSchema>;

export const themeSettingsSchema = z.object({
  navy: hex,
  yellow: hex,
  blue: hex,
  offwhite: hex,
  ink: hex,
});
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

export const navLinkSchema = z.object({ href: z.string(), label: localized(z.string()) });
export const navItemSchema = navLinkSchema.extend({ children: z.array(navLinkSchema).optional() });
export const navbarSettingsSchema = z.object({
  items: z.array(navItemSchema),
  ctaLabel: localized(z.string()),
  ctaHref: z.string(),
});
export type NavbarSettings = z.infer<typeof navbarSettingsSchema>;

export const footerSettingsSchema = z.object({
  text: localized(z.string()),
  quoteBand: localized(z.object({ title: z.string(), body: z.string(), cta: z.string() })),
  columns: z.array(z.object({ title: localized(z.string()), links: z.array(navLinkSchema) })),
});
export type FooterSettings = z.infer<typeof footerSettingsSchema>;

export const heroSettingsSchema = z.object({
  mode: z.enum(['vector', 'video']),
  intensity: z.enum(['subtle', 'standard', 'cinematic']),
  videoUrl: z.string().nullable(),
  videoUrlMobile: z.string().nullable(),
  posterId: z.string().nullable(),
  backgroundId: z.string().nullable(),
  text: localized(
    z.object({
      eyebrow: z.string(),
      lines: z.array(z.string()).min(1).max(4),
      subtitle: z.string(),
      primaryCta: z.string(),
      secondaryCta: z.string(),
      badges: z.array(z.string()),
    }),
  ),
});
export type HeroSettings = z.infer<typeof heroSettingsSchema>;

export const seoGlobalSettingsSchema = z.object({
  titleTemplate: localized(z.string()),
  defaultOgImageId: z.string().nullable(),
  googleVerification: z.string(),
  bingVerification: z.string(),
});
export type SeoGlobalSettings = z.infer<typeof seoGlobalSettingsSchema>;

export const analyticsSettingsSchema = z.object({
  ga4Id: z.string(),
  gtmId: z.string(),
  metaPixelId: z.string(),
  customHead: z.string(),
  customBody: z.string(),
});
export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;

export const robotsSettingsSchema = z.object({ content: z.string() });
export type RobotsSettings = z.infer<typeof robotsSettingsSchema>;
