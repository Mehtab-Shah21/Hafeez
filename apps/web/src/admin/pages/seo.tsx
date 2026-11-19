import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle2, Monitor, RefreshCw, Smartphone, Trash2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { hasPermission, type Locale, type RoleKey, type SeoEntityType } from '@app/shared';
import { cn } from '@/lib/utils';
import { api, errorText } from '../api';
import { Badge, Btn, Card, DataTable, Field, Input, Notice, PageTitle, Select, Textarea } from '../ui';

interface Check {
  id: string;
  status: 'good' | 'warn' | 'bad';
  label: string;
  hint: string;
}
interface SeoMetaRow {
  title: string;
  description: string;
  focusKeyword: string;
  canonical: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImageId: string | null;
  twitterCard: 'summary' | 'summary_large_image';
  jsonLdOverride: unknown;
}
interface MetaResponse {
  entity: { name: string; path: string; h1: string; firstParagraph: string };
  meta: SeoMetaRow | null;
  score: number;
  checks: Check[];
}

const scoreTone = (s: number) => (s >= 80 ? 'good' : s >= 50 ? 'warn' : 'bad');
const Counter = ({ n, min, max }: { n: number; min: number; max: number }) => (
  <span className={cn('tabular text-xs font-semibold', n >= min && n <= max ? 'text-green-700' : n === 0 ? 'text-steel' : 'text-amber-700')}>
    {n} / {min}–{max}
  </span>
);

