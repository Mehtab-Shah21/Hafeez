import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TIMEZONE, type Locale, type PublicSettingsDTO } from '@app/shared';
import { Container } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { localePath, telUrl } from '@/lib/links';
import { Logo } from './Logo';

export function QuoteBand({ settings, lang }: { settings: PublicSettingsDTO; lang: Locale }) {
  const band = settings.footer.quoteBand;
  return (
    <Container className="relative z-10">
      <div className="relative overflow-hidden rounded-4xl bg-yellow px-6 py-10 text-navy shadow-lift sm:px-10 md:flex md:items-center md:justify-between md:gap-10 md:py-14 lg:px-16">
        {/* Hook-and-line motif: static decoration drawn from the machinery theme. */}
        <svg aria-hidden="true" viewBox="0 0 120 160" className="pointer-events-none absolute -top-4 end-8 hidden h-40 text-navy/10 md:block">
          <path d="M60 0v90" stroke="currentColor" strokeWidth="6" />
          <path d="M60 90a22 22 0 1 0 22 22h-12a10 10 0 1 1-10-10z" fill="currentColor" />
        </svg>
        <div className="max-w-xl">
          <h2 className="font-display text-display-md uppercase rtl:font-bold rtl:normal-case">{band.title}</h2>
          <p className="mt-3 text-lg text-navy/80">{band.body}</p>
        </div>
        <Button asChild variant="secondary" size="lg" className="mt-8 shrink-0 md:mt-0" chevron>
          <Link to={localePath(lang, settings.navbar.ctaHref)}>{band.cta}</Link>
        </Button>
      </div>
    </Container>
  );
}

export function Footer({ settings, lang }: { settings: PublicSettingsDTO; lang: Locale }) {
  const { t } = useTranslation();
  const c = settings.company;
  const year = new Intl.DateTimeFormat('en-AE', { year: 'numeric', timeZone: TIMEZONE }).format(new Date());

  return (
    <footer className="surface-dark relative mt-24 bg-navy pb-28 text-offwhite md:pb-10">
      <div className="-translate-y-1/2">
        <QuoteBand settings={settings} lang={lang} />
      </div>
      <Container className="-mt-6 md:-mt-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <Logo settings={settings} lang={lang} />
            <p className="mt-5 max-w-sm text-offwhite/70">{settings.footer.text}</p>
          </div>
          {settings.footer.columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="md:col-span-2">
              <h2 className="text-sm font-semibold text-yellow">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link to={localePath(lang, l.href)} className="text-offwhite/80 hover:text-white hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="md:col-span-3">
            <h2 className="text-sm font-semibold text-yellow">{t('footer.contact')}</h2>
            <ul className="mt-4 space-y-3 text-offwhite/80">
              {c.phones.map((p) => (
                <li key={p}>
                  <a href={telUrl(p)} className="inline-flex items-center gap-2 hover:text-white">
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    <span dir="ltr">{p}</span>
                  </a>
                </li>
              ))}
              {c.emails.map((e) => (
                <li key={e}>
                  <a href={`mailto:${e}`} className="inline-flex items-center gap-2 break-all hover:text-white">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {e}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {c.branches.map((b) => (
            <div key={b.id} className="text-sm">
              <p className="flex items-center gap-2 font-semibold text-white">
                <MapPin className="size-4 text-yellow" aria-hidden="true" /> {b.name}
              </p>
              <p className="mt-2 text-offwhite/70">{b.address}</p>
            </div>
          ))}
          <div className="text-sm">
            <p className="flex items-center gap-2 font-semibold text-white">
              <Clock className="size-4 text-yellow" aria-hidden="true" /> {t('footer.hours')}
            </p>
            <ul className="mt-2 space-y-1 text-offwhite/70">
              {c.workingHours.map((h) => (
                <li key={h.days}>
                  {h.days}: <span dir="ltr">{h.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Large wordmark: decorative repeat of the brand name (the logo link above carries the semantics). */}
        <p
          aria-hidden="true"
          // Size scales with the name length so the whole wordmark fits the container width.
          style={{ fontSize: `min(13rem, ${Math.max(4, 150 / Math.max(c.name.length, 6)).toFixed(2)}vw)` }}
          className="mt-16 select-none overflow-hidden whitespace-nowrap font-display uppercase leading-[0.8] text-white/[0.06] rtl:font-bold rtl:normal-case"
        >
          {c.name}
        </p>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-offwhite/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {c.name}. {t('footer.rights')}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t('footer.licence')}: <span dir="ltr">{c.tradeLicence}</span>
            </span>
            <span>
              {t('footer.trn')}: <span dir="ltr">{c.trn}</span>
            </span>
            <Link to={`/${lang}/credits`} className="underline-offset-2 hover:underline">
              {t('footer.credits')}
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
