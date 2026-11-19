import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale, TestimonialDTO } from '@app/shared';
import { Stars } from '@/components/ui/blocks';

/**
 * Testimonial carousel. Framer Motion (LazyMotion + domAnimation keeps it to the small feature set)
 * crossfades/slides cards with transform + opacity. All quotes are in the DOM for SEO; only the
 * current page of cards is visible. Arrows mirror in RTL.
 */
export function Testimonials({ items, lang }: { items: TestimonialDTO[]; lang: Locale }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);
  const perPage = 2;
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = items.slice(page * perPage, page * perPage + perPage);
  const dir = lang === 'ar' ? -1 : 1;
  const go = (d: number) => setPage((p) => (p + d + pages) % pages);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="grid gap-6 md:grid-cols-2" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {current.map((tm, i) => (
            <m.figure
              key={tm.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 * dir }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] } }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 * dir, transition: { duration: 0.3 } }}
              className="flex h-full flex-col rounded-3xl bg-white p-8 shadow-card"
            >
              <Quote className="size-8 text-yellow rtl:-scale-x-100" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-lg text-ink">{tm.quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy font-semibold text-white" aria-hidden="true">
                  {tm.name.replace(/[^\p{L}]/gu, '').slice(0, 1) || '•'}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-navy">{tm.name}</span>
                  <span className="block text-sm text-steel">
                    {tm.role}, {tm.company}
                  </span>
                </span>
                <Stars n={tm.rating} />
              </figcaption>
            </m.figure>
          ))}
        </AnimatePresence>
      </div>
      {pages > 1 && (
        <div className="mt-8 flex items-center gap-3">
          <button type="button" onClick={() => go(-1)} className="grid size-12 place-items-center rounded-full border border-navy/20 text-navy hover:bg-navy hover:text-white" aria-label={lang === 'ar' ? 'السابق' : 'Previous'}>
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(1)} className="grid size-12 place-items-center rounded-full border border-navy/20 text-navy hover:bg-navy hover:text-white" aria-label={lang === 'ar' ? 'التالي' : 'Next'}>
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <p className="tabular ms-2 text-sm text-steel">
            <bdi>
              {page + 1} / {pages}
            </bdi>
          </p>
          <span className="sr-only">{t('sections.testimonials')}</span>
        </div>
      )}
    </LazyMotion>
  );
}
