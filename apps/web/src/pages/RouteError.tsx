import { Helmet } from 'react-helmet-async';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Container, Heading, Section } from '@/components/primitives';
import { useTranslation } from 'react-i18next';
import { NotFound } from './NotFound';

/** errorElement for loaders: 404 responses render the 404 page; anything else a generic error. */
export function RouteError() {
  const error = useRouteError();
  const { t } = useTranslation();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  return (
    <>
      <Helmet>
        <title>{t('errorTitle')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Section tone="light" className="min-h-[60vh]">
        <Container>
          <Heading level={1} size={2}>
            {t('errorTitle')}
          </Heading>
          <p className="mt-6 max-w-prose text-lg text-steel">{t('errorBody')}</p>
        </Container>
      </Section>
    </>
  );
}
