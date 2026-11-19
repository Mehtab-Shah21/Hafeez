/**
 * Public read model: what the site receives for ONE locale. The server localises DB rows
 * (`content.{en,ar}`) before sending, so pages never handle both languages at once.
 * The same `PublicDataSource` contract is implemented twice: in-process on the server (SSR prefetch)
 * and over HTTP in the browser, so TanStack Query keys and data are identical on both sides.
 */
import type { Locale } from '../constants/index.js';
import type {
  BlogContent,
  EquipmentContent,
  FaqItem,
  FleetContent,
  ProjectContent,
  ServiceContent,
  TestimonialContent,
} from '../schemas/content.js';
import type { InquiryCreateInput } from '../schemas/inquiry.js';
import type { PageMeta } from './envelope.js';

/** BCP 47 tags: the site targets the UAE, so Arabic is ar-AE (Gulf conventions) and English en-AE. */
export const LOCALE_TAGS: Record<Locale, string> = { en: 'en-AE', ar: 'ar-AE' };

export interface MediaDTO {
  id: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  sources: { type: 'image/avif' | 'image/webp'; srcset: string }[];
  credit: { author: string; licence: string; licenceUrl: string; sourceUrl: string } | null;
}

export interface SeoDTO {
  title: string;
  description: string;
  focusKeyword: string;
  canonical: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  twitterCard: 'summary' | 'summary_large_image';
  jsonLdOverride: unknown;
}

export interface NavLinkDTO {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

export interface PublicSettingsDTO {
  siteUrl: string;
  locale: Locale;
  company: {
    name: string;
    tagline: string;
    about: string;
    logoLight: MediaDTO | null;
    logoDark: MediaDTO | null;
    phones: string[];
    whatsapp: string;
    emails: string[];
    branches: {
      id: string;
      emirate: string;
      isHeadOffice: boolean;
      lat: number;
      lng: number;
      phone: string;
      name: string;
      address: string;
    }[];
    workingHours: { days: string; hours: string }[];
    social: { network: string; url: string }[];
    tradeLicence: string;
    trn: string;
    defaultLocale: Locale;
  };
  theme: Record<'navy' | 'yellow' | 'blue' | 'offwhite' | 'ink', string>;
  navbar: { items: NavLinkDTO[]; ctaLabel: string; ctaHref: string };
  footer: {
    text: string;
    quoteBand: { title: string; body: string; cta: string };
    columns: { title: string; links: NavLinkDTO[] }[];
  };
  hero: {
    mode: 'vector' | 'video';
    intensity: 'subtle' | 'standard' | 'cinematic';
    videoUrl: string | null;
    videoUrlMobile: string | null;
    poster: MediaDTO | null;
    background: MediaDTO | null;
    eyebrow: string;
    lines: string[];
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    badges: string[];
  };
  seo: { titleTemplate: string; defaultOgImage: string | null; googleVerification: string; bingVerification: string };
  analytics: { ga4Id: string; gtmId: string; metaPixelId: string };
}

export interface SectionDTO {
  id: string;
  type: string;
  content: Record<string, unknown>;
}
export interface PageDTO {
  key: string;
  slug: string;
  title: string;
  intro: string;
  sections: SectionDTO[];
  seo: SeoDTO | null;
  updatedAt: string;
}

export interface ServiceDTO extends ServiceContent {
  id: string;
  slug: string;
  icon: string;
  featured: boolean;
  image: MediaDTO | null;
  seo: SeoDTO | null;
  updatedAt: string;
}

export interface EquipmentCategoryDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface EquipmentDTO extends EquipmentContent {
  id: string;
  slug: string;
  category: EquipmentCategoryDTO;
  capacityValue: number;
  capacityUnit: string;
  withOperator: boolean;
  operatorOptional: boolean;
  featured: boolean;
  availability: string;
  images: MediaDTO[];
  seo: SeoDTO | null;
  updatedAt: string;
}

export interface EquipmentQuery {
  category?: string;
  capacityMin?: number;
  capacityMax?: number;
  operator?: 'with' | 'without';
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

export interface FleetDTO extends FleetContent {
  id: string;
  slug: string;
  payloadTonnes: number;
  deckLengthM: number;
  image: MediaDTO | null;
}

export interface ClientDTO {
  id: string;
  name: string;
  url: string;
  logo: MediaDTO | null;
}

export interface TestimonialDTO extends TestimonialContent {
  id: string;
  rating: number;
  company: string;
  avatar: MediaDTO | null;
}

export interface ProjectDTO extends ProjectContent {
  id: string;
  slug: string;
  year: number;
  emirate: string;
  featured: boolean;
  cover: MediaDTO | null;
  seo: SeoDTO | null;
}

export interface FaqDTO extends FaqItem {
  id: string;
  group: string;
}

export interface BlogPostDTO extends Omit<BlogContent, 'bodyJson'> {
  id: string;
  slug: string;
  tags: string[];
  publishedAt: string | null;
  cover: MediaDTO | null;
  author: string;
  seo: SeoDTO | null;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

export interface TrackingDTO {
  id: string;
  status: 'booked' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered';
  events: { at: string; status: string; location: string }[];
  isDemo: boolean;
}

/** Implemented by the server (in-process) and the browser (HTTP). `null` means not found. */
export interface PublicDataSource {
  settings(lang: Locale): Promise<PublicSettingsDTO>;
  page(key: string, lang: Locale): Promise<PageDTO | null>;
  services(lang: Locale): Promise<ServiceDTO[]>;
  service(slug: string, lang: Locale): Promise<ServiceDTO | null>;
  equipmentCategories(lang: Locale): Promise<EquipmentCategoryDTO[]>;
  equipment(lang: Locale, query?: EquipmentQuery): Promise<Paged<EquipmentDTO>>;
  equipmentItem(slug: string, lang: Locale): Promise<EquipmentDTO | null>;
  fleet(lang: Locale): Promise<FleetDTO[]>;
  clients(lang: Locale): Promise<ClientDTO[]>;
  testimonials(lang: Locale): Promise<TestimonialDTO[]>;
  projects(lang: Locale): Promise<ProjectDTO[]>;
  project(slug: string, lang: Locale): Promise<ProjectDTO | null>;
  blog(lang: Locale, page?: number): Promise<Paged<BlogPostDTO>>;
  blogPost(slug: string, lang: Locale): Promise<BlogPostDTO | null>;
  faqs(lang: Locale, group?: string): Promise<FaqDTO[]>;
}

export type { InquiryCreateInput };

/** Contract between the Express SSR host and apps/web/src/entry-server.tsx. */
export interface SsrRequest {
  url: string;
  data: PublicDataSource;
  /** Absolute origin for canonical/hreflang/OG URLs, from the PUBLIC_SITE_URL env. */
  siteUrl: string;
}
export type SsrResult =
  | { type: 'redirect'; status: 301 | 302 | 307 | 308; location: string }
  | {
      type: 'html';
      status: number;
      htmlAttrs: { lang: string; dir: 'ltr' | 'rtl' };
      head: string;
      appHtml: string;
      /** JSON-serialisable state for hydration (query cache + router loader data). */
      state: unknown;
    };
export type SsrRender = (req: SsrRequest) => Promise<SsrResult>;
