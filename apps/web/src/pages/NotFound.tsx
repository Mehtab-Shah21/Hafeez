import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { DEFAULT_LOCALE, isLocale } from '@app/shared';
import { Container, Heading, Section } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { t } from '@/locales/ui';

/** Localized 404. SSR detects it (route handle `notFound`) and responds with HTTP 404. */
export function NotFound() {
  const { lang: raw } = useParams();
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return (
    <>
      <Helmet>
        <title>{t(lang, 'notFoundTitle')}</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <Section tone="light" className="min-h-[60vh]">
        <Container>
          <p dir="ltr" className="tabular font-display text-display-lg text-yellow rtl:text-end">
            404
          </p>
          <Heading level={1} size={2} className="mt-4">
            {t(lang, 'notFoundTitle')}
          </Heading>
          <p className="mt-6 max-w-prose text-lg text-steel">{t(lang, 'notFoundBody')}</p>
          <Button asChild className="mt-10">
            <Link to={`/${lang}`}>{t(lang, 'backHome')}</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
