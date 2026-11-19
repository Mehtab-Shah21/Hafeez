import { useEffect, useState } from 'react';
import { EMIRATES, type Locale } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Card, Container, GlassCard, Heading, Section } from '@/components/primitives';

/**
 * DEV ONLY: a page for checking tokens, fonts, buttons and RTL. Real content comes from the DB;
 * the sample text here exists only for this preview and is never shipped (see main.tsx).
 */
const copy = {
  en: {
    h1: ['Moving the', 'weight of the UAE', 'forward'],
    lead: 'Cranes, forklifts and trucks with trained operators, dispatched to any site in the seven emirates.',
    quote: 'Get a quote',
    browse: 'Browse equipment',
    h2: 'Equipment rental',
    body: 'Rent the machine you need for a day, a week or the full project. Every unit is inspected before dispatch and delivered on our own lowbeds.',
    card: 'Mobile crane, 50 t',
    cardBody: 'All-terrain crane for building and industrial lifts. Main boom 40 m.',
    stat: 'Machines and trucks',
    switch: 'العربية',
  },
  ar: {
    h1: ['نحمل', 'ثقل الإمارات', 'إلى الأمام'],
    lead: 'رافعات ورافعات شوكية وشاحنات مع مشغلين مدربين، تصل إلى أي موقع في الإمارات السبع.',
    quote: 'اطلب عرض سعر',
    browse: 'تصفح المعدات',
    h2: 'تأجير المعدات',
    body: 'استأجر المعدة التي تحتاجها ليوم أو أسبوع أو طوال المشروع. تُفحص كل وحدة قبل الإرسال وتُنقل على شاحناتنا المنخفضة.',
    card: 'رافعة متحركة 50 طن',
    cardBody: 'رافعة لجميع التضاريس لعمليات الرفع في المباني والمنشآت الصناعية. الذراع الرئيسي 40 م.',
    stat: 'معدة وشاحنة',
    switch: 'English',
  },
} satisfies Record<Locale, unknown>;

// Full class names so Tailwind's scanner generates them.
const swatches = [
  ['navy', 'bg-navy'],
  ['yellow', 'bg-yellow'],
  ['blue', 'bg-blue'],
  ['offwhite', 'bg-offwhite'],
  ['ink', 'bg-ink'],
  ['mist', 'bg-mist'],
  ['steel', 'bg-steel'],
] as const;

export default function Styleguide() {
  const [lang, setLang] = useState<Locale>('en');
  const t = copy[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <main id="main">
        <Section tone="navy" blueprint className="overflow-hidden">
          <Container>
            <div className="mb-10 flex items-center justify-between gap-4">
              <span className="text-sm text-offwhite/70">Styleguide · dev only</span>
              <Button variant="glass" size="sm" chevron={false} onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
                {t.switch}
              </Button>
            </div>
            <Heading level={1} className="max-w-4xl">
              {t.h1.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </Heading>
            <p className="mt-6 max-w-prose text-lg text-offwhite/80">{t.lead}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg">{t.quote}</Button>
              <Button variant="glass" size="lg" chevron={false}>
                {t.browse}
              </Button>
            </div>
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard>
                {/* dir=ltr keeps "350+" from flipping to "+350" in Arabic layouts. */}
                <p dir="ltr" className="tabular text-start font-display text-display-md text-yellow rtl:text-end rtl:font-bold">
                  350+
                </p>
                <p className="mt-2 text-offwhite/80">{t.stat}</p>
              </GlassCard>
            </div>
          </Container>
        </Section>

        <Section tone="light">
          <Container>
            <Heading level={2}>{t.h2}</Heading>
            <p className="mt-6 max-w-prose text-lg text-steel">{t.body}</p>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <h3 className="text-xl font-semibold text-navy">{t.card}</h3>
                <p className="mt-2 text-steel">{t.cardBody}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button size="sm">{t.quote}</Button>
                  <Button size="sm" variant="outline" chevron={false}>
                    {t.browse}
                  </Button>
                </div>
              </Card>
              <Card className="space-y-3">
                <Button className="w-full">{t.quote}</Button>
                <Button variant="secondary" className="w-full" chevron={false}>
                  {t.browse}
                </Button>
                <Button variant="ghost" className="w-full" chevron={false}>
                  {t.browse}
                </Button>
                <Button disabled className="w-full">
                  {t.quote}
                </Button>
              </Card>
              <Card>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {EMIRATES.map((e) => (
                    <li key={e.key} className="rounded-xl bg-offwhite px-3 py-2 text-navy">
                      {e[lang]}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
              {swatches.map(([name, bg]) => (
                <div key={name} className="text-center text-xs text-steel">
                  <div className={`size-16 rounded-2xl border border-mist ${bg}`} />
                  <p className="mt-2">{name}</p>
                </div>
              ))}
            </div>
            <label className="mt-12 block max-w-sm">
              <span className="text-sm font-medium text-navy">Phone</span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-mist bg-white px-4 text-ink placeholder:text-steel"
                placeholder="+971 50 000 0000"
                dir="ltr"
              />
            </label>
          </Container>
        </Section>
      </main>
    </>
  );
}
