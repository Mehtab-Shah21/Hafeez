import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Controller, useFieldArray, useFormContext, type FieldValues } from 'react-hook-form';
import { api, apiPaged, errorText } from './api';
import { Btn, Field, Input, LangTabs, Notice, Select, Textarea } from './ui';

const RichText = lazy(() => import('./richtext'));

export type Option = { value: string; label: string };
export type FieldDef =
  | { kind: 'text' | 'textarea' | 'number' | 'slug' | 'datetime' | 'color'; name: string; label: string; hint?: string; dir?: 'ltr' | 'rtl'; rows?: number }
  | { kind: 'checkbox'; name: string; label: string; hint?: string }
  | { kind: 'select'; name: string; label: string; options: Option[] | (() => Promise<Option[]>); hint?: string; numeric?: boolean }
  | { kind: 'media'; name: string; label: string; hint?: string }
  | { kind: 'mediaList'; name: string; label: string; hint?: string }
  | { kind: 'lines'; name: string; label: string; hint?: string }
  | { kind: 'objects'; name: string; label: string; hint?: string; fields: { key: string; label: string; kind?: 'text' | 'textarea' | 'number' }[] }
  | { kind: 'richtext'; name: string; label: string }
  | { kind: 'json'; name: string; label: string; hint?: string; rows?: number }
  | { kind: 'localized'; base: string; fields: FieldDef[] };

interface MediaRow {
  id: string;
  filename: string;
  alt: { en?: string; ar?: string };
  variants: { webp?: { w: number; url: string }[]; original?: string };
}
const thumb = (m: MediaRow) => m.variants.webp?.[0]?.url ?? m.variants.original ?? '';

/** Read a nested error message by dotted path. */
function errAt(errors: FieldValues, path: string): string | undefined {
  const e = path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), errors) as { message?: string } | undefined;
  return e?.message;
}

export function FormFields({ fields, prefix = '' }: { fields: FieldDef[]; prefix?: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((f, i) => (
        <FieldRenderer key={f.kind === 'localized' ? `loc-${i}` : f.name} def={f} prefix={prefix} />
      ))}
    </div>
  );
}

function FieldRenderer({ def, prefix }: { def: FieldDef; prefix: string }) {
  const { register, control, formState } = useFormContext();
  if (def.kind === 'localized') {
    return (
      <div className="md:col-span-2">
        <LangTabs en={<FormFields fields={def.fields} prefix={`${def.base}.en.`} />} ar={<FormFields fields={def.fields} prefix={`${def.base}.ar.`} />} />
      </div>
    );
  }
  // An empty field name inside a localized group addresses the language value itself (e.g. "name.en").
  const name = def.name === '' ? prefix.slice(0, -1) : prefix + def.name;
  const error = errAt(formState.errors, name);
  const wide = ['textarea', 'lines', 'objects', 'richtext', 'json', 'mediaList'].includes(def.kind);
  const cls = wide ? 'md:col-span-2' : '';

  switch (def.kind) {
    case 'text':
    case 'slug':
    case 'datetime':
    case 'color':
      return (
        <Field label={def.label} hint={def.hint ?? (def.kind === 'slug' ? 'lowercase-words-with-hyphens' : undefined)} error={error} className={cls}>
          <Input type={def.kind === 'color' ? 'color' : def.kind === 'datetime' ? 'datetime-local' : 'text'} dir={def.dir ?? (def.kind === 'slug' ? 'ltr' : undefined)} {...register(name)} className={def.kind === 'color' ? 'h-10 w-24 p-1' : undefined} />
        </Field>
      );
    case 'number':
      return (
        <Field label={def.label} hint={def.hint} error={error} className={cls}>
          <Input type="number" step="any" dir="ltr" {...register(name, { valueAsNumber: true })} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={def.label} hint={def.hint} error={error} className={cls}>
          <Textarea rows={def.rows ?? 4} {...register(name)} />
        </Field>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-3 self-end py-2 text-sm font-medium text-navy">
          <input type="checkbox" className="size-4 accent-navy" {...register(name)} />
          {def.label}
        </label>
      );
    case 'select':
      return <SelectField def={def} name={name} error={error} />;
    case 'lines':
      return (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Field label={def.label} hint={def.hint ?? 'One item per line'} error={error} className={cls}>
              <Textarea rows={4} value={((field.value as string[] | undefined) ?? []).join('\n')} onChange={(e) => field.onChange(e.target.value.split('\n').map((s) => s.trimStart()).filter((s, i, a) => s || i < a.length - 1))} onBlur={() => field.onChange(((field.value as string[]) ?? []).map((s) => s.trim()).filter(Boolean))} />
            </Field>
          )}
        />
      );
    case 'objects':
      return <ObjectsField def={def} name={name} />;
    case 'media':
      return (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Field label={def.label} hint={def.hint} error={error} className={cls}>
              <MediaPicker value={field.value ? [field.value as string] : []} onChange={(ids) => field.onChange(ids[0] ?? null)} />
            </Field>
          )}
        />
      );
    case 'mediaList':
      return (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Field label={def.label} hint={def.hint ?? 'First image is the main photo'} error={error} className={cls}>
              <MediaPicker multiple value={(field.value as string[]) ?? []} onChange={field.onChange} />
            </Field>
          )}
        />
      );
    case 'richtext':
      return (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <div className={cls}>
              <span className="text-sm font-medium text-navy">{def.label}</span>
              <Suspense fallback={<div className="mt-2 h-64 animate-pulse rounded-lg bg-offwhite" />}>
                <RichText value={(field.value as string) ?? ''} onChange={field.onChange} />
              </Suspense>
            </div>
          )}
        />
      );
    case 'json':
      return (
        <Controller
          control={control}
          name={name}
          render={({ field, fieldState }) => <JsonField label={def.label} hint={def.hint} rows={def.rows} value={field.value} onChange={field.onChange} error={fieldState.error?.message ?? error} className={cls} />}
        />
      );
  }
}

