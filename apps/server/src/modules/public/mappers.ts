import type { Media, SeoMeta } from '@prisma/client';
import type { Locale, MediaDTO, SeoDTO } from '@app/shared';

type Localized<T> = Record<Locale, T>;

/** Pick one locale from a `{ en, ar }` Json column, falling back to English if a translation is missing. */
export function pick<T>(content: unknown, lang: Locale): T {
  const c = content as Partial<Localized<T>> | null;
  const v = c?.[lang] ?? c?.en;
  if (v === undefined) throw new Error('Localized content is missing both locales');
  return v;
}

interface Variant {
  w: number;
  url: string;
}
interface Variants {
  avif?: Variant[];
  webp?: Variant[];
  original?: string;
}

export function toMedia(m: Media | null | undefined, lang: Locale): MediaDTO | null {
  if (!m) return null;
  const v = (m.variants ?? {}) as Variants;
  const srcset = (list?: Variant[]) => (list ?? []).map((x) => `${x.url} ${x.w}w`).join(', ');
  const sources: MediaDTO['sources'] = [];
  if (v.avif?.length) sources.push({ type: 'image/avif', srcset: srcset(v.avif) });
  if (v.webp?.length) sources.push({ type: 'image/webp', srcset: srcset(v.webp) });
  const alt = (m.alt ?? {}) as Partial<Localized<string>>;
  return {
    id: m.id,
    alt: alt[lang] ?? alt.en ?? '',
    width: m.width,
    height: m.height,
    src: v.original ?? v.webp?.at(-1)?.url ?? '',
    sources,
    credit: (m.credit as MediaDTO['credit']) ?? null,
  };
}

export function toSeo(row: SeoMeta | null | undefined): SeoDTO | null {
  if (!row) return null;
  return {
    title: row.title,
    description: row.description,
    focusKeyword: row.focusKeyword,
    canonical: row.canonical,
    robotsIndex: row.robotsIndex,
    robotsFollow: row.robotsFollow,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImage: null, // resolved from ogImageId once the media library lands (Step 6)
    twitterCard: row.twitterCard === 'summary' ? 'summary' : 'summary_large_image',
    jsonLdOverride: row.jsonLdOverride ?? null,
  };
}
