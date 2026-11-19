import { useSuspenseQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EquipmentCard, ProjectCard, ServiceCard } from '@/components/cards';
import { ParcelIcon, TruckIcon } from '@/components/machinery/icons';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { organizationLd, websiteLd } from '@/components/seo/jsonld';
import { Testimonials } from '@/components/Testimonials';
import { FaqJsonLd, FaqList, MachineryDivider, Marquee, Reveal, SectionHeading, StatCounter } from '@/components/ui/blocks';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';
import { Hero } from '@/hero/Hero';

interface Stats {
  items: { value: number; suffix: string; label: string }[];
}
interface Process {
  title: string;
  steps: { title: string; body: string }[];
}
interface WhyUs {
  title: string;
  points: string[];
}

export function Home() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('home', lang));
  const { data: services } = useSuspenseQuery(q.services(lang));
  const { data: featured } = useSuspenseQuery(q.equipment(lang, { featured: true, pageSize: 6 }));
  const { data: clients } = useSuspenseQuery(q.clients(lang));
  const { data: testimonials } = useSuspenseQuery(q.testimonials(lang));
  const { data: projects } = useSuspenseQuery(q.projects(lang));
  const { data: faqs } = useSuspenseQuery(q.faqs(lang, 'general'));

  const section = <T,>(type: string) => page?.sections.find((s) => s.type === type)?.content as T | undefined;
  const stats = section<Stats>('stats');
  const process = section<Process>('process');
  const why = section<WhyUs>('whyUs');
  const logistics = services.find((s) => s.slug === 'freight-truckload');
  const courier = services.find((s) => s.slug === 'courier-express');

  return (
    <>
      <Seo
        lang={lang}
        settings={settings}
        path=""
        seo={page?.seo ?? null}
        fallbackTitle={page?.title ?? settings.company.name}
        jsonLd={[organizationLd(settings, lang, testimonials.map((x) => x.rating)), websiteLd(settings, lang)]}
      />
      <FaqJsonLd items={faqs} />

      <Hero settings={settings} lang={lang} />

      {clients.length > 0 && (
        <section aria-label={t('sections.clients')} className="bg-navy pb-10 pt-6">
          <Container>
            <p className="mb-5 text-center text-sm font-medium text-offwhite/60">{t('sections.clients')}</p>
          </Container>
          <Marquee label={t('sections.clients')}>
            {clients.map((c) => (
              <span key={c.id} className="grid h-16 w-44 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-offwhite/70">
                {c.logo ? (
                  <img src={c.logo.src} alt={c.logo.alt || c.name} width={c.logo.width} height={c.logo.height} loading="lazy" className="max-h-9 w-auto opacity-80" />
                ) : (
                  <span className="font-semibold tracking-wide">{c.name}</span>
                )}
              </span>
            ))}
          </Marquee>
        </section>
      )}

      <Section tone="light">
        <Container>
          <SectionHeading title={t('sections.services')} intro={t('sections.servicesIntro')} />
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal as="li" key={s.id} delay={(i % 3) * 80}>
                <ServiceCard s={s} lang={lang} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <MachineryDivider />

      <Section tone="light" className="pt-12 md:pt-16 lg:pt-20">
        <Container>
          <SectionHeading
            title={t('sections.equipment')}
            intro={t('sections.equipmentIntro')}
            action={
              <Button asChild variant="outline" chevron={false}>
                <Link to={`/${lang}/equipment`}>{t('cta.viewAll')}</Link>
              </Button>
            }
          />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.items.map((e, i) => (
              <Reveal as="li" key={e.id} delay={(i % 3) * 80}>
                <EquipmentCard e={e} lang={lang} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="navy" blueprint>
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { s: logistics, Icon: TruckIcon, title: t('sections.logistics'), href: `/${lang}/logistics` },
              { s: courier, Icon: ParcelIcon, title: t('sections.courier'), href: `/${lang}/logistics#tracking` },
            ].map(({ s, Icon, title, href }) => (
              <Reveal key={title} className="group flex flex-col rounded-4xl border border-white/10 bg-white/[0.04] p-8 md:p-10">
                <Icon className="size-14 text-yellow" />
                <h2 className="mt-8 font-display text-display-md uppercase text-white rtl:font-bold rtl:normal-case">{title}</h2>
                <p className="mt-4 max-w-prose text-offwhite/75">{s?.overview}</p>
                {s && (
                  <ul className="mt-6 space-y-2">
                    {s.features.map((f) => (
                      <li key={f.title} className="flex gap-2 text-offwhite/85">
                        <Check className="mt-1 size-4 shrink-0 text-yellow" aria-hidden="true" />
                        {f.title}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-8">
                  <Button asChild variant="glass" chevron>
                    <Link to={href}>{t('cta.learnMore')}</Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {(why || stats) && (
        <Section tone="white">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <SectionHeading title={why?.title ?? t('sections.why')} />
                {why && (
                  <ul className="mt-8 space-y-4">
                    {why.points.map((p) => (
                      <li key={p} className="flex gap-3 text-lg text-ink">
                        <span className="mt-1.5 grid size-5 shrink-0 place-items-center rounded-full bg-yellow">
                          <Check className="size-3.5 text-navy" aria-hidden="true" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {stats && (
                <dl className="grid grid-cols-2 gap-4">
                  {stats.items.map((s) => (
                    <div key={s.label} className="rounded-3xl bg-navy p-6 text-white md:p-8">
                      <dt className="text-sm text-offwhite/70">{s.label}</dt>
                      <dd className="mt-3 font-display text-display-lg text-yellow rtl:font-bold">
                        <StatCounter value={s.value} suffix={s.suffix} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </Container>
        </Section>
      )}

      {process && (
        <Section tone="light">
          <Container>
            <SectionHeading title={process.title} />
            <ol className="relative mt-14 grid gap-8 md:grid-cols-4">
              {process.steps.map((st, i) => (
                <Reveal as="li" key={st.title} delay={i * 100} className="relative">
                  {i < process.steps.length - 1 && (
                    <span aria-hidden="true" className="absolute start-16 top-7 hidden h-0.5 w-[calc(100%-3rem)] border-t-2 border-dashed border-navy/15 md:block" />
                  )}
                  <span className="relative grid size-14 place-items-center rounded-full bg-yellow font-display text-2xl text-navy shadow-cta">
                    <bdi>{i + 1}</bdi>
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-navy">{st.title}</h3>
                  <p className="mt-2 text-steel">{st.body}</p>
                </Reveal>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {projects.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading
              title={t('sections.projects')}
              action={
                <Button asChild variant="outline" chevron={false}>
                  <Link to={`/${lang}/projects`}>{t('cta.viewAll')}</Link>
                </Button>
              }
            />
            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {projects
                .filter((p) => p.featured)
                .slice(0, 4)
                .map((p, i) => (
                  <Reveal as="li" key={p.id} delay={(i % 2) * 80}>
                    <ProjectCard p={p} lang={lang} />
                  </Reveal>
                ))}
            </ul>
          </Container>
        </Section>
      )}

      {testimonials.length > 0 && (
        <Section tone="light">
          <Container>
            <SectionHeading title={t('sections.testimonials')} />
            <div className="mt-12">
              <Testimonials items={testimonials} lang={lang} />
            </div>
          </Container>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section tone="white">
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <SectionHeading title={t('sections.faq')} />
            <FaqList items={faqs} />
          </Container>
        </Section>
      )}
    </>
  );
}
