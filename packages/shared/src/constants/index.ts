export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const RTL_LOCALES: readonly Locale[] = ['ar'];
export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
export const dirFor = (l: Locale): 'rtl' | 'ltr' => (RTL_LOCALES.includes(l) ? 'rtl' : 'ltr');

export const TIMEZONE = 'Asia/Dubai';
export const CURRENCY = 'AED';

export const EMIRATES = [
  { key: 'dubai', en: 'Dubai', ar: 'دبي' },
  { key: 'abu-dhabi', en: 'Abu Dhabi', ar: 'أبوظبي' },
  { key: 'sharjah', en: 'Sharjah', ar: 'الشارقة' },
  { key: 'ajman', en: 'Ajman', ar: 'عجمان' },
  { key: 'ras-al-khaimah', en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
  { key: 'fujairah', en: 'Fujairah', ar: 'الفجيرة' },
  { key: 'umm-al-quwain', en: 'Umm Al Quwain', ar: 'أم القيوين' },
] as const;
export type EmirateKey = (typeof EMIRATES)[number]['key'];
export const EMIRATE_KEYS = EMIRATES.map((e) => e.key) as [EmirateKey, ...EmirateKey[]];

export const ROLES = ['SUPER_ADMIN', 'EDITOR', 'SEO_MANAGER'] as const;
export type RoleKey = (typeof ROLES)[number];
export const isRole = (v: unknown): v is RoleKey =>
  typeof v === 'string' && (ROLES as readonly string[]).includes(v);

/** Permission areas checked on the server and used to filter the admin nav. */
export const PERMISSIONS = [
  'content:read',
  'content:write',
  'media:write',
  'inquiries:manage',
  'seo:write',
  'settings:write',
  'users:manage',
  'audit:read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<RoleKey, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  EDITOR: ['content:read', 'content:write', 'media:write', 'inquiries:manage'],
  SEO_MANAGER: ['content:read', 'seo:write'],
};
export const hasPermission = (role: RoleKey, p: Permission): boolean =>
  ROLE_PERMISSIONS[role].includes(p);

export const PUBLISH_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const INQUIRY_TYPES = ['quote', 'contact', 'booking', 'courier'] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];
export const INQUIRY_STATUSES = ['NEW', 'CONTACTED', 'WON', 'LOST'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const EQUIPMENT_CATEGORIES = [
  'cranes',
  'forklifts',
  'aerial-lifts',
  'earthmoving',
  'handling',
] as const;
export type EquipmentCategoryKey = (typeof EQUIPMENT_CATEGORIES)[number];

export const FAQ_GROUPS = ['general', 'rental', 'logistics', 'courier'] as const;
export type FaqGroup = (typeof FAQ_GROUPS)[number];

export const SEO_ENTITY_TYPES = ['page', 'service', 'equipment', 'category', 'project', 'blog'] as const;
export type SeoEntityType = (typeof SEO_ENTITY_TYPES)[number];

export const REDIRECT_CODES = [301, 302, 410] as const;

export const PAGE_KEYS = [
  'home',
  'about',
  'services',
  'equipment',
  'logistics',
  'contact',
  'projects',
  'blog',
  'privacy',
  'terms',
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const SETTING_KEYS = [
  'company',
  'theme',
  'navbar',
  'footer',
  'hero',
  'seo.global',
  'robots',
  'analytics',
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

/** UAE phone: +971 followed by 8–9 digits; spaces or dashes allowed between digits. */
export const UAE_PHONE_REGEX = /^\+971[\s-]?(?:\d[\s-]?){8,9}$/;
