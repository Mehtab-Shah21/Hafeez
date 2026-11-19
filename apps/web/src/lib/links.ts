import type { Locale } from '@app/shared';

/** Prefix a site path ("/services") with the language; external and anchor links pass through. */
export const localePath = (lang: Locale, href: string): string => {
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
  if (href === '/' || href === '') return `/${lang}`;
  return `/${lang}${href.startsWith('/') ? href : `/${href}`}`;
};

/** Same page in the other language: swap the first path segment. */
export const switchLocalePath = (pathname: string, search: string, to: Locale): string => {
  const parts = pathname.split('/');
  parts[1] = to;
  return (parts.join('/') || `/${to}`) + search;
};

/** wa.me needs digits only. */
export const whatsappUrl = (number: string, text: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

export const telUrl = (number: string) => `tel:${number.replace(/[^\d+]/g, '')}`;
