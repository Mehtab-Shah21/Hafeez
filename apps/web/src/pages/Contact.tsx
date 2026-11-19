import { useSuspenseQuery } from '@tanstack/react-query';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { INQUIRY_TYPES, type InquiryType } from '@app/shared';
import { WhatsAppIcon } from '@/components/layout/ContactBar';
import { InquiryForm } from '@/components/forms/InquiryForm';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { PageHeader } from '@/components/ui/blocks';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';
import { telUrl, whatsappUrl } from '@/lib/links';

export function Contact() {
  const lang = useLang();
  const { t } = useTranslation();
  const [sp] = useSearchParams();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('contact', lang));
  const { data: services } = useSuspenseQuery(q.services(lang));
  const c = settings.company;
  const title = page?.title ?? t('footer.contact');
  const typeParam = sp.get('type');
  const type: InquiryType = (INQUIRY_TYPES as readonly string[]).includes(typeParam ?? '') ? (typeParam as InquiryType) : 'contact';
  const head = c.branches.find((b) => b.isHeadOffice) ?? c.branches[0];

  return (
    <>
      <Seo lang={lang} settings={settings} path="/contact" seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl}>
        <div className="mt-8 flex flex-wrap gap-3">
          {c.whatsapp && (
            <Button asChild size="lg" className="bg-[#1FAF55] text-white hover:bg-[#178F45]" chevron={false}>
              <a href={whatsappUrl(c.whatsapp, t('cta.whatsappMessage'))} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-5" /> {t('cta.whatsapp')}
              </a>
            </Button>
          )}
          {c.phones[0] && (
            <Button asChild size="lg" variant="glass" chevron={false}>
              <a href={telUrl(c.phones[0])}>
                <Phone aria-hidden="true" /> <bdi dir="ltr">{c.phones[0]}</bdi>
              </a>
            </Button>
          )}
        </div>
      </PageHeader>

      <Section tone="light">
        <Container className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <InquiryForm lang={lang} type={type} turnstileSiteKey={settings.turnstileSiteKey} services={services} defaultService={sp.get('service') ?? ''} defaultEquipment={sp.get('equipment') ?? ''} />
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-navy">{t('footer.contact')}</h2>
              <ul className="mt-4 space-y-3 text-steel">
                {c.phones.map((p) => (
                  <li key={p}>
                    <a href={telUrl(p)} className="flex items-center gap-2 hover:text-navy">
                      <Phone className="size-4 text-blue" aria-hidden="true" />
                      <bdi dir="ltr">{p}</bdi>
                    </a>
                  </li>
                ))}
                {c.emails.map((e) => (
                  <li key={e}>
                    <a href={`mailto:${e}`} className="flex items-center gap-2 break-all hover:text-navy">
                      <Mail className="size-4 text-blue" aria-hidden="true" />
                      {e}
                    </a>
                  </li>
                ))}
              </ul>
              <h2 className="mt-6 flex items-center gap-2 font-semibold text-navy">
                <Clock className="size-4 text-blue" aria-hidden="true" /> {t('footer.hours')}
              </h2>
              <ul className="mt-2 space-y-1 text-steel">
                {c.workingHours.map((h) => (
                  <li key={h.days}>
                    {h.days}: <bdi dir="ltr">{h.hours}</bdi>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-navy">{t('sections.offices')}</h2>
              <ul className="mt-4 space-y-4">
                {c.branches.map((b) => (
                  <li key={b.id} className="flex gap-3">
                    <MapPin className="mt-1 size-4 shrink-0 text-blue" aria-hidden="true" />
                    <span>
                      <span className="block font-medium text-navy">{b.name}</span>
                      <span className="block text-sm text-steel">{b.address}</span>
                      <a
                        className="text-sm font-medium text-blue hover:underline"
                        href={`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Maps
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </Container>
      </Section>

      {head && (
        <section aria-label={head.name} className="bg-offwhite pb-16 md:pb-24">
          <Container>
            <iframe
              title={head.name}
              src={`https://maps.google.com/maps?q=${head.lat},${head.lng}&z=14&output=embed&hl=${lang}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[420px] w-full rounded-4xl border-0 shadow-card"
            />
          </Container>
        </section>
      )}
    </>
  );
}
