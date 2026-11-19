import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { dirFor, LOCALE_TAGS } from '@app/shared';
import { ThemeStyle } from '@/components/seo/ThemeStyle';
import { useLang, useQueries } from '@/data/context';
import { t } from '@/locales/ui';

/**
 * Shell for every public page in one language. Step 3 adds the navbar, footer, WhatsApp button
 * and mobile CTA bar here. `lang`/`dir` on <html> are set by SSR; this keeps them in sync on
 * client-side language switches.
 */
export function LangLayout() {
  const lang = useLang();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));

  useEffect(() => {
    document.documentElement.lang = LOCALE_TAGS[lang];
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  return (
    <>
      <ThemeStyle theme={settings.theme} />
      <a href="#main" className="skip-link">
        {t(lang, 'skip')}
      </a>
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}
