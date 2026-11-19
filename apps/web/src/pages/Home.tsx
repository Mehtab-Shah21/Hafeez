import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Container, Heading, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { organizationLd, websiteLd } from '@/components/seo/jsonld';
import { Hero } from '@/hero/Hero';
import { useLang, useQueries } from '@/data/context';
import { useTranslation } from 'react-i18next';

/**
 * Step 2 version of Home: proves SSR end to end (DB → service → HTML with H1, copy and full head).
 * The cinematic hero arrives in Step 4 and the remaining sections in Step 5.
 */
export function Home() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('home', lang));
  const { data: services } = useSuspenseQuery(q.services(lang));

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

      <Hero settings={settings} lang={lang} />

      <Section tone="light">
        <Container>
          <Heading level={2}>{t('sections.services')}</Heading>
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
                    {t('cta.learnMore')}
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
