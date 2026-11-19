import * as Dialog from '@radix-ui/react-dialog';
import { Menu, Phone, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { Locale, PublicSettingsDTO } from '@app/shared';
import { Button } from '@/components/ui/button';
import { localePath, switchLocalePath, telUrl } from '@/lib/links';
import { subscribeFrame } from '@/lib/raf';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

/**
 * Floating glass pill navbar. Hides on scroll down and returns on scroll up (transform only,
 * driven by the shared rAF loop). The brief asks for glass here, so it is deliberate.
 */
export function Navbar({ settings, lang }: { settings: PublicSettingsDTO; lang: Locale }) {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const other: Locale = lang === 'en' ? 'ar' : 'en';
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastY = 0;
    let hidden = false;
    let scrolled = false;
    return subscribeFrame((_t, y) => {
      const el = barRef.current;
      if (!el) return;
      const nextHidden = y > 160 && y > lastY + 2 ? true : y < lastY - 2 || y < 160 ? false : hidden;
      if (nextHidden !== hidden) {
        hidden = nextHidden;
        el.style.transform = hidden ? 'translateY(-130%)' : 'translateY(0)';
      }
      const nextScrolled = y > 24;
      if (nextScrolled !== scrolled) {
        scrolled = nextScrolled;
        el.dataset.scrolled = String(scrolled);
      }
      lastY = y;
    });
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const phone = settings.company.phones[0];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div
        ref={barRef}
        data-scrolled="false"
        className="group pointer-events-auto mx-auto flex h-16 max-w-content items-center justify-between gap-4 rounded-full border border-white/10 bg-navy/70 px-3 ps-5 text-offwhite shadow-lift backdrop-blur-xl transition-transform duration-500 ease-out-expo data-[scrolled=true]:bg-navy/85"
      >
        <Logo settings={settings} lang={lang} />

        <nav aria-label={t('nav.primary')} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {settings.navbar.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={localePath(lang, item.href)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm font-medium text-offwhite/80 transition-colors hover:bg-white/10 hover:text-white',
                      isActive && 'bg-white/10 text-white',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={switchLocalePath(pathname, search, other)}
            hrefLang={other}
            lang={other}
            title={t('nav.switchLabel')}
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-offwhite/90 hover:bg-white/10 sm:inline-flex"
            reloadDocument
          >
            {t('nav.switchTo')}
          </Link>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to={localePath(lang, settings.navbar.ctaHref)}>{settings.navbar.ctaLabel}</Link>
          </Button>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 lg:hidden"
                aria-label={t('nav.menu')}
              >
                <Menu className="size-5" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <Dialog.Content
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="surface-dark fixed inset-y-0 end-0 z-[70] flex w-full max-w-sm flex-col bg-navy p-6 text-offwhite shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-8 rtl:data-[state=open]:slide-in-from-left-8"
              >
                <div className="flex items-center justify-between">
                  <Dialog.Title asChild>
                    <span className="font-display text-xl uppercase rtl:font-bold">{t('nav.menu')}</span>
                  </Dialog.Title>
                  <Dialog.Close className="grid size-11 place-items-center rounded-full bg-white/10" aria-label={t('nav.close')}>
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">{settings.company.tagline}</Dialog.Description>
                <nav aria-label={t('nav.primary')} className="mt-8 flex-1">
                  <ul className="space-y-1">
                    <li>
                      <NavLink to={`/${lang}`} end className="block rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-white/10">
                        {t('nav.home')}
                      </NavLink>
                    </li>
                    {settings.navbar.items.map((item) => (
                      <li key={item.href}>
                        <NavLink to={localePath(lang, item.href)} className="block rounded-2xl px-4 py-3 text-lg font-semibold hover:bg-white/10">
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link to={localePath(lang, settings.navbar.ctaHref)}>{settings.navbar.ctaLabel}</Link>
                  </Button>
                  {phone && (
                    <Button asChild variant="glass" className="w-full" chevron={false}>
                      <a href={telUrl(phone)}>
                        <Phone /> <span dir="ltr">{phone}</span>
                      </a>
                    </Button>
                  )}
                  <Link
                    to={switchLocalePath(pathname, search, other)}
                    reloadDocument
                    hrefLang={other}
                    lang={other}
                    className="block py-2 text-center font-semibold text-offwhite/80"
                  >
                    {t('nav.switchTo')}
                  </Link>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
