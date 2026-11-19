import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { hasPermission, type RoleKey } from '@app/shared';
import { api, apiPaged, errorText } from '../api';
import { FormFields } from '../fields';
import { moduleByKey, type ModuleDef, type Row } from '../modules';
import { Badge, Btn, Card, DataTable, Input, Notice, PageTitle } from '../ui';
import { SeoPanel } from './seo';

export function EntityList({ role }: { role: RoleKey }) {
  const { module = '' } = useParams();
  const def = moduleByKey(module);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', module, q], queryFn: () => apiPaged<Row>(`${def!.api}?pageSize=200${q ? `&q=${encodeURIComponent(q)}` : ''}`), enabled: !!def });
  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () =>
      (def?.columns ?? []).map((c) => ({
        id: c.label,
        header: c.label,
        accessorFn: (r: Row) => c.get(r),
        cell: (ctx) => {
          const v = ctx.getValue();
          return typeof v === 'boolean' ? <Badge tone={v ? 'good' : 'neutral'}>{v ? 'Yes' : 'No'}</Badge> : v === 'DRAFT' ? <Badge tone="warn">Draft</Badge> : v === 'PUBLISHED' ? <Badge tone="good">Published</Badge> : String(v ?? '');
        },
      })),
    [def],
  );
  if (!def) return <Notice kind="error">Unknown module.</Notice>;
  const canWrite = hasPermission(role, def.write);
  return (
    <>
      <PageTitle
        title={def.title}
        sub={data ? `${data.meta.total} items` : undefined}
        actions={
          canWrite && (
            <Btn onClick={() => nav(`/admin/m/${def.key}/new`)}>
              <Plus /> New
            </Btn>
          )
        }
      />
      <div className="mb-4 max-w-sm">
        <Input type="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </div>
      {error && <Notice kind="error">{errorText(error)}</Notice>}
      {isLoading ? <p className="text-steel">Loading…</p> : <DataTable data={data?.items ?? []} columns={columns} onRowClick={(r) => nav(`/admin/m/${def.key}/${r.id}`)} />}
    </>
  );
}

export function EntityEdit({ role }: { role: RoleKey }) {
  const { module = '', id = 'new' } = useParams();
  const def = moduleByKey(module);
  const isNew = id === 'new';
  const { data: item, isLoading } = useQuery({ queryKey: ['admin', module, 'item', id], queryFn: () => api<Row>('GET', `${def!.api}/${id}`), enabled: !!def && !isNew });
  if (!def) return <Notice kind="error">Unknown module.</Notice>;
  if (!isNew && (isLoading || !item)) return <p className="text-steel">Loading…</p>;
  return <EntityForm key={id} def={def} item={item ?? null} role={role} />;
}

function EntityForm({ def, item, role }: { def: ModuleDef; item: Row | null; role: RoleKey }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const canWrite = hasPermission(role, def.write);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const methods = useForm({ resolver: zodResolver(def.schema), defaultValues: item ? { ...def.defaults, ...(def.fromItem?.(item) ?? item) } : def.defaults });

  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) => (item ? api<Row>('PUT', `${def.api}/${item.id}`, values) : api<Row>('POST', def.api, values)),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ['admin', def.key] });
      setMsg({ kind: 'success', text: 'Saved. Changes are live on the site.' });
      if (!item) nav(`/admin/m/${def.key}/${saved.id}`, { replace: true });
    },
    onError: (e) => setMsg({ kind: 'error', text: errorText(e) }),
  });
  const remove = useMutation({
    mutationFn: () => api('DELETE', `${def.api}/${item!.id}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', def.key] });
      nav(`/admin/m/${def.key}`);
    },
    onError: (e) => setMsg({ kind: 'error', text: errorText(e) }),
  });

  const title = item ? String((item.content as { en?: { title?: string; name?: string; q?: string } } | undefined)?.en?.title ?? (item.content as { en?: { name?: string } } | undefined)?.en?.name ?? item.name ?? item.from ?? item.slug ?? 'Edit') : `New ${def.title.toLowerCase()}`;

  return (
    <>
      <Link to={`/admin/m/${def.key}`} className="mb-3 inline-flex items-center gap-1 text-sm text-steel hover:text-navy">
        <ArrowLeft className="size-4" /> {def.title}
      </Link>
      <PageTitle
        title={title}
        actions={
          <>
            {item && def.publicPath && (
              <a href={`/en${def.publicPath(item)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-mist px-4 text-sm font-semibold text-navy hover:bg-offwhite">
                <ExternalLink className="size-4" /> View
              </a>
            )}
            {item && canWrite && (
              <Btn variant="danger" onClick={() => window.confirm('Delete this item? This cannot be undone.') && remove.mutate()}>
                <Trash2 /> Delete
              </Btn>
            )}
          </>
        }
      />
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((v) => save.mutate(v as Record<string, unknown>))} className="space-y-6">
          <Card>
            <fieldset disabled={!canWrite}>
              <FormFields fields={def.fields} />
            </fieldset>
          </Card>
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          {Object.keys(methods.formState.errors).length > 0 && <Notice kind="error">Some fields need attention (check both the English and Arabic tabs).</Notice>}
          {canWrite && (
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-mist bg-offwhite/90 py-3 backdrop-blur">
              <Btn type="submit" disabled={save.isPending}>
                <Save /> {save.isPending ? 'Saving…' : 'Save'}
              </Btn>
            </div>
          )}
        </form>
      </FormProvider>
      {item && def.seoType && (
        <div className="mt-10">
          <SeoPanel type={def.seoType} id={item.id} role={role} />
        </div>
      )}
    </>
  );
}
