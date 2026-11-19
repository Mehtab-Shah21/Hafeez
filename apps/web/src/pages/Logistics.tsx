import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FleetCard } from '@/components/cards';
import { InquiryForm } from '@/components/forms/InquiryForm';
import { LanesMap, TrackingWidget } from '@/components/logistics';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { FaqJsonLd, FaqList, PageHeader, Reveal, SectionHeading } from '@/components/ui/blocks';
import { useLang, useQueries } from '@/data/context';

export function Logistics() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('logistics', lang));
  const { data: fleet } = useSuspenseQuery(q.fleet(lang));
  const { data: faqsL } = useSuspenseQuery(q.faqs(lang, 'logistics'));
  const { data: faqsC } = useSuspenseQuery(q.faqs(lang, 'courier'));
  const faqs = [...faqsL, ...faqsC];
  const title = page?.title ?? t('sections.logistics');

  return (
    <>
      <Seo lang={lang} settings={settings} path="/logistics" seo={page?.seo ?? null} fallbackTitle={title} />
      <FaqJsonLd items={faqs} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />

      <Section tone="light">
        <Container>
          <SectionHeading title={t('sections.trucks')} />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fleet.map((f, i) => (
              <Reveal as="li" key={f.id} delay={(i % 3) * 60}>
                <FleetCard f={f} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <SectionHeading title={t('sections.lanes')} />
          <div className="mt-10">
            <LanesMap lang={lang} settings={settings} />
          </div>
        </Container>
      </Section>

      <Section tone="light" id="booking" className="scroll-mt-24">
        <Container>
          <SectionHeading title={t('sections.booking')} />
          <div className="mt-10">
            <InquiryForm lang={lang} type="booking" booking turnstileSiteKey={settings.turnstileSiteKey} />
          </div>
        </Container>
      </Section>

      <Section tone="white" id="tracking" className="scroll-mt-24">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading title={t('sections.tracking')} />
          <TrackingWidget lang={lang} />
        </Container>
      </Section>

      {faqs.length > 0 && (
        <Section tone="light">
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <SectionHeading title={t('sections.faq')} />
            <FaqList items={faqs} />
          </Container>
        </Section>
      )}
    </>
  );
}
