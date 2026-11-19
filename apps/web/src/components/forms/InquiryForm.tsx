import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { EMIRATES, inquiryCreateSchema, UAE_PHONE_REGEX, type ApiResponse, type InquiryType, type Locale, type ServiceDTO } from '@app/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Inquiry / quote / booking form. Validation reuses the shared Zod schema (same rules as the API),
 * with localized messages. Sends multipart when a file is attached. The honeypot field is visually
 * hidden and skipped by keyboard and screen readers.
 */
const formSchema = inquiryCreateSchema
  .omit({ booking: true, locale: true, type: true })
  .extend({
    pickup: z.string().max(200).optional(),
    pickupEmirate: z.string().optional(),
    dropoff: z.string().max(200).optional(),
    dropoffEmirate: z.string().optional(),
    cargoType: z.string().max(120).optional(),
    weightKg: z.string().optional(),
    date: z.string().optional(),
  });
type FormValues = z.input<typeof formSchema>;

interface Props {
  lang: Locale;
  type: InquiryType;
  services?: ServiceDTO[];
  defaultService?: string;
  defaultEquipment?: string;
  booking?: boolean;
  /** From settings.turnstileSiteKey; empty disables the widget. */
  turnstileSiteKey?: string;
}

const field = 'mt-2 h-12 w-full rounded-xl border border-mist bg-white px-4 text-ink placeholder:text-steel/70 focus:border-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 aria-[invalid=true]:border-red-600';

