import * as Tabs from '@radix-ui/react-tabs';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { ArrowDownUp } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Small shadcn-style kit for the admin (Radix + Tailwind), kept in one file. */

export const inputCls =
  'h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm text-ink placeholder:text-steel/60 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-offwhite';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(inputCls, className)} {...p} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(inputCls, 'h-auto min-h-24 py-2', className)} {...p} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(inputCls, className)} {...p} />
));
Select.displayName = 'Select';

export function Field({ label, hint, error, children, className, counter }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string; counter?: ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-navy">
        {label}
        {counter}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && !error && <span className="mt-1 block text-xs text-steel">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}

export function Btn({ children, variant = 'primary', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const v = {
    primary: 'bg-navy text-white hover:bg-navy-700',
    secondary: 'border border-mist bg-white text-navy hover:bg-offwhite',
    ghost: 'text-navy hover:bg-navy/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  return (
    <button type="button" className={cn('inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50 [&_svg]:size-4', v, className)} {...p}>
      {children}
    </button>
  );
}

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={cn('rounded-2xl border border-mist bg-white p-5', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-navy">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, actions, sub }: { title: string; actions?: ReactNode; sub?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">{title}</h1>
        {sub && <p className="mt-1 text-sm text-steel">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info' }) {
  const t = { neutral: 'bg-offwhite text-steel', good: 'bg-green-100 text-green-800', warn: 'bg-amber-100 text-amber-800', bad: 'bg-red-100 text-red-800', info: 'bg-blue/10 text-blue' }[tone];
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', t)}>{children}</span>;
}

export function Notice({ kind, children }: { kind: 'error' | 'success' | 'warn'; children: ReactNode }) {
  const k = { error: 'border-red-200 bg-red-50 text-red-800', success: 'border-green-200 bg-green-50 text-green-800', warn: 'border-amber-200 bg-amber-50 text-amber-900' }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm', k)}>
      {children}
    </div>
  );
}

/** EN / AR content tabs. Arabic panels are dir=rtl so editors type naturally. */
export function LangTabs({ en, ar }: { en: ReactNode; ar: ReactNode }) {
  return (
    <Tabs.Root defaultValue="en">
      <Tabs.List className="mb-4 inline-flex rounded-lg bg-offwhite p-1" aria-label="Language">
        {(['en', 'ar'] as const).map((l) => (
          <Tabs.Trigger key={l} value={l} className="rounded-md px-4 py-1.5 text-sm font-semibold text-steel data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm">
            {l === 'en' ? 'English' : 'العربية'}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content value="en" forceMount className="data-[state=inactive]:hidden">
        {en}
      </Tabs.Content>
      <Tabs.Content value="ar" forceMount dir="rtl" lang="ar" className="font-sans data-[state=inactive]:hidden">
        {ar}
      </Tabs.Content>
    </Tabs.Root>
  );
}

/** TanStack Table with click-to-sort headers. */
export function DataTable<T>({ data, columns, onRowClick, empty = 'Nothing here yet.' }: { data: T[]; columns: ColumnDef<T, unknown>[]; onRowClick?: (row: T) => void; empty?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  return (
    <div className="overflow-x-auto rounded-2xl border border-mist bg-white">
      <table className="w-full text-sm">
        <thead className="bg-offwhite text-start text-xs uppercase tracking-wide text-steel">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 text-start font-semibold">
                  {h.column.getCanSort() ? (
                    <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-navy">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <ArrowDownUp className="size-3" aria-hidden="true" />
                    </button>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-mist">
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-steel">
                {empty}
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row.original) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(onRowClick && 'cursor-pointer hover:bg-offwhite focus-visible:bg-offwhite')}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
