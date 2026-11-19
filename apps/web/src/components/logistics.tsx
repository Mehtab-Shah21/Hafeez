import { Loader2, MapPin, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { EMIRATES, LOCALE_TAGS, type ApiResponse, type Locale, type PublicSettingsDTO, type TrackingDTO } from '@app/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Courier tracking UI wired to GET /api/public/track/:id (currently a demo stub server-side). */
export function TrackingWidget({ lang }: { lang: Locale }) {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const [state, setState] = useState<{ loading: boolean; data?: TrackingDTO; error?: string }>({ loading: false });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = id.trim();
    if (!/^[A-Za-z0-9-]{4,40}$/.test(clean)) return setState({ loading: false, error: t('tracking.invalid') });
    setState({ loading: true });
    try {
      const res = await fetch(`/api/public/track/${encodeURIComponent(clean)}`);
      const body = (await res.json()) as ApiResponse<TrackingDTO>;
      setState(body.ok ? { loading: false, data: body.data } : { loading: false, error: t('tracking.invalid') });
    } catch {
      setState({ loading: false, error: t('form.error') });
    }
  };

  const fmt = new Intl.DateTimeFormat(LOCALE_TAGS[lang], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' });

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card md:p-8">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-sm font-medium text-navy">{t('tracking.label')}</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={t('tracking.placeholder')}
            dir="ltr"
            className="mt-2 h-12 w-full rounded-xl border border-mist px-4 text-start uppercase tracking-wide"
          />
        </label>
        <Button type="submit" chevron={false} disabled={state.loading}>
          {state.loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
          {t('tracking.submit')}
        </Button>
      </form>
      <div aria-live="polite">
        {state.error && <p className="mt-4 text-sm font-medium text-red-700">{state.error}</p>}
        {state.data && (
          <div className="mt-6">
            <p className="text-lg font-semibold text-navy">
              <bdi dir="ltr">{state.data.id}</bdi> · {t(`tracking.status.${state.data.status}`)}
            </p>
            <ol className="mt-4 space-y-4 border-s-2 border-mist ps-6">
              {state.data.events.map((ev) => (
                <li key={ev.at} className="relative">
                  <span className="absolute -start-[1.95rem] top-1 size-3 rounded-full bg-yellow ring-4 ring-white" aria-hidden="true" />
                  <p className="font-medium text-navy">{t(`tracking.status.${ev.status}`)}</p>
                  <p className="text-sm text-steel">
                    {ev.location} · <time dateTime={ev.at}>{fmt.format(new Date(ev.at))}</time>
                  </p>
                </li>
              ))}
            </ol>
            {state.data.isDemo && <p className="mt-4 rounded-xl bg-offwhite p-3 text-xs text-steel">{t('tracking.demo')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Interactive schematic map: the seven emirates as positioned nodes along the Gulf coast plus GCC lanes.
 * Schematic by design (not survey-accurate). Selecting an emirate shows our branch there, if any.
 */
const NODES: Record<string, { x: number; y: number }> = {
  'ras-al-khaimah': { x: 560, y: 70 },
  'umm-al-quwain': { x: 520, y: 115 },
  ajman: { x: 495, y: 150 },
  sharjah: { x: 470, y: 180 },
  fujairah: { x: 610, y: 175 },
  dubai: { x: 430, y: 215 },
  'abu-dhabi': { x: 270, y: 320 },
};
const GCC = [
  { key: 'oman', en: 'Muscat, Oman', ar: 'مسقط، عُمان', x: 720, y: 260 },
  { key: 'ksa', en: 'Riyadh, KSA', ar: 'الرياض، السعودية', x: 30, y: 300 },
  { key: 'qatar', en: 'Doha, Qatar', ar: 'الدوحة، قطر', x: 110, y: 150 },
  { key: 'bahrain', en: 'Manama, Bahrain', ar: 'المنامة، البحرين', x: 70, y: 90 },
];

export function LanesMap({ lang, settings }: { lang: Locale; settings: PublicSettingsDTO }) {
  const [active, setActive] = useState('dubai');
  const branch = settings.company.branches.find((b) => b.emirate === active);
  const em = EMIRATES.find((e) => e.key === active);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="surface-dark relative overflow-hidden rounded-3xl bg-navy-900 p-4">
        <svg viewBox="0 0 780 420" className="h-auto w-full" role="img" aria-label={lang === 'ar' ? 'خريطة تخطيطية للإمارات وخطوط الخليج' : 'Schematic map of the UAE and GCC lanes'}>
          <path d="M120 360C200 330 250 320 300 300S410 240 450 200 540 120 570 50L640 90C620 150 640 200 620 240S520 330 440 360 260 400 120 400z" fill="#18284D" stroke="#2F63FF" strokeOpacity=".5" strokeWidth="2" />
          {GCC.map((g) => (
            <g key={g.key}>
              <path d={`M${NODES.dubai!.x} ${NODES.dubai!.y}Q${(g.x + NODES.dubai!.x) / 2} ${Math.min(g.y, NODES.dubai!.y) - 80} ${g.x} ${g.y}`} fill="none" stroke="#FFC62B" strokeOpacity=".55" strokeWidth="2" strokeDasharray="6 8" className="motion-safe:animate-[dash_3s_linear_infinite]" />
              <circle cx={g.x} cy={g.y} r="6" fill="#FFC62B" />
              <text x={g.x} y={g.y - 14} textAnchor="middle" className="fill-offwhite text-[14px]">
                {g[lang]}
              </text>
            </g>
          ))}
          {EMIRATES.map((e) => {
            const n = NODES[e.key]!;
            const on = e.key === active;
            return (
              <g key={e.key}>
                <circle cx={n.x} cy={n.y} r={on ? 12 : 8} className={cn('transition-all', on ? 'fill-yellow' : 'fill-white')} />
                <text x={n.x + 16} y={n.y + 5} className={cn('text-[15px] font-semibold', on ? 'fill-yellow' : 'fill-offwhite')}>
                  {e[lang]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div>
        <div role="radiogroup" aria-label={lang === 'ar' ? 'اختر الإمارة' : 'Choose an emirate'} className="flex flex-wrap gap-2">
          {EMIRATES.map((e) => (
            <button
              key={e.key}
              type="button"
              role="radio"
              aria-checked={e.key === active}
              onClick={() => setActive(e.key)}
              className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition-colors', e.key === active ? 'border-navy bg-navy text-white' : 'border-mist bg-white text-navy hover:border-navy/40')}
            >
              {e[lang]}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-card">
          <p className="flex items-center gap-2 text-lg font-semibold text-navy">
            <MapPin className="size-5 text-blue" aria-hidden="true" /> {em?.[lang]}
          </p>
          {branch ? (
            <>
              <p className="mt-2 font-medium text-navy">{branch.name}</p>
              <p className="text-steel">{branch.address}</p>
              <p dir="ltr" className="mt-2 text-start text-steel rtl:text-end">
                {branch.phone}
              </p>
            </>
          ) : (
            <p className="mt-2 text-steel">{lang === 'ar' ? 'نخدم هذه الإمارة من أقرب فروعنا مع توصيل يومي.' : 'Served daily from our nearest branch.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
