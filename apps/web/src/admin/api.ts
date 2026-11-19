import type { ApiResponse, PageMeta } from '@app/shared';

/**
 * Admin API client. Cookies carry the session; writes send the CSRF token in `x-csrf-token`.
 * On a 401 it rotates the session once via /auth/refresh and retries, so editors are not logged
 * out mid-edit when the 15-minute access token expires.
 */
let csrf = '';

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function ensureCsrf(): Promise<string> {
  if (csrf) return csrf;
  const res = await fetch('/api/admin/auth/csrf', { credentials: 'same-origin' });
  const body = (await res.json()) as ApiResponse<{ token: string }>;
  if (body.ok) csrf = body.data.token;
  return csrf;
}
export const setCsrf = (t: string) => {
  csrf = t;
};

async function raw(method: string, path: string, body?: unknown, retry = true): Promise<Response> {
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET') headers['x-csrf-token'] = await ensureCsrf();
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    const r = await fetch('/api/admin/auth/refresh', { method: 'POST', headers: { 'x-csrf-token': await ensureCsrf() }, credentials: 'same-origin' });
    if (r.ok) return raw(method, path, body, false);
  }
  return res;
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await raw(method, path, body);
  const json = (await res.json().catch(() => ({ ok: false, error: { code: 'BAD_RESPONSE', message: res.statusText } }))) as ApiResponse<T>;
  if (!json.ok) throw new AdminApiError(res.status, json.error.message, json.error.details);
  return json.data;
}

export async function apiPaged<T>(path: string): Promise<{ items: T[]; meta: PageMeta }> {
  const res = await raw('GET', path);
  const json = (await res.json()) as ApiResponse<T[]>;
  if (!json.ok) throw new AdminApiError(res.status, json.error.message);
  return { items: json.data, meta: json.meta ?? { page: 1, pageSize: json.data.length, total: json.data.length, totalPages: 1 } };
}

/** Download a file (CSV export, attachments) with the session cookie. */
export async function download(path: string, filename: string) {
  const res = await raw('GET', path);
  if (!res.ok) throw new AdminApiError(res.status, 'Download failed');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Flatten Zod `flatten()` details into "field: message" lines for form banners. */
export function errorText(e: unknown): string {
  if (e instanceof AdminApiError) {
    const d = e.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] } | undefined;
    const fields = d?.fieldErrors ? Object.entries(d.fieldErrors).map(([k, v]) => `${k}: ${v.join(', ')}`) : [];
    return [e.message, ...(d?.formErrors ?? []), ...fields].join(' · ');
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}
