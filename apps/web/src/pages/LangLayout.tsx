import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { dirFor, LOCALE_TAGS } from '@app/shared';
import { MobileCtaBar, WhatsAppFab } from '@/components/layout/ContactBar';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Preloader } from '@/components/layout/Preloader';
import { ThemeStyle } from '@/components/seo/ThemeStyle';
import { useLang, useQueries } from '@/data/context';
import { SmoothScroll } from '@/components/motion/SmoothScroll';

/** Shell for every public page in one language. `lang`/`dir` on <html> come from SSR. */
export function LangLayout() {
  const lang = useLang();
  const q = useQueries();
  const { t, i18n } = useTranslation();
  const { data: settings } = useSuspenseQuery(q.settings(lang));

  useEffect(() => {
    document.documentElement.lang = LOCALE_TAGS[lang];
    document.documentElement.dir = dirFor(lang);
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
  }, [lang, i18n]);

  return (
    <>
      <ThemeStyle theme={settings.theme} favicon={settings.favicon} />
      <Preloader />
      <SmoothScroll />
      <a href="#main" className="skip-link">
        {t('skip')}
      </a>
      <Navbar settings={settings} lang={lang} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer settings={settings} lang={lang} />
      <WhatsAppFab settings={settings} />
      <MobileCtaBar settings={settings} lang={lang} />
      <CookieConsent settings={settings} lang={lang} />
    </>
  );
}
