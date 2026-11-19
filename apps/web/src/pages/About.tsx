import { useSuspenseQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { MediaImage, PageHeader, Reveal, SectionHeading, StatCounter } from '@/components/ui/blocks';
import { useLang, useQueries } from '@/data/context';

interface Items<T> {
  items: T[];
}

export function About() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('about', lang));
  const { data: home } = useSuspenseQuery(q.page('home', lang));
  const { data: team } = useSuspenseQuery(q.team(lang));
  const s = <T,>(p: typeof page, type: string) => p?.sections.find((x) => x.type === type)?.content as T | undefined;
  const story = s<{ title: string; body: string }>(page, 'story');
  const mv = s<{ mission: string; vision: string }>(page, 'missionVision');
  const values = s<Items<{ title: string; body: string }>>(page, 'values');
  const milestones = s<Items<{ year: string; title: string; body: string }>>(page, 'milestones');
  const stats = s<Items<{ value: number; suffix: string; label: string }>>(home, 'stats');
  const title = page?.title ?? 'About';

  return (
    <>
      <Seo lang={lang} settings={settings} path="/about" seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />

      {story && (
        <Section tone="light">
          <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading title={story.title} />
              <p className="mt-6 max-w-prose text-lg text-steel">{story.body}</p>
              <p className="mt-4 max-w-prose text-lg text-steel">{settings.company.about}</p>
            </div>
            <MediaImage media={null} icon="crane" className="aspect-[4/3] rounded-4xl" />
          </Container>
        </Section>
      )}

      {mv && (
        <Section tone="navy" blueprint>
          <Container className="grid gap-6 md:grid-cols-2">
            {[
              [t('sections.mission'), mv.mission],
              [t('sections.vision'), mv.vision],
            ].map(([h, body]) => (
              <Reveal key={h} className="rounded-4xl border border-white/10 bg-white/[0.04] p-8 md:p-10">
                <h2 className="text-sm font-semibold text-yellow">{h}</h2>
                <p className="mt-4 font-display text-display-md uppercase leading-tight text-white rtl:font-bold rtl:normal-case">{body}</p>
              </Reveal>
            ))}
          </Container>
        </Section>
      )}

      {stats && (
        <Section tone="white">
          <Container>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.items.map((x) => (
                <div key={x.label} className="rounded-3xl bg-offwhite p-6">
                  <dt className="text-sm text-steel">{x.label}</dt>
                  <dd className="mt-2 font-display text-display-md text-navy rtl:font-bold">
                    <StatCounter value={x.value} suffix={x.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      )}

      {values && (
        <Section tone="light">
          <Container>
            <SectionHeading title={t('sections.values')} />
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.items.map((v, i) => (
                <Reveal as="li" key={v.title} delay={i * 80} className="rounded-3xl bg-white p-6 shadow-card">
                  <ShieldCheck className="size-8 text-blue" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-navy">{v.title}</h3>
                  <p className="mt-2 text-steel">{v.body}</p>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {milestones && (
        <Section tone="white">
          <Container>
            <SectionHeading title={t('sections.milestones')} />
            <ol className="mt-12 space-y-8 border-s-2 border-mist ps-8">
              {milestones.items.map((m) => (
                <Reveal as="li" key={m.title} className="relative">
                  <span aria-hidden="true" className="absolute -start-[2.6rem] top-1 size-4 rounded-full bg-yellow ring-4 ring-white" />
                  <p className="tabular font-display text-2xl text-blue">
                    <bdi>{m.year}</bdi>
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-navy">{m.title}</h3>
                  <p className="mt-1 text-steel">{m.body}</p>
                </Reveal>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {team.length > 0 && (
        <Section tone="light">
          <Container>
            <SectionHeading title={t('sections.team')} />
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m, i) => (
                <Reveal as="li" key={m.id} delay={(i % 3) * 80} className="overflow-hidden rounded-3xl bg-white shadow-card">
                  <MediaImage media={m.photo} icon="hook" tone="light" className="aspect-[4/3]" />
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-navy">{m.name}</h3>
                    <p className="text-sm font-medium text-blue">{m.role}</p>
                    <p className="mt-2 text-steel">{m.bio}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
