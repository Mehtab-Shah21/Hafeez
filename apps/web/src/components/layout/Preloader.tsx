import { useTranslation } from 'react-i18next';
import { useRequestFlags } from '@/data/request';

/**
 * First-visit preloader: a forklift lifting a box, ≤1 s. It is pure CSS, so it removes itself even
 * if JavaScript fails, and the page content underneath is fully server-rendered for crawlers.
 * The server only renders it when the session cookie `pl` is absent (so repeat visits skip it).
 * Under reduced motion it is not shown at all (see globals.css).
 */
export function Preloader() {
  const { t } = useTranslation();
  const { showPreloader } = useRequestFlags();
  if (!showPreloader) return null;
  return (
    <div className="preloader surface-dark fixed inset-0 z-[100] grid place-items-center bg-navy" aria-hidden="true">
      <span className="sr-only">{t('preloader')}</span>
      <svg viewBox="0 0 120 80" className="w-40 text-offwhite">
        <g className="preloader-forks">
          <rect x="70" y="40" width="22" height="18" rx="2" className="fill-yellow" />
          <path d="M70 58h30" stroke="currentColor" strokeWidth="3" />
        </g>
        <path d="M66 14v54" stroke="currentColor" strokeWidth="4" />
        <path d="M24 44h38v20H20V52z" fill="currentColor" />
        <path d="M30 30h18l6 14H30z" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="30" cy="66" r="7" className="fill-navy" stroke="currentColor" strokeWidth="3" />
        <circle cx="56" cy="66" r="7" className="fill-navy" stroke="currentColor" strokeWidth="3" />
        <path d="M8 74h104" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
      </svg>
    </div>
  );
}
