import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, FileDown, Save, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ZodTypeAny } from 'zod';
import {
  adminPageSchema,
  adminUserCreateSchema,
  analyticsSettingsSchema,
  companySettingsSchema,
  EMIRATES,
  footerSettingsSchema,
  hasPermission,
  heroSettingsSchema,
  INQUIRY_STATUSES,
  INQUIRY_TYPES,
  navbarSettingsSchema,
  robotsSettingsSchema,
  ROLES,
  seoGlobalSettingsSchema,
  themeSettingsSchema,
  type Permission,
  type RoleKey,
} from '@app/shared';
import { api, apiPaged, download, errorText } from '../api';
import { FormFields, MediaUploader, type FieldDef } from '../fields';
import { Badge, Btn, Card, DataTable, Field, Input, LangTabs, Notice, PageTitle, Select, Textarea } from '../ui';

/* ================================================================== Dashboard */

interface Summary {
  newInquiries: number;
  quotes30: number;
  total30: number;
  recentInquiries: { id: string; name: string; type: string; status: string; createdAt: string; company: string }[];
  recentActivity: { id: string; action: string; entityType: string; createdAt: string; user: { name: string } | null }[];
  counts: { services: number; equipment: number; posts: number };
  seo: { entries: number; avgScore: number | null; missingDescription: number; titleOutOfRange: number; notFound: number };
}

