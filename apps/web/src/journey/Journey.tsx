import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EMIRATES, type EmirateKey, type Locale } from '@app/shared';
import { EMIRATE_PHOTOS } from '@/config/emirates';
import { Container } from '@/components/primitives';
import { cn } from '@/lib/utils';

/*
 * Content panels of the home-page delivery journey. They scroll over the fixed 3D world
 * (journey3d) and each one is a scroll anchor: [data-stage] marks the stage the 3D story plays
 * while that panel passes the middle of the screen (see journey3d/World readStage).
 */

export type Place = EmirateKey | 'al-ain' | 'liwa';

/** Crops of the shared skyline sprite (x, width) for the illustrated fallback cards. */
const CROPS: Record<EmirateKey, [number, number]> = {
  'abu-dhabi': [0, 720],
  dubai: [720, 840],
  sharjah: [1530, 420],
  ajman: [1925, 280],
  'umm-al-quwain': [2180, 220],
  'ras-al-khaimah': [2400, 460],
  fujairah: [2850, 350],
};

export function usePlaceName(place: Place, lang: Locale) {
  const { t } = useTranslation();
  if (place === 'al-ain') return { name: t('journey.alAin'), ar: t('journey.alAinAr') };
  if (place === 'liwa') return { name: t('journey.liwa'), ar: t('journey.liwaAr') };
  const e = EMIRATES.find((x) => x.key === place);
  return { name: e?.[lang] ?? place, ar: e?.ar ?? '' };
}

function PlaceArt({ place }: { place: Place }) {
  if (place === 'al-ain' || place === 'liwa') {
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {place === 'al-ain' ? (
          <path d="M0 230L70 190L130 150L190 95L240 120L300 160L360 200L400 215V300H0Z" fill="#5A4670" />
        ) : (
          <>
            <path d="M0 210C80 160 150 170 220 200S340 170 400 190V300H0Z" fill="#D98A4E" />
            <path d="M0 245C90 215 170 225 260 245S360 225 400 235V300H0Z" fill="#E9A565" />
          </>
        )}
      </svg>
    );
  }
  const [x, w] = CROPS[place];
  const h = w * 0.55;
  return (
    <svg viewBox={`${x} ${652 - h} ${w} ${h}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <use href="#hs-skyline-art" />
    </svg>
  );
}

/** Emirate card image: a licensed photo when configured (config/emirates.ts), else the illustration. */
export function Postcard({ place, lang, className }: { place: Place; lang: Locale; className?: string }) {
  const { name, ar } = usePlaceName(place, lang);
  const photo = EMIRATE_PHOTOS[place];
  return (
    <figure className={cn('relative aspect-[16/8] overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#14203F_0%,#4B3F78_42%,#C4607A_70%,#F6A25E_88%,#FFD597_100%)]', className)}>
      {photo ? (
        <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute bottom-[22%] end-[16%] size-12 rounded-full bg-[#FFE7A8] shadow-[0_0_50px_20px_rgba(255,200,120,0.5)]" aria-hidden="true" />
          <PlaceArt place={place} />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-transparent" aria-hidden="true" />
      <figcaption className="absolute bottom-3 start-5 text-white">
        <span className="block font-display text-2xl uppercase leading-none drop-shadow rtl:font-bold rtl:normal-case">{name}</span>
        {lang === 'en' && ar && (
          <span lang="ar" className="mt-0.5 block text-sm text-white/85">
            {ar}
          </span>
        )}
        {photo?.credit && <span className="mt-1 block text-[10px] text-white/70">{photo.credit}</span>}
      </figcaption>
    </figure>
  );
}

const CARD = 'pointer-events-auto rounded-4xl border border-white/60 bg-white/90 p-6 shadow-lift backdrop-blur-md md:p-8';

/** One scroll stage of the journey with a content card on one side of the screen. */
export function Stop({
  stage,
  n,
  place,
  side,
  title,
  lang,
  children,
}: {
  stage: number;
  n: number;
  place: Place;
  side: 'start' | 'end';
  title: string;
  lang: Locale;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { name } = usePlaceName(place, lang);
  const id = `stop-${n}`;
  return (
    <section data-stage={stage} aria-labelledby={id} className="relative flex min-h-[130svh] items-center py-24">
      <Container className={cn('flex', side === 'end' && 'lg:justify-end')}>
        <article className={cn(CARD, 'w-full max-w-[34rem]')}>
          <Postcard place={place} lang={lang} />
          <p className="mt-6 text-sm font-semibold text-blue">
            {t('journey.stop')} <bdi>{n}</bdi> · {name}
          </p>
          <h2 id={id} className="mt-2 font-display text-display-md uppercase text-navy rtl:font-bold rtl:normal-case">
            {title}
          </h2>
          {children}
        </article>
      </Container>
    </section>
  );
}

/** Stage 0 runway under the hero: the port crane sequence plays while this scrolls by. */
export function PortRunway({ lang }: { lang: Locale }) {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-[100svh] items-end pb-24">
      <Container>
        <p className={cn(CARD, 'inline-flex max-w-md flex-col gap-2 p-5 md:p-6')}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue">
            <span className="size-2 rounded-full bg-yellow" aria-hidden="true" />
            {t('journey.start')}
          </span>
          <span className="text-steel">{t('journey.startBody')}</span>
          <span className="sr-only">{lang}</span>
        </p>
      </Container>
    </div>
  );
}

export function HubPanel({ stage, lang }: { stage: number; lang: Locale }) {
  const { t } = useTranslation();
  const { name } = usePlaceName('fujairah', lang);
  return (
    <section data-stage={stage} aria-labelledby="hub-title" className="relative flex min-h-[170svh] items-start pt-[30svh]">
      <Container>
        <article className="pointer-events-auto max-w-md rounded-4xl bg-navy/90 p-6 text-white shadow-lift backdrop-blur-md md:p-8">
          <p className="text-sm font-semibold text-yellow">
            {t('journey.stop')} <bdi>6</bdi> · {name}
          </p>
          <h2 id="hub-title" className="mt-2 font-display text-display-md uppercase rtl:font-bold rtl:normal-case">
            {t('journey.hubTitle')}
          </h2>
          <p className="mt-3 text-offwhite/80">{t('journey.hubBody')}</p>
        </article>
      </Container>
    </section>
  );
}

export function DestinationPanel({ stage, cta }: { stage: number; cta: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section data-stage={stage} aria-labelledby="dest-title" className="relative flex min-h-[150svh] items-end pb-[12svh]">
      <Container>
        <article className="pointer-events-auto max-w-lg rounded-4xl bg-yellow p-6 text-navy shadow-lift md:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">
            <span className="size-2 rounded-full bg-[#3BD671]" aria-hidden="true" />
            {t('journey.delivered')}
          </p>
          <h2 id="dest-title" className="mt-4 font-display text-display-md uppercase rtl:font-bold rtl:normal-case">
            {t('journey.destTitle')}
          </h2>
          <p className="mt-3 max-w-prose text-navy/80">{t('journey.destBody')}</p>
          <div className="mt-6 flex flex-wrap gap-3">{cta}</div>
        </article>
      </Container>
    </section>
  );
}