/** Live Google result preview. Desktop truncates around 600px of title, mobile a little more. */
function SerpPreview({ title, description, url, mobile }: { title: string; description: string; url: string; mobile: boolean }) {
  const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  return (
    <div className={cn('rounded-xl border border-mist bg-white p-4 font-[arial,sans-serif]', mobile ? 'max-w-[360px]' : 'max-w-[600px]')}>
      <p className="truncate text-xs text-[#202124]">{url.replace(/^https?:\/\//, '').replace(/\//g, ' › ')}</p>
      <p className={cn('mt-1 text-[#1a0dab]', mobile ? 'text-base leading-snug' : 'text-xl')}>{cut(title || 'Add a meta title', mobile ? 75 : 60)}</p>
      <p className="mt-1 text-sm text-[#4d5156]">{cut(description || 'Add a meta description so Google shows your own summary here.', mobile ? 120 : 160)}</p>
    </div>
  );
}

function SocialPreview({ title, description, site }: { title: string; description: string; site: string }) {
  return (
    <div className="max-w-[500px] overflow-hidden rounded-xl border border-mist bg-white">
      <div className="grid aspect-[1.91/1] place-items-center bg-navy text-sm text-offwhite/70">OG image (1200×630)</div>
      <div className="border-t border-mist bg-[#f2f3f5] p-3">
        <p className="text-xs uppercase text-[#606770]">{site.replace(/^https?:\/\//, '')}</p>
        <p className="font-semibold text-[#1d2129]">{title}</p>
        <p className="line-clamp-2 text-sm text-[#606770]">{description}</p>
      </div>
    </div>
  );
}

/** Per-entity, per-language SEO editor: fields with counters, SERP + social previews, checklist, JSON-LD override. */
export function SeoPanel({ type, id, role }: { type: SeoEntityType; id: string; role: RoleKey }) {
  const [lang, setLang] = useState<Locale>('en');
  const qc = useQueryClient();
  const canWrite = hasPermission(role, 'seo:write');
  const { data, error } = useQuery({ queryKey: ['seo-meta', type, id, lang], queryFn: () => api<MetaResponse>('GET', `/seo/meta/${type}/${id}/${lang}`) });
  const [v, setV] = useState<SeoMetaRow | null>(null);
  const [ldText, setLdText] = useState('');
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    const m = data.meta;
    setV({
      title: m?.title ?? '',
      description: m?.description ?? '',
      focusKeyword: m?.focusKeyword ?? '',
      canonical: m?.canonical ?? null,
      robotsIndex: m?.robotsIndex ?? true,
      robotsFollow: m?.robotsFollow ?? true,
      ogTitle: m?.ogTitle ?? '',
      ogDescription: m?.ogDescription ?? '',
      ogImageId: m?.ogImageId ?? null,
      twitterCard: m?.twitterCard ?? 'summary_large_image',
      jsonLdOverride: m?.jsonLdOverride ?? null,
    });
    setLdText(m?.jsonLdOverride ? JSON.stringify(m.jsonLdOverride, null, 2) : '');
    setMsg(null);
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      let override: unknown = null;
      if (ldText.trim()) override = JSON.parse(ldText) as unknown; // throws → onError
      return api('PUT', `/seo/meta/${type}/${id}/${lang}`, { ...v, jsonLdOverride: override });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['seo-meta', type, id, lang] });
      await qc.invalidateQueries({ queryKey: ['seo-entities'] });
      setMsg({ kind: 'success', text: 'SEO saved and re-scored.' });
    },
    onError: (e) => setMsg({ kind: 'error', text: e instanceof SyntaxError ? 'The JSON-LD override is not valid JSON.' : errorText(e) }),
  });

  if (error) return <Notice kind="error">{errorText(error)}</Notice>;
  if (!data || !v) return <p className="text-steel">Loading SEO…</p>;
  const url = `${location.origin}/${lang}${data.entity.path}`;
  const set = <K extends keyof SeoMetaRow>(k: K, val: SeoMetaRow[K]) => setV({ ...v, [k]: val });

  return (
    <Card
      title={`SEO · ${data.entity.name}`}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={scoreTone(data.score)}>Score {data.score}</Badge>
          <Select value={lang} onChange={(e) => setLang(e.target.value as Locale)} aria-label="Language" className="w-32">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </Select>
        </div>
      }
    >
      <div className="grid gap-8 xl:grid-cols-2">
        <fieldset disabled={!canWrite} className="grid gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <Field label="Focus keyword" hint="The main search phrase, e.g. crane rental Dubai">
            <Input value={v.focusKeyword} onChange={(e) => set('focusKeyword', e.target.value)} />
          </Field>
          <Field label="Meta title" counter={<Counter n={v.title.length} min={50} max={60} />}>
            <Input value={v.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Meta description" counter={<Counter n={v.description.length} min={150} max={160} />}>
            <Textarea rows={3} value={v.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Canonical URL (optional)" hint="Only if this content's main copy lives at another URL">
            <Input dir="ltr" value={v.canonical ?? ''} onChange={(e) => set('canonical', e.target.value || null)} placeholder={url} />
          </Field>
          <div className="flex flex-wrap gap-6 text-sm font-medium text-navy">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-navy" checked={v.robotsIndex} onChange={(e) => set('robotsIndex', e.target.checked)} /> Index
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-navy" checked={v.robotsFollow} onChange={(e) => set('robotsFollow', e.target.checked)} /> Follow links
            </label>
          </div>
          <Field label="Open Graph title" hint="Shown when shared on WhatsApp, LinkedIn, X. Defaults to the meta title.">
            <Input value={v.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} />
          </Field>
          <Field label="Open Graph description">
            <Textarea rows={2} value={v.ogDescription} onChange={(e) => set('ogDescription', e.target.value)} />
          </Field>
          <Field label="Twitter card">
            <Select value={v.twitterCard} onChange={(e) => set('twitterCard', e.target.value as SeoMetaRow['twitterCard'])}>
              <option value="summary_large_image">Large image</option>
              <option value="summary">Summary</option>
            </Select>
          </Field>
          <Field label="JSON-LD override (advanced)" hint="Leave empty to use the automatic schema (Organization, Service, Product, Article, FAQPage, BreadcrumbList).">
            <Textarea rows={6} dir="ltr" className="font-mono text-xs" value={ldText} onChange={(e) => setLdText(e.target.value)} placeholder='{"@context":"https://schema.org", ...}' />
          </Field>
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          {canWrite && (
            <div>
              <Btn onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save SEO'}
              </Btn>
            </div>
          )}
        </fieldset>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-navy">Google preview</h3>
              <Btn variant={mobile ? 'ghost' : 'secondary'} className="h-8 px-2" onClick={() => setMobile(false)} aria-pressed={!mobile} aria-label="Desktop">
                <Monitor />
              </Btn>
              <Btn variant={mobile ? 'secondary' : 'ghost'} className="h-8 px-2" onClick={() => setMobile(true)} aria-pressed={mobile} aria-label="Mobile">
                <Smartphone />
              </Btn>
            </div>
            <SerpPreview title={v.title} description={v.description} url={url} mobile={mobile} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">Social share preview</h3>
            <SocialPreview title={v.ogTitle || v.title} description={v.ogDescription || v.description} site={location.origin} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">Checklist (saved values)</h3>
            <ul className="space-y-2">
              {data.checks.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm">
                  {c.status === 'good' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" /> : c.status === 'warn' ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />}
                  <span>
                    <span className="font-medium text-navy">{c.label}</span>
                    {c.status !== 'good' && <span className="block text-steel">{c.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface BulkRow {
  type: SeoEntityType;
  id: string;
  locale: Locale;
  name: string;
  path: string;
  title: string;
  description: string;
  focusKeyword: string;
  robotsIndex: boolean;
  score: number;
}

/** Bulk SEO table: every page/item in both languages, inline-editable title and description. */
export function SeoTable({ role }: { role: RoleKey }) {
  const qc = useQueryClient();
  const canWrite = hasPermission(role, 'seo:write');
  const [filter, setFilter] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: ['seo-entities'], queryFn: () => api<BulkRow[]>('GET', '/seo/entities') });
  const [editing, setEditing] = useState<Record<string, { title: string; description: string }>>({});
  const [msg, setMsg] = useState('');
  const k = (r: BulkRow) => `${r.type}:${r.id}:${r.locale}`;

  const saveRow = async (r: BulkRow) => {
    const e = editing[k(r)];
    if (!e) return;
    try {
      const current = await api<MetaResponse>('GET', `/seo/meta/${r.type}/${r.id}/${r.locale}`);
      await api('PUT', `/seo/meta/${r.type}/${r.id}/${r.locale}`, { ...(current.meta ?? {}), title: e.title, description: e.description, focusKeyword: current.meta?.focusKeyword ?? r.focusKeyword });
      setEditing(({ [k(r)]: _, ...rest }) => rest);
      await qc.invalidateQueries({ queryKey: ['seo-entities'] });
      setMsg('Saved.');
    } catch (err) {
      setMsg(errorText(err));
    }
  };
  const rescore = useMutation({ mutationFn: () => api('POST', '/seo/rescore'), onSuccess: () => qc.invalidateQueries({ queryKey: ['seo-entities'] }) });

  const rows = data.filter((r) => !filter || `${r.name} ${r.path} ${r.title}`.toLowerCase().includes(filter.toLowerCase()));
  const columns = useMemo<ColumnDef<BulkRow, unknown>[]>(
    () => [
      { id: 'score', header: 'Score', accessorFn: (r) => r.score, cell: (c) => <Badge tone={scoreTone(c.row.original.score)}>{c.row.original.score}</Badge> },
      {
        id: 'page',
        header: 'Page',
        accessorFn: (r) => r.name,
        cell: (c) => (
          <Link to={`/admin/seo/${c.row.original.type}/${c.row.original.id}`} className="font-medium text-navy hover:underline">
            {c.row.original.name}
            <span className="block text-xs font-normal text-steel" dir="ltr">
              {c.row.original.path}
            </span>
          </Link>
        ),
      },
      { id: 'lang', header: 'Lang', accessorFn: (r) => r.locale },
      ...(['title', 'description'] as const).map(
        (f): ColumnDef<BulkRow, unknown> => ({
          id: f,
          header: f === 'title' ? 'Meta title' : 'Meta description',
          accessorFn: (r) => r[f],
          cell: (c) => {
            const r = c.row.original;
            const e = editing[k(r)];
            const val = e ? e[f] : r[f];
            const [min, max] = f === 'title' ? [50, 60] : [150, 160];
            return (
              <div className="min-w-56" dir={r.locale === 'ar' ? 'rtl' : 'ltr'}>
                {canWrite ? (
                  f === 'title' ? (
                    <Input value={val} onChange={(ev) => setEditing({ ...editing, [k(r)]: { ...(e ?? { title: r.title, description: r.description }), [f]: ev.target.value } })} />
                  ) : (
                    <Textarea rows={2} value={val} onChange={(ev) => setEditing({ ...editing, [k(r)]: { ...(e ?? { title: r.title, description: r.description }), [f]: ev.target.value } })} />
                  )
                ) : (
                  val
                )}
                <Counter n={val.length} min={min} max={max} />
              </div>
            );
          },
        }),
      ),
      {
        id: 'save',
        header: '',
        cell: (c) =>
          editing[k(c.row.original)] ? (
            <Btn className="h-8" onClick={() => void saveRow(c.row.original)}>
              Save
            </Btn>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editing, canWrite],
  );

  return (
    <>
      <PageTitle
        title="SEO overview"
        sub={`${data.length} entries · average score ${data.length ? Math.round(data.reduce((n, r) => n + r.score, 0) / data.length) : 0}`}
        actions={
          canWrite && (
            <Btn variant="secondary" onClick={() => rescore.mutate()} disabled={rescore.isPending}>
              <RefreshCw /> Re-score all
            </Btn>
          )
        }
      />
      <div className="mb-4 max-w-sm">
        <Input type="search" placeholder="Filter pages…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" />
      </div>
      {msg && (
        <div className="mb-4">
          <Notice kind={msg === 'Saved.' ? 'success' : 'error'}>{msg}</Notice>
        </div>
      )}
      {isLoading ? <p className="text-steel">Loading…</p> : <DataTable data={rows} columns={columns} />}
    </>
  );
}

export function SeoEntityPage({ role, type, id }: { role: RoleKey; type: SeoEntityType; id: string }) {
  return (
    <>
      <Link to="/admin/seo" className="mb-3 inline-block text-sm text-steel hover:text-navy">
        ← SEO overview
      </Link>
      <SeoPanel type={type} id={id} role={role} />
    </>
  );
}

interface NotFoundRow {
  id: string;
  path: string;
  hits: number;
  referrer: string;
  lastSeenAt: string;
  suggestions: string[];
}

export function NotFoundLog({ role }: { role: RoleKey }) {
  const qc = useQueryClient();
  const canWrite = hasPermission(role, 'seo:write');
  const { data = [] } = useQuery({ queryKey: ['seo-404'], queryFn: () => api<NotFoundRow[]>('GET', '/seo/not-found') });
  const [msg, setMsg] = useState('');
  const redirect = async (r: NotFoundRow, to: string) => {
    try {
      await api('POST', '/redirects', { from: r.path, to, code: 301, isActive: true });
      await api('DELETE', `/seo/not-found/${r.id}`);
      await qc.invalidateQueries({ queryKey: ['seo-404'] });
      setMsg(`Redirect created: ${r.path} → ${to}`);
    } catch (e) {
      setMsg(errorText(e));
    }
  };
  return (
    <>
      <PageTitle title="404 log" sub="Broken URLs visitors or crawlers requested, with the closest real pages." />
      {msg && (
        <div className="mb-4">
          <Notice kind="success">{msg}</Notice>
        </div>
      )}
      <DataTable
        data={data}
        empty="No 404s recorded."
        columns={[
          { id: 'path', header: 'Path', accessorFn: (r) => r.path, cell: (c) => <code dir="ltr">{c.row.original.path}</code> },
          { id: 'hits', header: 'Hits', accessorFn: (r) => r.hits },
          { id: 'last', header: 'Last seen', accessorFn: (r) => r.lastSeenAt.slice(0, 16).replace('T', ' ') },
          {
            id: 'sugg',
            header: 'Redirect to',
            cell: (c) => (
              <div className="flex flex-wrap gap-1">
                {c.row.original.suggestions.map((s) =>
                  canWrite ? (
                    <Btn key={s} variant="secondary" className="h-8" onClick={() => void redirect(c.row.original, s)}>
                      {s}
                    </Btn>
                  ) : (
                    <code key={s}>{s}</code>
                  ),
                )}
              </div>
            ),
          },
          {
            id: 'del',
            header: '',
            cell: (c) =>
              canWrite && (
                <Btn variant="ghost" aria-label="Dismiss" onClick={() => void api('DELETE', `/seo/not-found/${c.row.original.id}`).then(() => qc.invalidateQueries({ queryKey: ['seo-404'] }))}>
                  <Trash2 />
                </Btn>
              ),
          },
        ]}
      />
    </>
  );
}
