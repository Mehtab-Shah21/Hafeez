import { Link } from 'react-router-dom';
import type { Locale, PublicSettingsDTO } from '@app/shared';
import { cn } from '@/lib/utils';

/** Uploaded logo if set in the admin; otherwise the company name as a condensed wordmark. */
export function Logo({ settings, lang, tone = 'light', className }: { settings: PublicSettingsDTO; lang: Locale; tone?: 'light' | 'dark'; className?: string }) {
  const img = tone === 'light' ? settings.company.logoLight : settings.company.logoDark;
  return (
    <Link to={`/${lang}`} className={cn('inline-flex items-center gap-2', className)} aria-label={settings.company.name}>
      {img ? (
        <img src={img.src} alt="" width={img.width} height={img.height} className="h-8 w-auto" />
      ) : (
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
            <rect width="32" height="32" rx="9" className="fill-yellow" />
            <path d="M9 23V11h4l3 6 3-6h4v12h-3v-7l-3 6h-2l-3-6v7z" className="fill-navy" />
          </svg>
          <span className="font-display text-xl uppercase tracking-wide rtl:font-bold rtl:normal-case">{settings.company.name}</span>
        </span>
      )}
    </Link>
  );
}