function SelectField({ def, name, error }: { def: Extract<FieldDef, { kind: 'select' }>; name: string; error?: string }) {
  const { register } = useFormContext();
  const { data: opts = Array.isArray(def.options) ? def.options : [] } = useQuery({
    queryKey: ['admin-options', def.name],
    queryFn: () => (typeof def.options === 'function' ? def.options() : Promise.resolve(def.options)),
  });
  return (
    <Field label={def.label} hint={def.hint} error={error}>
      <Select {...register(name, def.numeric ? { valueAsNumber: true } : undefined)}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function ObjectsField({ def, name }: { def: Extract<FieldDef, { kind: 'objects' }>; name: string }) {
  const { control, register } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const empty = Object.fromEntries(def.fields.map((f) => [f.key, f.kind === 'number' ? 0 : '']));
  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-medium text-navy">{def.label}</legend>
      {def.hint && <p className="text-xs text-steel">{def.hint}</p>}
      <ol className="mt-2 space-y-3">
        {fields.map((f, i) => (
          <li key={f.id} className="grid gap-3 rounded-xl border border-mist bg-offwhite/50 p-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-3 md:grid-cols-2">
              {def.fields.map((sf) => (
                <Field key={sf.key} label={sf.label} className={sf.kind === 'textarea' ? 'md:col-span-2' : ''}>
                  {sf.kind === 'textarea' ? <Textarea rows={2} {...register(`${name}.${i}.${sf.key}`)} /> : <Input type={sf.kind === 'number' ? 'number' : 'text'} {...register(`${name}.${i}.${sf.key}`, sf.kind === 'number' ? { valueAsNumber: true } : undefined)} />}
                </Field>
              ))}
            </div>
            <div className="flex gap-1 md:flex-col">
              <Btn variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                ↑
              </Btn>
              <Btn variant="ghost" aria-label="Remove" onClick={() => remove(i)}>
                <Trash2 />
              </Btn>
            </div>
          </li>
        ))}
      </ol>
      <Btn variant="secondary" className="mt-3" onClick={() => append(empty)}>
        <Plus /> Add
      </Btn>
    </fieldset>
  );
}

function JsonField({ label, hint, value, onChange, error, className, rows = 12 }: { label: string; hint?: string; value: unknown; onChange: (v: unknown) => void; error?: string; className?: string; rows?: number }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [parseError, setParseError] = useState('');
  return (
    <Field label={label} hint={hint ?? 'JSON. Keep the same keys; change the text values.'} error={parseError || error} className={className}>
      <Textarea
        rows={rows}
        dir="auto"
        spellCheck={false}
        className="font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setParseError('');
          } catch {
            setParseError('Not valid JSON yet');
          }
        }}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ Media picker + uploader */

