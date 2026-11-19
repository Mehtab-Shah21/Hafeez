import { EMIRATES, LOCALE_TAGS, type Locale, type PublicSettingsDTO } from '@app/shared';

/**
 * Organization + LocalBusiness for the head office, with every branch as a department.
 * `ratings` (from testimonials) adds AggregateRating; omitted when there are none.
 */
export function organizationLd(s: PublicSettingsDTO, lang: Locale, ratings: number[] = []) {
  const base = s.siteUrl.replace(/\/$/, '');
  const head = s.company.branches.find((b) => b.isHeadOffice) ?? s.company.branches[0];
  const emirateName = (key: string) => EMIRATES.find((e) => e.key === key)?.en ?? key;
  const address = (b: NonNullable<typeof head>) => ({
    '@type': 'PostalAddress',
    streetAddress: b.address,
    addressLocality: emirateName(b.emirate),
    addressRegion: emirateName(b.emirate),
    addressCountry: 'AE',
  });
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    '@id': `${base}/#organization`,
    name: s.company.name,
    description: s.company.about,
    url: `${base}/${lang}`,
    inLanguage: LOCALE_TAGS[lang],
    ...(s.company.logoLight ? { logo: base + s.company.logoLight.src } : {}),
    telephone: s.company.phones[0],
    email: s.company.emails[0],
    currenciesAccepted: 'AED',
    areaServed: [...EMIRATES.map((e) => ({ '@type': 'State', name: e.en })), { '@type': 'Place', name: 'GCC' }],
    sameAs: s.company.social.map((x) => x.url),
    ...(head
      ? {
          address: address(head),
          geo: { '@type': 'GeoCoordinates', latitude: head.lat, longitude: head.lng },
        }
      : {}),
    ...(ratings.length
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1), reviewCount: ratings.length, bestRating: 5 } }
      : {}),
    department: s.company.branches
      .filter((b) => b !== head)
      .map((b) => ({ '@type': 'LocalBusiness', name: b.name, telephone: b.phone, address: address(b) })),
  };
}

export function websiteLd(s: PublicSettingsDTO, lang: Locale) {
  const base = s.siteUrl.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: s.company.name,
    url: `${base}/${lang}`,
    inLanguage: LOCALE_TAGS[lang],
    publisher: { '@id': `${base}/#organization` },
  };
}
