import { useSuspenseQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { EquipmentCard, ServiceCard } from '@/components/cards';
import { InquiryForm } from '@/components/forms/InquiryForm';
import { MachineryIcon } from '@/components/machinery/icons';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { FaqJsonLd, FaqList, PageHeader, Reveal, SectionHeading } from '@/components/ui/blocks';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';
import { SERVICE_EQUIPMENT } from './serviceEquipment';

export function ServicesIndex() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('services', lang));
  const { data: services } = useSuspenseQuery(q.services(lang));
  const title = page?.title ?? t('sections.services');
  return (
    <>
      <Seo lang={lang} settings={settings} path="/services" seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />
      <Section tone="light">
        <Container>
          <ul className="grid gap-6 md:grid-cols-2">
            {services.map((s, i) => (
              <Reveal as="li" key={s.id} delay={(i % 2) * 80}>
                <ServiceCard s={s} lang={lang} large />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}

export function ServiceDetail() {
  const lang = useLang();
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: s } = useSuspenseQuery(q.service(slug, lang));
  const { data: services } = useSuspenseQuery(q.services(lang));
  const rel = SERVICE_EQUIPMENT[slug];
  const { data: related } = useSuspenseQuery(q.equipment(lang, rel ? { ...rel, pageSize: 3 } : { category: '__none__', pageSize: 1 }));
  if (!s) return null; // loader already threw 404

  const base = settings.siteUrl.replace(/\/$/, '');
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.overview,
    serviceType: s.title,
    provider: { '@id': `${base}/#organization` },
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    url: `${base}/${lang}/services/${s.slug}`,
  };

  return (
    <>
      <Seo lang={lang} settings={settings} path={`/services/${s.slug}`} seo={s.seo} fallbackTitle={s.title} fallbackDescription={s.excerpt} jsonLd={[serviceLd]} />
      <FaqJsonLd items={s.faqs} />
      <PageHeader
        title={s.title}
        intro={s.excerpt}
        crumbs={[{ label: t('sections.services'), href: `/${lang}/services` }, { label: s.title }]}
        lang={lang}
        siteUrl={settings.siteUrl}
      >
        <div className="mt-8">
          <Button asChild size="lg">
            <a href="#quote">{t('cta.requestQuote')}</a>
          </Button>
        </div>
      </PageHeader>

      <Section tone="light">
        <Container className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="max-w-prose text-xl leading-relaxed text-ink">{s.overview}</p>
            <h2 className="mt-12 text-2xl font-semibold text-navy">{t('sections.features')}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {s.features.map((f) => (
                <li key={f.title} className="rounded-3xl bg-white p-6 shadow-card">
                  <h3 className="font-semibold text-navy">{f.title}</h3>
                  <p className="mt-2 text-steel">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <aside className="group h-fit rounded-4xl bg-navy p-8 text-white">
            <MachineryIcon name={s.icon} className="size-14 text-yellow" />
            <h2 className="mt-6 text-xl font-semibold">{t('sections.useCases')}</h2>
            <ul className="mt-4 space-y-3">
              {s.useCases.map((u) => (
                <li key={u} className="flex gap-2 text-offwhite/85">
                  <Check className="mt-1 size-4 shrink-0 text-yellow" aria-hidden="true" />
                  {u}
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </Section>

      {related.items.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading
              title={t('sections.relatedEquipment')}
              action={
                <Button asChild variant="outline" chevron={false}>
                  <Link to={`/${lang}/equipment`}>{t('cta.viewAll')}</Link>
                </Button>
              }
            />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.items.map((e) => (
                <li key={e.id}>
                  <EquipmentCard e={e} lang={lang} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {s.faqs.length > 0 && (
        <Section tone="light">
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <SectionHeading title={t('sections.faq')} />
            <FaqList items={s.faqs} />
          </Container>
        </Section>
      )}

      <Section tone="white" id="quote" className="scroll-mt-24">
        <Container>
          <SectionHeading title={t('cta.requestQuote')} />
          <div className="mt-10">
            <InquiryForm lang={lang} type="quote" services={services} defaultService={s.slug} />
          </div>
        </Container>
      </Section>
    </>
  );
}
