import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { useRef, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EMIRATES, LOCALE_TAGS, type BlogPostDTO, type EquipmentDTO, type FleetDTO, type Locale, type ProjectDTO, type ServiceDTO } from '@app/shared';
import { categoryIcon, MachineryIcon } from '@/components/machinery/icons';
import { MediaImage } from '@/components/ui/blocks';
import { cn } from '@/lib/utils';

/** Pill "button" inside a fully clickable card (the card link carries the accessible name). */
function Pill({ children, tone = 'yellow' }: { children: string; tone?: 'yellow' | 'glass' }) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5', tone === 'yellow' ? 'bg-yellow text-navy' : 'border border-white/25 bg-white/10 text-white backdrop-blur')}>
      {children}
      <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
    </span>
  );
}

/** Image card with a big overlay heading and a pill at the bottom (reference: "Charter Air Freight"). */
export function ServiceCard({ s, lang, large = false }: { s: ServiceDTO; lang: Locale; large?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link to={`/${lang}/services/${s.slug}`} className={cn('group relative block overflow-hidden rounded-3xl bg-navy text-white shadow-card', large ? 'min-h-[26rem]' : 'min-h-[21rem]')}>
      <MediaImage media={s.image} icon={s.icon} className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6 md:p-8">
        <MachineryIcon name={s.icon} className="mb-auto size-10 text-yellow" />
        <h3 className="font-display text-display-md uppercase leading-none rtl:font-bold rtl:normal-case">{s.title}</h3>
        <p className="mt-3 line-clamp-2 max-w-md text-offwhite/80">{s.excerpt}</p>
        <div className="mt-6">
          <Pill tone="glass">{t('cta.learnMore')}</Pill>
        </div>
      </div>
    </Link>
  );
}

/** Equipment card on a soft gradient with a pointer tilt (transform only, rAF-free: pointer events are already per-frame). */
export function EquipmentCard({ e, lang }: { e: EquipmentDTO; lang: Locale }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (ev: PointerEvent) => {
    if (ev.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
  };
  const reset = () => ref.current && (ref.current.style.transform = '');
  const cap = `${e.capacityValue.toLocaleString('en-US')} ${e.capacityUnit}`;
  return (
    <Link
      ref={ref}
      to={`/${lang}/equipment/${e.slug}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-white to-offwhite shadow-card transition-[transform,box-shadow] duration-300 ease-out-quart hover:shadow-lift motion-reduce:transform-none"
    >
      <MediaImage media={e.images[0] ?? null} icon={categoryIcon[e.category.slug] ?? 'crane'} tone="light" className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-medium text-blue">{e.category.name}</p>
        <h3 className="mt-1 text-xl font-semibold text-navy">{e.name}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-steel">{e.summary}</p>
        <div className="mt-5 flex items-center justify-between gap-2 text-sm">
          <span dir="ltr" className="tabular rounded-full bg-navy px-3 py-1 font-semibold text-white">
            {cap}
          </span>
          <span className="text-steel">{e.withOperator ? t('equipment.operatorIncluded') : t('equipment.operatorOptional')}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectCard({ p, lang }: { p: ProjectDTO; lang: Locale }) {
  const emirate = EMIRATES.find((x) => x.key === p.emirate)?.[lang] ?? p.emirate;
  return (
    <Link to={`/${lang}/projects/${p.slug}`} className="group relative block min-h-[22rem] overflow-hidden rounded-3xl bg-navy text-white shadow-card">
      <MediaImage media={p.cover} icon="crane" className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/50 to-transparent" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6 md:p-8">
        <p className="text-sm text-yellow">
          {emirate} · <bdi className="tabular">{p.year}</bdi>
        </p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight">{p.title}</h3>
        <p className="mt-2 line-clamp-2 text-offwhite/80">{p.summary}</p>
        <ArrowUpRight className="absolute end-6 top-6 size-6 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 rtl:-scale-x-100" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function BlogCard({ b, lang }: { b: BlogPostDTO; lang: Locale }) {
  const date = b.publishedAt ? new Intl.DateTimeFormat(LOCALE_TAGS[lang], { dateStyle: 'medium', timeZone: 'Asia/Dubai' }).format(new Date(b.publishedAt)) : '';
  return (
    <Link to={`/${lang}/blog/${b.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-shadow hover:shadow-lift">
      <MediaImage media={b.cover} icon="truck" className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <time dateTime={b.publishedAt ?? undefined} className="text-sm text-steel">
          {date}
        </time>
        <h3 className="mt-2 text-xl font-semibold text-navy group-hover:text-blue">{b.title}</h3>
        <p className="mt-2 line-clamp-3 text-steel">{b.excerpt}</p>
      </div>
    </Link>
  );
}

export function FleetCard({ f }: { f: FleetDTO }) {
  const { t } = useTranslation();
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card">
      <MediaImage media={f.image} icon={f.slug === 'courier-van' ? 'parcel' : f.slug === 'lowbed' ? 'lowbed' : 'truck'} tone="light" className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold text-navy">{f.name}</h3>
        <p className="mt-2 flex-1 text-steel">{f.summary}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-offwhite p-3">
            <dt className="text-steel">{t('fleet.payload')}</dt>
            <dd className="tabular font-semibold text-navy">
              <bdi>{f.payloadTonnes}</bdi> {t('fleet.tonnes')}
            </dd>
          </div>
          <div className="rounded-2xl bg-offwhite p-3">
            <dt className="text-steel">{t('fleet.deck')}</dt>
            <dd className="tabular font-semibold text-navy">
              <bdi>{f.deckLengthM}</bdi> {t('fleet.metres')}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-steel">
          <span className="font-medium text-navy">{t('fleet.bestFor')}:</span> {f.bestFor.join(' · ')}
        </p>
      </div>
    </article>
  );
}