export function Dashboard({ role }: { role: RoleKey }) {
  const { data: s } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Summary>('GET', '/dashboard/summary') });
  if (!s) return <p className="text-steel">Loading…</p>;
  const tile = (label: string, value: string | number, href?: string) => (
    <Card className="p-5">
      <p className="text-sm text-steel">{label}</p>
      <p className="tabular mt-2 text-3xl font-semibold text-navy">{href ? <Link to={href}>{value}</Link> : value}</p>
    </Card>
  );
  return (
    <>
      <PageTitle title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tile('New inquiries', s.newInquiries, hasPermission(role, 'inquiries:manage') ? '/admin/inquiries' : undefined)}
        {tile('Quote requests (30 days)', s.quotes30)}
        {tile('All requests (30 days)', s.total30)}
        {tile('Average SEO score', s.seo.avgScore ?? '–', '/admin/seo')}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Latest inquiries">
          <ul className="divide-y divide-mist">
            {s.recentInquiries.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-navy">{i.name}</span> <span className="text-steel">{i.company}</span>
                </span>
                <span className="flex gap-2">
                  <Badge tone="info">{i.type}</Badge>
                  <Badge tone={i.status === 'NEW' ? 'warn' : 'neutral'}>{i.status}</Badge>
                </span>
              </li>
            ))}
            {!s.recentInquiries.length && <li className="py-2 text-sm text-steel">No inquiries yet.</li>}
          </ul>
        </Card>
        <Card title="SEO health">
          <ul className="space-y-2 text-sm">
            <li>
              Entries tracked: <b>{s.seo.entries}</b>
            </li>
            <li>
              Missing meta descriptions: <Badge tone={s.seo.missingDescription ? 'bad' : 'good'}>{s.seo.missingDescription}</Badge>
            </li>
            <li>
              Titles outside 30–65 characters: <Badge tone={s.seo.titleOutOfRange ? 'warn' : 'good'}>{s.seo.titleOutOfRange}</Badge>
            </li>
            <li>
              Logged 404 URLs: <Link to="/admin/seo/404" className="text-blue underline">{s.seo.notFound}</Link>
            </li>
          </ul>
        </Card>
        <Card title="Recent activity" className="lg:col-span-2">
          <ul className="divide-y divide-mist text-sm">
            {s.recentActivity.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span>
                  <b>{a.user?.name ?? 'System'}</b> {a.action} <span className="text-steel">{a.entityType}</span>
                </span>
                <time className="text-steel">{new Date(a.createdAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}</time>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* ================================================================== Settings forms */

function SettingForm({ settingKey, schema, fields, role, write, note }: { settingKey: string; schema: ZodTypeAny; fields: FieldDef[]; role: RoleKey; write: Permission; note?: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['setting', settingKey], queryFn: () => api<Record<string, unknown>>('GET', `/settings/${settingKey}`) });
  if (!data) return <p className="text-steel">Loading…</p>;
  return <SettingFormInner key={settingKey} settingKey={settingKey} schema={schema} fields={fields} initial={data} canWrite={hasPermission(role, write)} note={note} onSaved={() => qc.invalidateQueries({ queryKey: ['setting', settingKey] })} />;
}

function SettingFormInner({ settingKey, schema, fields, initial, canWrite, note, onSaved }: { settingKey: string; schema: ZodTypeAny; fields: FieldDef[]; initial: Record<string, unknown>; canWrite: boolean; note?: string; onSaved: () => void }) {
  const methods = useForm({ resolver: zodResolver(schema), defaultValues: initial });
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const save = useMutation({
    mutationFn: (v: unknown) => api('PUT', `/settings/${settingKey}`, v),
    onSuccess: () => {
      setMsg({ kind: 'success', text: 'Saved. The website uses the new values immediately.' });
      onSaved();
    },
    onError: (e) => setMsg({ kind: 'error', text: errorText(e) }),
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        {note && <Notice kind="warn">{note}</Notice>}
        <Card>
          <fieldset disabled={!canWrite}>
            <FormFields fields={fields} />
          </fieldset>
        </Card>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        {Object.keys(methods.formState.errors).length > 0 && <Notice kind="error">Please fix the highlighted fields ({Object.keys(methods.formState.errors).join(', ')}).</Notice>}
        {canWrite && (
          <Btn type="submit" disabled={save.isPending}>
            <Save /> Save
          </Btn>
        )}
      </form>
    </FormProvider>
  );
}

const locText = (base: string, label: string, kind: 'text' | 'textarea' = 'text'): FieldDef => ({ kind: 'localized', base, fields: [{ kind, name: '', label }] });

const COMPANY_FIELDS: FieldDef[] = [
  locText('name', 'Company name'),
  locText('tagline', 'Tagline'),
  locText('about', 'About text', 'textarea'),
  { kind: 'media', name: 'logoLightId', label: 'Logo (for dark backgrounds)' },
  { kind: 'media', name: 'logoDarkId', label: 'Logo (for light backgrounds)' },
  { kind: 'media', name: 'faviconId', label: 'Favicon' },
  { kind: 'text', name: 'whatsapp', label: 'WhatsApp number', hint: '+9715XXXXXXXX', dir: 'ltr' },
  { kind: 'lines', name: 'phones', label: 'Phone numbers' },
  { kind: 'lines', name: 'emails', label: 'Emails' },
  { kind: 'text', name: 'tradeLicence', label: 'Trade Licence no.', dir: 'ltr' },
  { kind: 'text', name: 'trn', label: 'TRN (VAT)', dir: 'ltr' },
  { kind: 'select', name: 'defaultLocale', label: 'Default language', options: [{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }] },
  { kind: 'json', name: 'branches', label: 'Branches (addresses + map coordinates)', hint: `Each: id, emirate (${EMIRATES.map((e) => e.key).join(', ')}), isHeadOffice, lat, lng, phone, text.en/ar.name/address` },
  { kind: 'json', name: 'workingHours', label: 'Working hours', rows: 8 },
  { kind: 'json', name: 'social', label: 'Social links', rows: 6 },
];

export function SettingsPage({ role }: { role: RoleKey }) {
  const [tab, setTab] = useState<'company' | 'theme' | 'navigation'>('company');
  return (
    <>
      <PageTitle title="Company & site settings" sub="Everything here appears across the website in both languages." />
      <div className="mb-6 flex gap-2" role="tablist">
        {(['company', 'theme', 'navigation'] as const).map((t) => (
          <Btn key={t} role="tab" aria-selected={tab === t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>
            {t[0]!.toUpperCase() + t.slice(1)}
          </Btn>
        ))}
      </div>
      {tab === 'company' && <SettingForm settingKey="company" schema={companySettingsSchema} fields={COMPANY_FIELDS} role={role} write="settings:write" />}
      {tab === 'theme' && (
        <SettingForm
          settingKey="theme"
          schema={themeSettingsSchema}
          role={role}
          write="settings:write"
          note="Keep enough contrast: text on yellow buttons is navy, so the yellow must stay light."
          fields={(['navy', 'yellow', 'blue', 'offwhite', 'ink'] as const).map((k) => ({ kind: 'color' as const, name: k, label: k }))}
        />
      )}
      {tab === 'navigation' && (
        <div className="space-y-8">
          <SettingForm settingKey="navbar" schema={navbarSettingsSchema} role={role} write="settings:write" fields={[{ kind: 'text', name: 'ctaHref', label: 'CTA link', dir: 'ltr' }, locText('ctaLabel', 'CTA label'), { kind: 'json', name: 'items', label: 'Menu items', rows: 16 }]} />
          <SettingForm settingKey="footer" schema={footerSettingsSchema} role={role} write="settings:write" fields={[locText('text', 'Footer text', 'textarea'), { kind: 'json', name: 'quoteBand', label: 'Quote band (en/ar: title, body, cta)', rows: 10 }, { kind: 'json', name: 'columns', label: 'Footer link columns', rows: 16 }]} />
        </div>
      )}
    </>
  );
}

export function HeroManager({ role }: { role: RoleKey }) {
  return (
    <>
      <PageTitle title="Hero manager" sub="Headline, buttons and the animated scene or scroll video on the home page." />
      <SettingForm
        settingKey="hero"
        schema={heroSettingsSchema}
        role={role}
        write="content:write"
        note="Video mode needs a muted MP4 exported with frequent keyframes (every 1–5 frames) so scrubbing is instant. Upload it to your CDN or /public/media/hero and paste the URLs."
        fields={[
          { kind: 'select', name: 'mode', label: 'Mode', options: [{ value: 'vector', label: 'Animated vector scene' }, { value: 'video', label: 'Scroll-scrubbed video' }] },
          { kind: 'select', name: 'intensity', label: 'Animation intensity', options: [{ value: 'subtle', label: 'Subtle' }, { value: 'standard', label: 'Standard' }, { value: 'cinematic', label: 'Cinematic' }] },
          { kind: 'text', name: 'videoUrl', label: 'Video URL (1080p)', dir: 'ltr' },
          { kind: 'text', name: 'videoUrlMobile', label: 'Video URL (720p, phones)', dir: 'ltr' },
          { kind: 'media', name: 'posterId', label: 'Video poster image' },
          { kind: 'media', name: 'backgroundId', label: 'Background photo behind the vector scene' },
          {
            kind: 'localized',
            base: 'text',
            fields: [
              { kind: 'text', name: 'eyebrow', label: 'Eyebrow line' },
              { kind: 'lines', name: 'lines', label: 'Headline lines (H1, 1–4 lines)' },
              { kind: 'textarea', name: 'subtitle', label: 'Subtitle', rows: 2 },
              { kind: 'text', name: 'primaryCta', label: 'Primary button' },
              { kind: 'text', name: 'secondaryCta', label: 'Secondary button' },
              { kind: 'lines', name: 'badges', label: 'Trust badges' },
            ],
          },
        ]}
      />
    </>
  );
}

export function SeoGlobal({ role }: { role: RoleKey }) {
  return (
    <>
      <PageTitle title="Global SEO & tracking" />
      <div className="space-y-8">
        <SettingForm
          settingKey="seo.global"
          schema={seoGlobalSettingsSchema}
          role={role}
          write="seo:write"
          fields={[locText('titleTemplate', 'Title template (%s = page title)'), { kind: 'media', name: 'defaultOgImageId', label: 'Default share image (1200×630)' }, { kind: 'text', name: 'googleVerification', label: 'Google Search Console verification code', dir: 'ltr' }, { kind: 'text', name: 'bingVerification', label: 'Bing verification code', dir: 'ltr' }]}
        />
        <SettingForm
          settingKey="analytics"
          schema={analyticsSettingsSchema}
          role={role}
          write="seo:write"
          note="Tracking loads only after a visitor accepts analytics cookies. Custom head/body code runs on every page with full access to the site: paste only code from vendors you trust, and test after saving."
          fields={[
            { kind: 'text', name: 'ga4Id', label: 'GA4 measurement ID', hint: 'G-XXXXXXX', dir: 'ltr' },
            { kind: 'text', name: 'gtmId', label: 'GTM container ID', hint: 'GTM-XXXXXX', dir: 'ltr' },
            { kind: 'text', name: 'metaPixelId', label: 'Meta Pixel ID', dir: 'ltr' },
            { kind: 'textarea', name: 'customHead', label: 'Custom <head> code', rows: 5 },
            { kind: 'textarea', name: 'customBody', label: 'Custom end-of-<body> code', rows: 5 },
          ]}
        />
        <SettingForm settingKey="robots" schema={robotsSettingsSchema} role={role} write="seo:write" fields={[{ kind: 'textarea', name: 'content', label: 'robots.txt', rows: 10, hint: 'The sitemap line is added automatically.' }]} />
      </div>
    </>
  );
}

/* ================================================================== Pages + sections */

interface PageRow {
  id: string;
  key: string;
  slug: string;
  status: string;
  content: { en: { title: string; intro: string }; ar: { title: string; intro: string } };
  sections: { id: string; type: string; order: number; isVisible: boolean; status: string; content: unknown; draftContent: unknown }[];
}

export function PagesList() {
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ['admin', 'pages'], queryFn: () => apiPaged<PageRow>('/pages?pageSize=50') });
  return (
    <>
      <PageTitle title="Pages" sub="Page titles, intros and content sections (EN + AR, draft and publish)." />
      <DataTable
        data={data?.items ?? []}
        onRowClick={(r) => nav(`/admin/pages/${r.id}`)}
        columns={[
          { id: 'key', header: 'Page', accessorFn: (r) => r.content.en.title },
          { id: 'path', header: 'Path', accessorFn: (r) => `/${r.key === 'home' ? '' : r.slug}` },
          { id: 'sections', header: 'Sections', accessorFn: (r) => r.sections.length },
          { id: 'drafts', header: 'Unpublished drafts', cell: (c) => (c.row.original.sections.some((s) => s.status === 'DRAFT') ? <Badge tone="warn">yes</Badge> : <Badge tone="good">no</Badge>) },
        ]}
      />
    </>
  );
}

export function PageEditor({ role }: { role: RoleKey }) {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const canWrite = hasPermission(role, 'content:write');
  const { data: page } = useQuery({ queryKey: ['admin', 'pages', id], queryFn: () => api<PageRow>('GET', `/pages/${id}`) });
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
  if (!page) return <p className="text-steel">Loading…</p>;
  return (
    <>
      <Link to="/admin/pages" className="mb-3 inline-block text-sm text-steel hover:text-navy">
        ← Pages
      </Link>
      <PageTitle title={page.content.en.title} actions={<a href={`/en/${page.key === 'home' ? '' : page.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue underline">View page</a>} />
      <PageMeta page={page} canWrite={canWrite} onSaved={refresh} />
      <h2 className="mb-3 mt-10 text-lg font-semibold text-navy">Sections</h2>
      {msg && (
        <div className="mb-4">
          <Notice kind={msg.kind}>{msg.text}</Notice>
        </div>
      )}
      <div className="space-y-6">
        {page.sections.map((s) => (
          <SectionEditor key={s.id} s={s} canWrite={canWrite} onDone={(m) => (setMsg(m), void refresh())} />
        ))}
        {!page.sections.length && <p className="text-steel">This page has no editable sections; its content comes from services, equipment or posts.</p>}
      </div>
      <div className="mt-10">
        <SeoPanelLink pageKey={page.key} />
      </div>
    </>
  );
}

function SeoPanelLink({ pageKey }: { pageKey: string }) {
  return (
    <Link to={`/admin/seo/page/${pageKey}`} className="font-semibold text-blue underline">
      Edit SEO for this page →
    </Link>
  );
}

function PageMeta({ page, canWrite, onSaved }: { page: PageRow; canWrite: boolean; onSaved: () => void }) {
  const methods = useForm({ resolver: zodResolver(adminPageSchema), defaultValues: { status: page.status, content: page.content } });
  const [msg, setMsg] = useState('');
  const save = useMutation({ mutationFn: (v: unknown) => api('PUT', `/pages/${page.id}`, v), onSuccess: () => (setMsg('Saved.'), onSaved()), onError: (e) => setMsg(errorText(e)) });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((v) => save.mutate(v))}>
        <Card title="Title & intro">
          <fieldset disabled={!canWrite}>
            <FormFields fields={[{ kind: 'localized', base: 'content', fields: [{ kind: 'text', name: 'title', label: 'Title (H1)' }, { kind: 'textarea', name: 'intro', label: 'Intro / body text', rows: 6 }] }]} />
          </fieldset>
          {canWrite && (
            <div className="mt-4 flex items-center gap-3">
              <Btn type="submit">
                <Save /> Save
              </Btn>
              {msg && <span className="text-sm text-steel">{msg}</span>}
            </div>
          )}
        </Card>
      </form>
    </FormProvider>
  );
}

function SectionEditor({ s, canWrite, onDone }: { s: PageRow['sections'][number]; canWrite: boolean; onDone: (m: { kind: 'error' | 'success'; text: string }) => void }) {
  const base = (s.draftContent ?? s.content) as { en: unknown; ar: unknown };
  const [en, setEn] = useState(JSON.stringify(base.en, null, 2));
  const [ar, setAr] = useState(JSON.stringify(base.ar, null, 2));
  const [visible, setVisible] = useState(s.isVisible);
  const saveDraft = async () => {
    try {
      await api('PUT', `/sections/${s.id}`, { type: s.type, order: s.order, isVisible: visible, draftContent: { en: JSON.parse(en) as unknown, ar: JSON.parse(ar) as unknown } });
      onDone({ kind: 'success', text: `Draft saved for "${s.type}". Publish to make it live.` });
    } catch (e) {
      onDone({ kind: 'error', text: e instanceof SyntaxError ? 'One of the language panels is not valid JSON.' : errorText(e) });
    }
  };
  const publish = async () => {
    await saveDraft();
    try {
      await api('POST', `/sections/${s.id}/publish`);
      onDone({ kind: 'success', text: `"${s.type}" is live.` });
    } catch (e) {
      onDone({ kind: 'error', text: errorText(e) });
    }
  };
  const ta = (v: string, set: (x: string) => void) => <Textarea rows={12} dir="auto" spellCheck={false} className="font-mono text-xs" value={v} onChange={(e) => set(e.target.value)} disabled={!canWrite} />;
  return (
    <Card
      title={`Section: ${s.type}`}
      actions={
        <span className="flex items-center gap-2">
          <Badge tone={s.status === 'DRAFT' ? 'warn' : 'good'}>{s.status === 'DRAFT' ? 'Draft pending' : 'Published'}</Badge>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} disabled={!canWrite} className="accent-navy" /> Visible
          </label>
        </span>
      }
    >
      <LangTabs en={ta(en, setEn)} ar={ta(ar, setAr)} />
      {canWrite && (
        <div className="mt-4 flex gap-2">
          <Btn variant="secondary" onClick={() => void saveDraft()}>
            <Save /> Save draft
          </Btn>
          <Btn onClick={() => void publish()}>
            <Send /> Publish
          </Btn>
        </div>
      )}
    </Card>
  );
}

/* ================================================================== Media library */

interface MediaRow {
  id: string;
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
  alt: { en: string; ar: string };
  variants: { webp?: { w: number; url: string }[]; avif?: { w: number; url: string }[]; original?: string };
  source: string;
  credit: { author: string; licence: string } | null;
}

export function MediaLibrary({ role }: { role: RoleKey }) {
  const qc = useQueryClient();
  const canWrite = hasPermission(role, 'media:write');
  const { data } = useQuery({ queryKey: ['admin-media', 'library'], queryFn: () => apiPaged<MediaRow>('/media?pageSize=200') });
  const [sel, setSel] = useState<MediaRow | null>(null);
  return (
    <>
      <PageTitle title="Media library" sub="Uploads are compressed to WebP + AVIF in several sizes. Alt text is required in both languages." />
      {canWrite && <MediaUploader />}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {(data?.items ?? []).map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setSel(m)} className={`block w-full overflow-hidden rounded-xl ring-2 ${sel?.id === m.id ? 'ring-blue' : 'ring-transparent'}`}>
                <img src={m.variants.webp?.[0]?.url ?? m.variants.original} alt={m.alt.en} className="aspect-square w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
          {!data?.items.length && <li className="col-span-full text-steel">No images yet. Upload above, or run npm run photos:import for licensed stand-ins.</li>}
        </ul>
        {sel && <MediaDetail key={sel.id} m={sel} canWrite={canWrite} onChanged={() => (setSel(null), void qc.invalidateQueries({ queryKey: ['admin-media'] }))} />}
      </div>
    </>
  );
}

function MediaDetail({ m, canWrite, onChanged }: { m: MediaRow; canWrite: boolean; onChanged: () => void }) {
  const [alt, setAlt] = useState(m.alt);
  const [msg, setMsg] = useState('');
  const url = m.variants.original ?? '';
  return (
    <Card title="Image details">
      <img src={m.variants.webp?.[1]?.url ?? url} alt={alt.en} className="w-full rounded-lg" />
      <p className="mt-2 text-xs text-steel">
        {m.filename} · {m.width}×{m.height} · {m.source}
        {m.credit && ` · ${m.credit.author} (${m.credit.licence})`}
      </p>
      <div className="mt-4 space-y-3">
        <Field label="Alt text (English)">
          <Input value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} disabled={!canWrite} />
        </Field>
        <Field label="Alt text (Arabic)">
          <Input dir="rtl" value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} disabled={!canWrite} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" onClick={() => void navigator.clipboard.writeText(location.origin + url).then(() => setMsg('URL copied'))}>
            <Copy /> Copy URL
          </Btn>
          {canWrite && (
            <>
              <Btn onClick={() => void api('PUT', `/media/${m.id}`, { alt }).then(() => setMsg('Saved'), (e: unknown) => setMsg(errorText(e)))}>
                <Save /> Save
              </Btn>
              <Btn variant="danger" onClick={() => window.confirm('Delete this image everywhere it is used?') && void api('DELETE', `/media/${m.id}`).then(onChanged, (e: unknown) => setMsg(errorText(e)))}>
                <Trash2 />
              </Btn>
            </>
          )}
        </div>
        {msg && <p className="text-sm text-steel">{msg}</p>}
      </div>
    </Card>
  );
}

/* ================================================================== Inquiries */

interface InquiryRow {
  id: string;
  type: string;
  status: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  serviceType: string;
  equipmentSlug: string;
  message: string;
  payload: Record<string, unknown>;
  notes: { at: string; by: string; text: string }[];
  attachmentId: string | null;
  locale: string;
  createdAt: string;
}

export function Inquiries() {
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const qs = new URLSearchParams({ pageSize: '200', ...(status ? { status } : {}), ...(type ? { type } : {}), ...(q ? { q } : {}) }).toString();
  const { data } = useQuery({ queryKey: ['inquiries', qs], queryFn: () => apiPaged<InquiryRow>(`/inquiries?${qs}`) });
  return (
    <>
      <PageTitle
        title="Inquiries"
        sub={data ? `${data.meta.total} matching` : undefined}
        actions={
          <Btn variant="secondary" onClick={() => void download(`/inquiries/export.csv?${qs}`, 'inquiries.csv')}>
            <FileDown /> Export CSV
          </Btn>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" aria-label="Status">
          <option value="">All statuses</option>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-40" aria-label="Type">
          <option value="">All types</option>
          {INQUIRY_TYPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Input type="search" placeholder="Name, email, phone, company" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" aria-label="Search" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <DataTable
          data={data?.items ?? []}
          onRowClick={(r) => setSel(r.id)}
          empty="No inquiries match."
          columns={[
            { id: 'date', header: 'Received', accessorFn: (r) => new Date(r.createdAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' }) },
            { id: 'name', header: 'Name', accessorFn: (r) => `${r.name}${r.company ? ` · ${r.company}` : ''}` },
            { id: 'type', header: 'Type', cell: (c) => <Badge tone="info">{c.row.original.type}</Badge> },
            { id: 'status', header: 'Status', cell: (c) => <Badge tone={c.row.original.status === 'NEW' ? 'warn' : c.row.original.status === 'WON' ? 'good' : c.row.original.status === 'LOST' ? 'bad' : 'neutral'}>{c.row.original.status}</Badge> },
          ]}
        />
        {sel && <InquiryDetail id={sel} />}
      </div>
    </>
  );
}

function InquiryDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: i } = useQuery({ queryKey: ['inquiry', id], queryFn: () => api<InquiryRow>('GET', `/inquiries/${id}`) });
  const [note, setNote] = useState('');
  const patch = useMutation({
    mutationFn: (body: { status?: string; note?: string }) => api('PATCH', `/inquiries/${id}`, body),
    onSuccess: async () => {
      setNote('');
      await qc.invalidateQueries({ queryKey: ['inquiry', id] });
      await qc.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
  if (!i) return <Card>Loading…</Card>;
  const rows: [string, string][] = [
    ['Phone', i.phone],
    ['Email', i.email],
    ['Service', i.serviceType],
    ['Equipment', i.equipmentSlug],
    ['Language', i.locale],
    ...Object.entries(i.payload ?? {}).map(([k, v]) => [k, String(v)] as [string, string]),
  ];
  return (
    <Card title={i.name}>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-steel">{k}</dt>
              <dd dir="auto" className="break-words text-navy">
                {k === 'Phone' ? <a href={`tel:${v}`}>{v}</a> : k === 'Email' ? <a href={`mailto:${v}`}>{v}</a> : v}
              </dd>
            </div>
          ))}
      </dl>
      {i.message && (
        <p dir="auto" className="mt-4 whitespace-pre-line rounded-lg bg-offwhite p-3 text-sm">
          {i.message}
        </p>
      )}
      {i.attachmentId && (
        <Btn variant="secondary" className="mt-3" onClick={() => void download(`/inquiries/${i.id}/attachment`, i.attachmentId!)}>
          <Download /> Attachment
        </Btn>
      )}
      <Field label="Status" className="mt-4">
        <Select value={i.status} onChange={(e) => patch.mutate({ status: e.target.value })}>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <h3 className="mt-4 text-sm font-semibold text-navy">Notes</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {i.notes.map((n) => (
          <li key={n.at} className="rounded-lg bg-offwhite p-2">
            <span className="text-xs text-steel">
              {n.by} · {new Date(n.at).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}
            </span>
            <p>{n.text}</p>
          </li>
        ))}
      </ul>
      <Textarea rows={2} className="mt-2" placeholder="Add a note (e.g. called, sent quote AED 4,500)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Btn className="mt-2" disabled={!note.trim()} onClick={() => patch.mutate({ note })}>
        Add note
      </Btn>
    </Card>
  );
}

/* ================================================================== Users + audit log */

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export function Users() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['users'], queryFn: () => api<UserRow[]>('GET', '/users') });
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const methods = useForm({ resolver: zodResolver(adminUserCreateSchema), defaultValues: { email: '', name: '', role: 'EDITOR' as RoleKey, password: '', isActive: true } });
  const create = useMutation({
    mutationFn: (v: unknown) => api('POST', '/users', v),
    onSuccess: async () => {
      setMsg({ kind: 'success', text: 'User created. Share the password securely (not by email).' });
      methods.reset();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => setMsg({ kind: 'error', text: errorText(e) }),
  });
  const update = async (u: UserRow, body: Record<string, unknown>) => {
    try {
      await api('PUT', `/users/${u.id}`, body);
      await qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e) {
      setMsg({ kind: 'error', text: errorText(e) });
    }
  };
  return (
    <>
      <PageTitle title="Users & roles" sub="Super Admin: everything. Editor: content, media, inquiries. SEO Manager: SEO, redirects, robots; reads content." />
      {msg && (
        <div className="mb-4">
          <Notice kind={msg.kind}>{msg.text}</Notice>
        </div>
      )}
      <DataTable
        data={data}
        columns={[
          { id: 'name', header: 'Name', accessorFn: (r) => r.name },
          { id: 'email', header: 'Email', accessorFn: (r) => r.email },
          {
            id: 'role',
            header: 'Role',
            cell: (c) => (
              <Select value={c.row.original.role} onChange={(e) => void update(c.row.original, { role: e.target.value })} className="w-40" aria-label="Role">
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            ),
          },
          { id: 'active', header: 'Active', cell: (c) => <input type="checkbox" className="accent-navy" checked={c.row.original.isActive} onChange={(e) => void update(c.row.original, { isActive: e.target.checked })} aria-label="Active" /> },
          { id: 'last', header: 'Last login', accessorFn: (r) => (r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' }) : '–') },
          {
            id: 'pw',
            header: '',
            cell: (c) => (
              <Btn
                variant="ghost"
                onClick={() => {
                  const pw = window.prompt('New password (12+ characters)');
                  if (pw) void update(c.row.original, { password: pw });
                }}
              >
                Reset password
              </Btn>
            ),
          },
        ]}
      />
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((v) => create.mutate(v))} className="mt-8">
          <Card title="Add user">
            <FormFields
              fields={[
                { kind: 'text', name: 'name', label: 'Name' },
                { kind: 'text', name: 'email', label: 'Email', dir: 'ltr' },
                { kind: 'select', name: 'role', label: 'Role', options: ROLES.map((r) => ({ value: r, label: r })) },
                { kind: 'text', name: 'password', label: 'Temporary password (12+ characters)', dir: 'ltr' },
              ]}
            />
            <Btn type="submit" className="mt-4">
              Create user
            </Btn>
          </Card>
        </form>
      </FormProvider>
    </>
  );
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  ip: string;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export function AuditLog() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ queryKey: ['audit', page], queryFn: () => apiPaged<AuditRow>(`/audit-log?page=${page}`) });
  return (
    <>
      <PageTitle title="Audit log" sub="Every change made in the admin, newest first." />
      <DataTable
        data={data?.items ?? []}
        columns={[
          { id: 'when', header: 'When', accessorFn: (r) => new Date(r.createdAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' }) },
          { id: 'who', header: 'User', accessorFn: (r) => r.user?.name ?? 'System' },
          { id: 'action', header: 'Action', accessorFn: (r) => r.action },
          { id: 'what', header: 'Item', accessorFn: (r) => `${r.entityType} ${r.entityId}` },
          { id: 'ip', header: 'IP', accessorFn: (r) => r.ip },
        ]}
      />
      <div className="mt-4 flex items-center gap-2">
        <Btn variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Newer
        </Btn>
        <span className="text-sm text-steel">
          Page {page} / {data?.meta.totalPages ?? 1}
        </span>
        <Btn variant="secondary" disabled={page >= (data?.meta.totalPages ?? 1)} onClick={() => setPage(page + 1)}>
          Older
        </Btn>
      </div>
    </>
  );
}
