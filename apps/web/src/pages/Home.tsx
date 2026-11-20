import { useSuspenseQuery } from '@tanstack/react-query';
import { Check, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EquipmentCard, ProjectCard } from '@/components/cards';
import { MachineryIcon, ParcelIcon, TruckIcon } from '@/components/machinery/icons';
import { Container } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { organizationLd, websiteLd } from '@/components/seo/jsonld';
import { Testimonials } from '@/components/Testimonials';
import { FaqJsonLd, FaqList, Marquee, StatCounter } from '@/components/ui/blocks';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';
import { Hero } from '@/hero/Hero';
import { DestinationPanel, HubPanel, PortRunway, Stop } from '@/journey/Journey';
import { SkylineSprite } from '@/journey/SkylineSprite';
import { JourneyBackdrop } from '@/journey3d/Backdrop';
import { localePath } from '@/lib/links';

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

/**
 * Home = one scroll journey over a fixed 3D world (journey3d/World): the port crane loads a
 * container, the truck drives past every emirate, the Fujairah hub hands the crate to a pickup,
 * and the pickup delivers it. Each content panel below is a [data-stage] scroll anchor.
 */
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
      <JourneyBackdrop />
      <SkylineSprite />

      <div data-stage={0} className="relative">
        <Hero settings={settings} lang={lang} backdrop="world" />
        <PortRunway lang={lang} />
      </div>

      <div aria-label={t('journey.label')} role="region" className="pointer-events-none relative">
        <Stop stage={1} n={1} place="dubai" side="end" title={t('sections.services')} lang={lang}>
          <p className="mt-3 text-steel">{t('sections.servicesIntro')}</p>
          <ul className="mt-5 divide-y divide-navy/10">
            {services.map((s) => (
              <li key={s.id}>
                <Link to={`/${lang}/services/${s.slug}`} className="group flex items-start gap-4 py-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-yellow">
                    <MachineryIcon name={s.icon} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy group-hover:text-blue">{s.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-steel">{s.excerpt}</span>
                  </span>
                  <ChevronRight className="mt-3 size-4 shrink-0 text-steel rtl:rotate-180" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Stop>

        <Stop stage={2} n={2} place="sharjah" side="start" title={t('sections.equipment')} lang={lang}>
          <p className="mt-3 text-steel">{t('sections.equipmentIntro')}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {featured.items.slice(0, 4).map((e) => (
              <li key={e.id}>
                <EquipmentCard e={e} lang={lang} />
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button asChild variant="outline" chevron={false}>
              <Link to={`/${lang}/equipment`}>{t('cta.viewAll')}</Link>
            </Button>
          </div>
        </Stop>

        <Stop stage={3} n={3} place="ajman" side="end" title={`${t('sections.logistics')} · ${t('sections.courier')}`} lang={lang}>
          <div className="mt-6 grid gap-4">
            {[
              { s: logistics, Icon: TruckIcon, title: t('sections.logistics'), href: `/${lang}/logistics` },
              { s: courier, Icon: ParcelIcon, title: t('sections.courier'), href: `/${lang}/logistics#tracking` },
            ].map(({ s, Icon, title, href }) => (
              <div key={title} className="rounded-3xl bg-navy p-6 text-white">
                <div className="flex items-center gap-3">
                  <Icon className="size-9 text-yellow" />
                  <h3 className="text-xl font-semibold">{title}</h3>
                </div>
                <p className="mt-3 text-offwhite/75">{s?.overview}</p>
                {s && (
                  <ul className="mt-4 space-y-1.5">
                    {s.features.slice(0, 4).map((f) => (
                      <li key={f.title} className="flex gap-2 text-sm text-offwhite/85">
                        <Check className="mt-0.5 size-4 shrink-0 text-yellow" aria-hidden="true" />
                        {f.title}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-5">
                  <Button asChild variant="glass" size="sm" chevron>
                    <Link to={href}>
                      {t('cta.learnMore')}
                      <span className="sr-only">: {title}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Stop>

        <Stop stage={4} n={4} place="umm-al-quwain" side="start" title={why?.title ?? t('sections.why')} lang={lang}>
          {why && (
            <ul className="mt-6 space-y-3">
              {why.points.map((p) => (
                <li key={p} className="flex gap-3 text-ink">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-yellow">
                    <Check className="size-3.5 text-navy" aria-hidden="true" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
          {stats && (
            <dl className="mt-6 grid grid-cols-2 gap-3">
              {stats.items.map((s) => (
                <div key={s.label} className="rounded-3xl bg-navy p-5 text-white">
                  <dt className="text-sm text-offwhite/70">{s.label}</dt>
                  <dd className="mt-2 font-display text-4xl text-yellow rtl:font-bold">
                    <StatCounter value={s.value} suffix={s.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Stop>

        <Stop stage={5} n={5} place="ras-al-khaimah" side="end" title={process?.title ?? t('sections.process')} lang={lang}>
          {process && (
            <ol className="mt-6 space-y-5">
              {process.steps.map((st, i) => (
                <li key={st.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-yellow font-display text-lg text-navy">
                    <bdi>{i + 1}</bdi>
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy">{st.title}</h3>
                    <p className="mt-1 text-sm text-steel">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Stop>

        <HubPanel stage={6} lang={lang} />

        <Stop stage={7} n={7} place="abu-dhabi" side="start" title={t('sections.projects')} lang={lang}>
          <ul className="mt-6 grid gap-4">
            {projects
              .filter((p) => p.featured)
              .slice(0, 2)
              .map((p) => (
                <li key={p.id}>
                  <ProjectCard p={p} lang={lang} />
                </li>
              ))}
          </ul>
          <div className="mt-6">
            <Button asChild variant="outline" chevron={false}>
              <Link to={`/${lang}/projects`}>{t('cta.viewAll')}</Link>
            </Button>
          </div>
        </Stop>

        <Stop stage={8} n={8} place="al-ain" side="end" title={t('sections.testimonials')} lang={lang}>
          <div className="mt-6">
            <Testimonials items={testimonials} lang={lang} />
          </div>
        </Stop>

        <Stop stage={9} n={9} place="liwa" side="start" title={t('sections.faq')} lang={lang}>
          <FaqList items={faqs} className="mt-6" />
        </Stop>

        <DestinationPanel
          stage={10}
          cta={
            <>
              <Button asChild variant="secondary">
                <Link to={localePath(lang, settings.navbar.ctaHref)}>{settings.navbar.ctaLabel}</Link>
              </Button>
              <Button asChild variant="outline" chevron={false}>
                <Link to={`/${lang}/logistics#tracking`}>{t('cta.learnMore')}</Link>
              </Button>
            </>
          }
        />
        <div data-stage={11} aria-hidden="true" className="h-[60svh]" />
      </div>

      {clients.length > 0 && (
        <section aria-label={t('sections.clients')} className="relative bg-navy pb-10 pt-10">
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
    </>
  );
}
