import { FileText, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Locale, PublicSettingsDTO } from '@app/shared';
import { localePath, telUrl, whatsappUrl } from '@/lib/links';

/** WhatsApp glyph, drawn inline so it matches the icon stroke system without a brand asset file. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1 2.7 11.6 11.6 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
    </svg>
  );
}

/** Floating WhatsApp button (desktop/tablet). WhatsApp is a primary channel in the UAE. */
export function WhatsAppFab({ settings }: { settings: PublicSettingsDTO }) {
  const { t } = useTranslation();
  if (!settings.company.whatsapp) return null;
  return (
    <a
      href={whatsappUrl(settings.company.whatsapp, t('cta.whatsappMessage'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('cta.whatsappLabel')}
      className="fixed bottom-6 end-6 z-40 hidden size-14 place-items-center rounded-full bg-[#1FAF55] text-white shadow-lift transition-transform duration-200 ease-out-quart hover:scale-105 active:scale-95 md:grid"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}

/** Bottom CTA bar on phones: call, WhatsApp, quote. Sits above the iOS home indicator. */
export function MobileCtaBar({ settings, lang }: { settings: PublicSettingsDTO; lang: Locale }) {
  const { t } = useTranslation();
  const phone = settings.company.phones[0];
  const item = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold';
  return (
    <nav
      aria-label={t('cta.quote')}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-navy/95 pb-[env(safe-area-inset-bottom)] text-offwhite backdrop-blur-md md:hidden"
    >
      {phone && (
        <a href={telUrl(phone)} className={item}>
          <Phone className="size-5" aria-hidden="true" />
          {t('cta.call')}
        </a>
      )}
      {settings.company.whatsapp && (
        <a href={whatsappUrl(settings.company.whatsapp, t('cta.whatsappMessage'))} target="_blank" rel="noopener noreferrer" className={item}>
          <WhatsAppIcon className="size-5 text-[#3DDC7A]" />
          {t('cta.whatsapp')}
        </a>
      )}
      <Link to={localePath(lang, settings.navbar.ctaHref)} className={`${item} m-1.5 rounded-2xl bg-yellow text-navy`}>
        <FileText className="size-5" aria-hidden="true" />
        {t('cta.quote')}
      </Link>
    </nav>
  );
}
