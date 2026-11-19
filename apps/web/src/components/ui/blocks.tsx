import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { FaqItem, Locale, MediaDTO } from '@app/shared';
import { MachineryIcon } from '@/components/machinery/icons';
import { Container, Heading } from '@/components/primitives';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ Reveal */

/**
 * Reveal-once on scroll: IntersectionObserver adds `is-in`, CSS transitions transform/opacity,
 * and the element stays in its final state. Server HTML is visible (no hidden content for crawlers
 * or no-JS); hiding starts only after hydration for elements still below the fold.
 */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'ssr' | 'hidden' | 'in'>('ssr');
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already visible: no animation
    setState('hidden');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setState('in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={cn('reveal', state === 'hidden' && 'reveal-hidden', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ Headings */

export function SectionHeading({ title, intro, action, className, tone = 'light' }: { title: string; intro?: string; action?: ReactNode; className?: string; tone?: 'light' | 'navy' }) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-3xl">
        <Heading level={2}>{title}</Heading>
        {intro && <p className={cn('mt-5 max-w-prose text-lg', tone === 'navy' ? 'text-offwhite/75' : 'text-steel')}>{intro}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Breadcrumbs */

export interface Crumb {
  label: string;
  href?: string;
}

/** Visual breadcrumbs + BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items, lang, siteUrl }: { items: Crumb[]; lang: Locale; siteUrl: string }) {
  const { t } = useTranslation();
  const all: Crumb[] = [{ label: t('nav.home'), href: `/${lang}` }, ...items];
  const base = siteUrl.replace(/\/$/, '');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: base + c.href } : {}) })),
  };
  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
      </Helmet>
      <nav aria-label={t('breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-1 text-sm text-offwhite/70">
          {all.map((c, i) => (
            <li key={c.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 opacity-60 rtl:-scale-x-100" aria-hidden="true" />}
              {c.href && i < all.length - 1 ? (
                <Link to={c.href} className="hover:text-white hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-white">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/* ------------------------------------------------------------------ Page header */

/** Navy page header under the floating navbar, with breadcrumbs, the page H1 and intro. */
export function PageHeader({ title, intro, crumbs, lang, siteUrl, children }: { title: string; intro?: string; crumbs: Crumb[]; lang: Locale; siteUrl: string; children?: ReactNode }) {
  return (
    <div className="bg-navy p-2 sm:p-3">
      <header className="surface-dark blueprint-grid relative overflow-hidden rounded-4xl bg-navy-900 pb-14 pt-32 text-offwhite md:pb-20 md:pt-40">
        <Container>
          <Breadcrumbs items={crumbs} lang={lang} siteUrl={siteUrl} />
          <Heading level={1} size={2} className="mt-6 max-w-4xl text-white">
            {title}
          </Heading>
          {intro && <p className="mt-5 max-w-prose text-lg text-offwhite/80">{intro}</p>}
          {children}
        </Container>
      </header>
    </div>
  );
}

/* ------------------------------------------------------------------ Images */

/**
 * Real image when the admin has one (AVIF/WebP <picture>, explicit size, lazy below the fold);
 * otherwise a designed machinery illustration on a soft gradient so cards never look empty.
 */
export function MediaImage({ media, icon = 'crane', className, sizes = '(min-width: 1024px) 33vw, 100vw', priority = false, tone = 'navy' }: { media: MediaDTO | null; icon?: string; className?: string; sizes?: string; priority?: boolean; tone?: 'navy' | 'light' }) {
  if (!media) {
    return (
      <div className={cn('relative grid place-items-center overflow-hidden', tone === 'navy' ? 'bg-gradient-to-br from-navy-700 to-navy-900 text-yellow/90' : 'bg-gradient-to-br from-white to-mist text-navy/70', className)} aria-hidden="true">
        <div className="blueprint-grid absolute inset-0 opacity-60" />
        <MachineryIcon name={icon} className="relative size-24 md:size-28" />
      </div>
    );
  }
  return (
    <picture className={cn('block overflow-hidden', className)}>
      {media.sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcset} sizes={sizes} />
      ))}
      <img
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : {})}
        className="h-full w-full object-cover"
      />
    </picture>
  );
}

/* ------------------------------------------------------------------ Divider */

/** Section divider: a small truck crosses the line once when scrolled into view (transform only). */
export function MachineryDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className={cn('relative mx-auto h-10 max-w-content overflow-hidden px-4', className)}>
      <div className="absolute inset-x-4 bottom-2 border-t-2 border-dashed border-navy/15" />
      <svg viewBox="0 0 64 28" className={cn('divider-truck absolute bottom-2 h-7 w-16 text-navy rtl:-scale-x-100', inView && 'is-in')}>
        <path d="M2 4h32v16H2zM34 10h12l8 8v2H34z" className="fill-yellow" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="22" r="4" fill="currentColor" />
        <circle cx="44" cy="22" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ Marquee */

/** Infinite logo marquee: CSS transform loop, paused on hover/focus, stops under reduced motion. */
export function Marquee({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="marquee group relative overflow-hidden" role="region" aria-label={label}>
      <div className="marquee-track flex w-max gap-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="flex shrink-0 gap-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Stats */

/** Count-up number that runs once in view; text is final in SSR and for reduced motion. */
export function StatCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setShown(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 1400);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <bdi ref={ref} className="tabular">
      {shown.toLocaleString('en-US')}
      {suffix}
    </bdi>
  );
}

/* ------------------------------------------------------------------ FAQ */

export function FaqList({ items, className }: { items: (FaqItem & { id?: string })[]; className?: string }) {
  return (
    <Accordion.Root type="single" collapsible className={cn('divide-y divide-mist rounded-3xl bg-white shadow-card', className)}>
      {items.map((f, i) => (
        <Accordion.Item key={f.id ?? i} value={f.id ?? String(i)}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-start text-lg font-semibold text-navy hover:text-blue md:px-8">
              {f.q}
              <ChevronDown className="size-5 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden="true" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden px-6 pb-6 text-steel data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down md:px-8">
            <p className="max-w-prose">{f.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

/** FAQPage JSON-LD for a list of questions. */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
    </Helmet>
  );
}

/* ------------------------------------------------------------------ Rating */

export function Stars({ n }: { n: number }) {
  const { t } = useTranslation();
  return (
    <span role="img" aria-label={t('rating', { n })} className="flex gap-0.5 text-yellow">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={cn('size-4', i >= n && 'opacity-25')} fill="currentColor" aria-hidden="true">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}
