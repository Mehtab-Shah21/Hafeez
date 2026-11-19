import { Helmet } from 'react-helmet-async';
import { isRouteErrorResponse, useParams, useRouteError } from 'react-router-dom';
import { DEFAULT_LOCALE, isLocale } from '@app/shared';
import { Container, Heading, Section } from '@/components/primitives';
import { t } from '@/locales/ui';
import { NotFound } from './NotFound';

/** errorElement for loaders: 404 responses render the 404 page; anything else a generic error. */
export function RouteError() {
  const error = useRouteError();
  const { lang: raw } = useParams();
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  return (
    <>
      <Helmet>
        <title>{t(lang, 'errorTitle')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Section tone="light" className="min-h-[60vh]">
        <Container>
          <Heading level={1} size={2}>
            {t(lang, 'errorTitle')}
          </Heading>
          <p className="mt-6 max-w-prose text-lg text-steel">{t(lang, 'errorBody')}</p>
        </Container>
      </Section>
    </>
  );
}
