import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Container, Heading, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { organizationLd, websiteLd } from '@/components/seo/jsonld';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';
import { t } from '@/locales/ui';

interface StatsContent {
  items: { value: number; suffix: string; label: string }[];
}

/**
 * Step 2 version of Home: proves SSR end to end (DB → service → HTML with H1, copy and full head).
 * The cinematic hero arrives in Step 4 and the remaining sections in Step 5.
 */
export function Home() {
  const lang = useLang();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('home', lang));
  const { data: services } = useSuspenseQuery(q.services(lang));
  const hero = settings.hero;
  const stats = page?.sections.find((s) => s.type === 'stats')?.content as StatsContent | undefined;

  return (
    <>
      <Seo
        lang={lang}
        settings={settings}
        path=""
        seo={page?.seo ?? null}
        fallbackTitle={page?.title ?? settings.company.name}
        jsonLd={[organizationLd(settings, lang), websiteLd(settings, lang)]}
      />

      <Section tone="navy" blueprint>
        <Container>
          <p className="text-sm font-medium tracking-wide text-yellow">{hero.eyebrow}</p>
          <Heading level={1} className="mt-6 max-w-4xl">
            {hero.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </Heading>
          <p className="mt-6 max-w-prose text-lg text-offwhite/80">{hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={`/${lang}${settings.navbar.ctaHref}`}>{hero.primaryCta}</Link>
            </Button>
            <Button asChild variant="glass" size="lg" chevron={false}>
              <Link to={`/${lang}/equipment`}>{hero.secondaryCta}</Link>
            </Button>
          </div>
          {stats && (
            <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 md:grid-cols-4">
              {stats.items.map((s) => (
                <div key={s.label}>
                  <dt className="text-sm text-offwhite/70">{s.label}</dt>
                  <dd dir="ltr" className="tabular mt-2 text-start font-display text-display-md text-yellow rtl:text-end rtl:font-bold">
                    {s.value.toLocaleString('en-US')}
                    {s.suffix}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Container>
      </Section>

      <Section tone="light">
        <Container>
          <Heading level={2}>{t(lang, 'ourServices')}</Heading>
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.id}>
                <Card className="flex h-full flex-col">
                  <h3 className="text-xl font-semibold text-navy">{s.title}</h3>
                  <p className="mt-2 flex-1 text-steel">{s.excerpt}</p>
                  <Link
                    to={`/${lang}/services/${s.slug}`}
                    className="mt-6 font-semibold text-blue underline-offset-4 hover:underline"
                  >
                    {t(lang, 'viewService')}
                    <span className="sr-only">: {s.title}</span>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
