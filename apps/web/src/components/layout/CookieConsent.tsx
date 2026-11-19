import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Locale, PublicSettingsDTO } from '@app/shared';
import { Button } from '@/components/ui/button';

type Consent = 'granted' | 'denied';
const KEY = 'consent.analytics.v1';

const read = (): Consent | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
};
const write = (v: Consent) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode: consent lasts for this page view only */
  }
};

/** Injects GA4 / GTM / Meta Pixel only after consent. CSP allows their origins (see app.ts). */
function loadAnalytics(a: PublicSettingsDTO['analytics']) {
  const add = (src: string) => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  };
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  if (a.gtmId) {
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    add(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(a.gtmId)}`);
  }
  if (a.ga4Id) {
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = (...args: unknown[]) => w.dataLayer!.push(args);
    w.gtag('js', new Date());
    w.gtag('config', a.ga4Id, { anonymize_ip: true });
    add(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(a.ga4Id)}`);
  }
  if (a.metaPixelId) add('https://connect.facebook.net/en_US/fbevents.js');
}

export function CookieConsent({ settings, lang }: { settings: PublicSettingsDTO; lang: Locale }) {
  const { t } = useTranslation();
  const [consent, setConsent] = useState<Consent | null | 'unknown'>('unknown');
  const hasAnalytics = Boolean(settings.analytics.ga4Id || settings.analytics.gtmId || settings.analytics.metaPixelId);

  useEffect(() => setConsent(read()), []);
  useEffect(() => {
    if (consent === 'granted' && hasAnalytics) loadAnalytics(settings.analytics);
  }, [consent, hasAnalytics, settings.analytics]);

  // Nothing to ask about if no analytics are configured; never rendered on the server.
  if (!hasAnalytics || consent !== null) return null;

  const decide = (v: Consent) => {
    write(v);
    setConsent(v);
  };

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl rounded-3xl bg-white p-6 text-ink shadow-lift animate-in fade-in-0 slide-in-from-bottom-4 md:bottom-6 md:start-6 md:end-auto"
    >
      <h2 id="cookie-title" className="font-semibold text-navy">
        {t('cookie.title')}
      </h2>
      <p className="mt-2 text-sm text-steel">
        {t('cookie.body')}{' '}
        <Link to={`/${lang}/privacy`} className="font-medium text-blue underline">
          {t('cookie.policy')}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" chevron={false} onClick={() => decide('granted')}>
          {t('cookie.accept')}
        </Button>
        <Button size="sm" variant="outline" chevron={false} onClick={() => decide('denied')}>
          {t('cookie.decline')}
        </Button>
      </div>
    </section>
  );
}