export function MediaUploader({ onUploaded }: { onUploaded?: (ids: string[]) => void }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<FileList | null>(null);
  const [alt, setAlt] = useState({ en: '', ar: '' });
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!files?.length) return setMsg({ kind: 'error', text: 'Choose at least one image.' });
    if (!alt.en.trim() || !alt.ar.trim()) return setMsg({ kind: 'error', text: 'Alt text is required in English and Arabic (it describes the image for screen readers and Google).' });
    const fd = new FormData();
    [...files].forEach((f) => fd.append('files', f));
    fd.set('alt_en', alt.en);
    fd.set('alt_ar', alt.ar);
    setBusy(true);
    try {
      const created = await api<{ id: string }[]>('POST', '/media', fd);
      setMsg({ kind: 'success', text: `${created.length} image(s) uploaded and optimised (WebP + AVIF).` });
      setFiles(null);
      setAlt({ en: '', ar: '' });
      await qc.invalidateQueries({ queryKey: ['admin-media'] });
      onUploaded?.(created.map((c) => c.id));
    } catch (e) {
      setMsg({ kind: 'error', text: errorText(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-navy/20 bg-offwhite/50 p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <Field label="Images (JPG, PNG, WebP, AVIF)">
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => setFiles(e.target.files)} className="text-sm" />
      </Field>
      <Field label="Alt text (English) *">
        <Input value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} placeholder="e.g. 50 t mobile crane lifting steel" />
      </Field>
      <Field label="Alt text (Arabic) *">
        <Input dir="rtl" value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} placeholder="مثال: رافعة متحركة ترفع الحديد" />
      </Field>
      <Btn onClick={() => void submit()} disabled={busy}>
        <ImagePlus /> {busy ? 'Uploading…' : 'Upload'}
      </Btn>
      {msg && (
        <div className="md:col-span-4">
          <Notice kind={msg.kind}>{msg.text}</Notice>
        </div>
      )}
    </div>
  );
}

export function MediaPicker({ value, onChange, multiple = false }: { value: string[]; onChange: (ids: string[]) => void; multiple?: boolean }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['admin-media', 'picker'], queryFn: () => apiPaged<MediaRow>('/media?pageSize=200') });
  const byId = new Map((data?.items ?? []).map((m) => [m.id, m]));
  const toggle = (id: string) => {
    if (!multiple) {
      onChange([id]);
      setOpen(false);
      return;
    }
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((id) => {
          const m = byId.get(id);
          return (
            <span key={id} className="relative">
              {m ? <img src={thumb(m)} alt={m.alt.en ?? ''} className="size-20 rounded-lg object-cover" /> : <span className="grid size-20 place-items-center rounded-lg bg-offwhite text-xs text-steel">…</span>}
              <button type="button" aria-label="Remove image" onClick={() => onChange(value.filter((x) => x !== id))} className="absolute -end-2 -top-2 grid size-6 place-items-center rounded-full bg-navy text-white">
                <X className="size-3" />
              </button>
            </span>
          );
        })}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button type="button" className="grid size-20 place-items-center rounded-lg border-2 border-dashed border-mist text-steel hover:border-navy hover:text-navy" aria-label="Choose image">
              <ImagePlus className="size-6" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50" />
            <Dialog.Content className="fixed inset-4 z-50 overflow-y-auto rounded-2xl bg-white p-6 md:inset-16">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-navy">Media library</Dialog.Title>
                <Dialog.Close asChild>
                  <Btn variant="ghost" aria-label="Close">
                    <X />
                  </Btn>
                </Dialog.Close>
              </div>
              <Dialog.Description className="text-sm text-steel">Select {multiple ? 'images' : 'an image'}, or upload new ones.</Dialog.Description>
              <div className="mt-4">
                <MediaUploader onUploaded={(ids) => (multiple ? onChange([...value, ...ids]) : onChange(ids.slice(0, 1)))} />
              </div>
              <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
                {(data?.items ?? []).map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => toggle(m.id)} className={`block overflow-hidden rounded-lg ring-2 ${value.includes(m.id) ? 'ring-blue' : 'ring-transparent'}`}>
                      <img src={thumb(m)} alt={m.alt.en ?? ''} className="aspect-square w-full object-cover" loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