function Field({ id, label, error, hint, children, className }: { id: string; label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-steel">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function InquiryForm({ lang, type, services = [], defaultService = '', defaultEquipment = '', booking = false, turnstileSiteKey = '' }: Props) {
  const { t } = useTranslation();
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; ref?: string }>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const siteKey = turnstileSiteKey;
  // Turnstile widget (only when a site key is configured): the script auto-renders .cf-turnstile.
  useEffect(() => {
    if (!siteKey || document.querySelector('script[data-turnstile]')) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.dataset.turnstile = '1';
    document.head.appendChild(s);
  }, [siteKey]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { serviceType: defaultService, equipmentSlug: defaultEquipment, website: '' },
  });

  const msg = (e?: { type?: string; message?: string }, fieldName?: string) => {
    if (!e) return undefined;
    if (fieldName === 'email') return t('form.invalidEmail');
    if (fieldName === 'phone') return t('form.invalidPhone');
    if (e.type === 'too_small') return t('form.tooShort');
    return t('form.required');
  };

  const onSubmit = handleSubmit(async (v) => {
    const payload = {
      type,
      locale: lang,
      name: v.name,
      company: v.company ?? '',
      phone: v.phone,
      email: v.email,
      serviceType: v.serviceType ?? '',
      equipmentSlug: v.equipmentSlug ?? '',
      message: v.message ?? '',
      website: v.website ?? '',
      ...(siteKey ? { 'cf-turnstile-response': (formRef.current?.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]')?.value ?? '') } : {}),
      ...(booking
        ? {
            booking: {
              pickup: v.pickup,
              pickupEmirate: v.pickupEmirate || undefined,
              dropoff: v.dropoff,
              dropoffEmirate: v.dropoffEmirate || undefined,
              cargoType: v.cargoType,
              weightKg: v.weightKg ? Number(v.weightKg) : undefined,
              date: v.date,
            },
          }
        : {}),
    };
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        for (const [k, val] of Object.entries(payload)) fd.set(k, typeof val === 'object' ? JSON.stringify(val) : String(val));
        fd.set('file', file);
        res = await fetch('/api/public/inquiries', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/public/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const body = (await res.json()) as ApiResponse<{ reference?: string }>;
      if (!body.ok) throw new Error(body.error.message);
      setStatus({ kind: 'ok', ref: body.data.reference ?? '' });
      reset();
      setFile(null);
    } catch {
      setStatus({ kind: 'error' });
    }
  });

  if (status.kind === 'ok') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-3xl bg-white p-8 shadow-card">
        <CheckCircle2 className="size-7 shrink-0 text-green-600" aria-hidden="true" />
        <p className="text-lg text-navy">{t('form.success', { ref: status.ref })}</p>
      </div>
    );
  }

  const aria = (name: keyof FormValues) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id(name)}-error` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5 rounded-3xl bg-white p-6 shadow-card md:grid-cols-2 md:p-10">
      <Field id={id('name')} label={t('form.name')} error={msg(errors.name)}>
        <input id={id('name')} autoComplete="name" className={field} {...register('name')} {...aria('name')} />
      </Field>
      <Field id={id('company')} label={t('form.company')}>
        <input id={id('company')} autoComplete="organization" className={field} {...register('company')} />
      </Field>
      <Field id={id('phone')} label={t('form.phone')} hint={t('form.phoneHint')} error={msg(errors.phone, 'phone')}>
        <input
          id={id('phone')}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+971 50 000 0000"
          className={cn(field, 'text-start')}
          {...register('phone', { pattern: UAE_PHONE_REGEX })}
          {...aria('phone')}
        />
      </Field>
      <Field id={id('email')} label={t('form.email')} error={msg(errors.email, 'email')}>
        <input id={id('email')} type="email" dir="ltr" autoComplete="email" className={cn(field, 'text-start')} {...register('email')} {...aria('email')} />
      </Field>

      {services.length > 0 && (
        <Field id={id('service')} label={t('form.service')}>
          <select id={id('service')} className={field} {...register('serviceType')}>
            <option value="">{t('form.select')}</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
      )}
      {defaultEquipment && (
        <Field id={id('equipment')} label={t('form.equipment')}>
          <input id={id('equipment')} readOnly className={cn(field, 'bg-offwhite')} {...register('equipmentSlug')} />
        </Field>
      )}

      {booking && (
        <>
          <Field id={id('pickup')} label={t('form.pickup')}>
            <input id={id('pickup')} className={field} {...register('pickup')} />
          </Field>
          <Field id={id('pickupEmirate')} label={t('form.pickupEmirate')}>
            <select id={id('pickupEmirate')} className={field} {...register('pickupEmirate')}>
              <option value="">{t('form.select')}</option>
              {EMIRATES.map((e) => (
                <option key={e.key} value={e.key}>
                  {e[lang]}
                </option>
              ))}
            </select>
          </Field>
          <Field id={id('dropoff')} label={t('form.dropoff')}>
            <input id={id('dropoff')} className={field} {...register('dropoff')} />
          </Field>
          <Field id={id('dropoffEmirate')} label={t('form.dropoffEmirate')}>
            <select id={id('dropoffEmirate')} className={field} {...register('dropoffEmirate')}>
              <option value="">{t('form.select')}</option>
              {EMIRATES.map((e) => (
                <option key={e.key} value={e.key}>
                  {e[lang]}
                </option>
              ))}
            </select>
          </Field>
          <Field id={id('cargo')} label={t('form.cargo')}>
            <input id={id('cargo')} className={field} {...register('cargoType')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id={id('weight')} label={t('form.weight')}>
              <input id={id('weight')} type="number" min={1} inputMode="numeric" dir="ltr" className={field} {...register('weightKg')} />
            </Field>
            <Field id={id('date')} label={t('form.date')}>
              <input id={id('date')} type="date" dir="ltr" className={field} {...register('date')} />
            </Field>
          </div>
        </>
      )}

      <Field id={id('message')} label={t('form.message')} className="md:col-span-2">
        <textarea id={id('message')} rows={5} className={cn(field, 'h-auto py-3')} {...register('message')} />
      </Field>

      {!booking && (
        <Field id={id('file')} label={t('form.file')} hint={t('form.fileHint')} className="md:col-span-2">
          <input
            id={id('file')}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f && f.size <= 10 * 1024 * 1024 ? f : null);
            }}
            className="mt-2 block w-full text-sm text-steel file:me-4 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white"
          />
        </Field>
      )}

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      {siteKey && <div className="cf-turnstile md:col-span-2" data-sitekey={siteKey} data-language={lang} />}

      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> {t('form.sending')}
            </>
          ) : (
            t('form.send')
          )}
        </Button>
        {status.kind === 'error' && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {t('form.error')}
          </p>
        )}
      </div>
    </form>
  );
}
