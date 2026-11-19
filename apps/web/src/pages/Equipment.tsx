import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EquipmentCard } from '@/components/cards';
import { categoryIcon } from '@/components/machinery/icons';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { MediaImage, PageHeader, Reveal, SectionHeading } from '@/components/ui/blocks';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';
import { cn } from '@/lib/utils';
import { parseEquipmentQuery } from './equipmentQuery';

export function EquipmentCatalog() {
  const lang = useLang();
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const q = useQueries();
  const query = parseEquipmentQuery(sp);
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('equipment', lang));
  const { data: cats } = useSuspenseQuery(q.equipmentCategories(lang));
  const { data: list } = useSuspenseQuery(q.equipment(lang, query));
  const title = page?.title ?? t('sections.equipment');

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    setSp(next, { preventScrollReset: true, replace: true });
  };
  const chip = (active: boolean) =>
    cn('rounded-full border px-4 py-2 text-sm font-semibold transition-colors', active ? 'border-navy bg-navy text-white' : 'border-mist bg-white text-navy hover:border-navy/40');

  return (
    <>
      <Seo lang={lang} settings={settings} path="/equipment" seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />
      <Section tone="light">
        <Container>
          <div className="rounded-3xl bg-white p-5 shadow-card md:p-6" role="search" aria-label={t('equipment.filters')}>
            <fieldset>
              <legend className="text-sm font-semibold text-navy">{t('equipment.category')}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={chip(!query.category)} aria-pressed={!query.category} onClick={() => set('category', null)}>
                  {t('equipment.all')}
                </button>
                {cats.map((c) => (
                  <button key={c.slug} type="button" className={chip(query.category === c.slug)} aria-pressed={query.category === c.slug} onClick={() => set('category', c.slug)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-5 flex flex-wrap items-end gap-4">
              <fieldset className="flex items-end gap-2">
                <legend className="mb-2 text-sm font-semibold text-navy">{t('equipment.capacity')}</legend>
                <label className="text-xs text-steel">
                  {t('equipment.minCapacity')}
                  <input type="number" min={0} inputMode="numeric" dir="ltr" defaultValue={sp.get('min') ?? ''} onBlur={(e) => set('min', e.target.value || null)} className="mt-1 block h-11 w-24 rounded-xl border border-mist px-3" />
                </label>
                <label className="text-xs text-steel">
                  {t('equipment.maxCapacity')}
                  <input type="number" min={0} inputMode="numeric" dir="ltr" defaultValue={sp.get('max') ?? ''} onBlur={(e) => set('max', e.target.value || null)} className="mt-1 block h-11 w-24 rounded-xl border border-mist px-3" />
                </label>
              </fieldset>
              <label className="text-sm font-semibold text-navy">
                {t('equipment.operator')}
                <select value={query.operator ?? ''} onChange={(e) => set('operator', e.target.value || null)} className="mt-2 block h-11 rounded-xl border border-mist bg-white px-3 font-normal">
                  <option value="">{t('equipment.any')}</option>
                  <option value="with">{t('equipment.withOperator')}</option>
                  <option value="without">{t('equipment.withoutOperator')}</option>
                </select>
              </label>
              {[...sp.keys()].length > 0 && (
                <Button variant="ghost" size="sm" chevron={false} onClick={() => setSp(new URLSearchParams(), { replace: true })}>
                  {t('equipment.reset')}
                </Button>
              )}
              <p className="ms-auto text-sm text-steel" aria-live="polite">
                {t('equipment.results', { count: list.meta.total })}
              </p>
            </div>
          </div>

          {list.items.length ? (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((e, i) => (
                <Reveal as="li" key={e.id} delay={(i % 3) * 60}>
                  <EquipmentCard e={e} lang={lang} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <p className="mt-10 rounded-3xl bg-white p-10 text-center text-steel shadow-card">{t('equipment.noResults')}</p>
          )}
        </Container>
      </Section>
    </>
  );
}

export function EquipmentDetail() {
  const lang = useLang();
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: e } = useSuspenseQuery(q.equipmentItem(slug, lang));
  const { data: related } = useSuspenseQuery(q.equipment(lang, { category: e?.category.slug ?? '__none__', pageSize: 4 }));
  if (!e) return null;
  const base = settings.siteUrl.replace(/\/$/, '');

  // Product + Offer for a rental item (price on request, so no price is asserted).
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: e.name,
    description: e.description,
    category: e.category.name,
    ...(e.images[0] ? { image: base + e.images[0].src } : {}),
    brand: { '@type': 'Organization', name: settings.company.name },
    additionalProperty: e.specs.map((s) => ({ '@type': 'PropertyValue', name: s.label, value: s.value })),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AED',
      availability: e.availability === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
      businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      seller: { '@id': `${base}/#organization` },
      areaServed: 'AE',
    },
  };

  return (
    <>
      <Seo lang={lang} settings={settings} path={`/equipment/${e.slug}`} seo={e.seo} fallbackTitle={e.name} fallbackDescription={e.summary} jsonLd={[productLd]} />
      <PageHeader
        title={e.name}
        intro={e.summary}
        crumbs={[{ label: t('sections.equipment'), href: `/${lang}/equipment` }, { label: e.category.name, href: `/${lang}/equipment?category=${e.category.slug}` }, { label: e.name }]}
        lang={lang}
        siteUrl={settings.siteUrl}
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to={`/${lang}/contact?type=quote&equipment=${e.slug}`}>{t('cta.requestQuote')}</Link>
          </Button>
          <span className="rounded-full border border-white/20 px-4 py-2 text-sm text-offwhite/85">{t(`equipment.availability.${e.availability}` as 'equipment.availability.available')}</span>
        </div>
      </PageHeader>

      <Section tone="light">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="sr-only">{t('sections.gallery')}</h2>
            <MediaImage media={e.images[0] ?? null} icon={categoryIcon[e.category.slug] ?? 'crane'} tone="light" priority className="aspect-[4/3] rounded-4xl" sizes="(min-width: 1024px) 50vw, 100vw" />
            {e.images.length > 1 && (
              <ul className="mt-4 grid grid-cols-4 gap-3">
                {e.images.slice(1, 5).map((m) => (
                  <li key={m.id}>
                    <MediaImage media={m} className="aspect-square rounded-2xl" sizes="25vw" />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="max-w-prose text-lg text-ink">{e.description}</p>
            <h2 className="mt-10 text-xl font-semibold text-navy">{t('sections.specs')}</h2>
            <table className="mt-4 w-full overflow-hidden rounded-2xl bg-white text-start shadow-card">
              <tbody className="divide-y divide-mist">
                {e.specs.map((s) => (
                  <tr key={s.label}>
                    <th scope="row" className="w-1/2 px-5 py-3 text-start font-medium text-steel">
                      {s.label}
                    </th>
                    <td className="px-5 py-3 font-semibold text-navy">
                      <bdi>{s.value}</bdi>
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-5 py-3 text-start font-medium text-steel">
                    {t('equipment.operator')}
                  </th>
                  <td className="px-5 py-3 font-semibold text-navy">{e.withOperator ? t('equipment.operatorIncluded') : t('equipment.operatorOptional')}</td>
                </tr>
              </tbody>
            </table>
            <h2 className="mt-10 text-xl font-semibold text-navy">{t('sections.rentalTerms')}</h2>
            <ul className="mt-3 list-disc space-y-1 ps-5 text-steel">
              {e.rentalTerms.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {related.items.filter((x) => x.slug !== e.slug).length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading title={t('sections.relatedEquipment')} />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.items
                .filter((x) => x.slug !== e.slug)
                .slice(0, 3)
                .map((x) => (
                  <li key={x.id}>
                    <EquipmentCard e={x} lang={lang} />
                  </li>
                ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
