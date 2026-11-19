import { Helmet } from 'react-helmet-async';
import { LOCALES, LOCALE_TAGS, type Locale, type PublicSettingsDTO, type SeoDTO } from '@app/shared';

interface SeoProps {
  lang: Locale;
  settings: PublicSettingsDTO;
  /** Path after the language prefix, e.g. "" for home or "/services/crane-rental". */
  path: string;
  seo: SeoDTO | null;
  /** Used when the SEO row is missing or has an empty title. */
  fallbackTitle: string;
  fallbackDescription?: string;
  /** Skip the "%s | Company" template (e.g. the home page title already names the brand). */
  rawTitle?: boolean;
  jsonLd?: object[];
  noindex?: boolean;
}

/** JSON-LD is inert data, but `</script>` inside a string would still close the tag: escape `<`. */
const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * All head tags for a public page: title, description, canonical, hreflang (en-AE, ar-AE, x-default),
 * robots, Open Graph, Twitter and JSON-LD. Values come from the SEO Manager (SeoMeta rows).
 */
export function Seo({ lang, settings, path, seo, fallbackTitle, fallbackDescription = '', rawTitle, jsonLd = [], noindex }: SeoProps) {
  const base = settings.siteUrl.replace(/\/$/, '');
  const url = (l: Locale) => `${base}/${l}${path}`;
  const pageTitle = seo?.title || fallbackTitle;
  const title = rawTitle ? pageTitle : settings.seo.titleTemplate.replace('%s', pageTitle);
  const description = seo?.description || fallbackDescription;
  const canonical = seo?.canonical || url(lang);
  const index = !noindex && (seo?.robotsIndex ?? true);
  const follow = seo?.robotsFollow ?? true;
  const ogImage = seo?.ogImage ?? settings.seo.defaultOgImage;
  const blocks = seo?.jsonLdOverride ? [seo.jsonLdOverride] : jsonLd;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {/* Helmet serialises prop names verbatim on the server, so pass lowercase `hreflang`. */}
      {LOCALES.map((l) => (
        <link key={l} rel="alternate" {...{ hreflang: LOCALE_TAGS[l] }} href={url(l)} />
      ))}
      <link rel="alternate" {...{ hreflang: 'x-default' }} href={url(settings.company.defaultLocale)} />
      <meta name="robots" content={`${index ? 'index' : 'noindex'},${follow ? 'follow' : 'nofollow'}`} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={settings.company.name} />
      <meta property="og:locale" content={LOCALE_TAGS[lang].replace('-', '_')} />
      <meta property="og:title" content={seo?.ogTitle || pageTitle} />
      {(seo?.ogDescription || description) && <meta property="og:description" content={seo?.ogDescription || description} />}
      <meta property="og:url" content={canonical} />
      {ogImage && <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : base + ogImage} />}
      <meta name="twitter:card" content={seo?.twitterCard ?? 'summary_large_image'} />

      {settings.seo.googleVerification && <meta name="google-site-verification" content={settings.seo.googleVerification} />}
      {settings.seo.bingVerification && <meta name="msvalidate.01" content={settings.seo.bingVerification} />}

      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {safeJson(b)}
        </script>
      ))}
    </Helmet>
  );
}
