import type { ApiResponse, Locale, Paged, PublicDataSource } from '@app/shared';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  const res = await fetch(`/api/public${path}?${qs.toString()}`, { headers: { Accept: 'application/json' } });
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok) throw new ApiError(res.status, body.error.message);
  return body.data;
}

/** Same as get(), but returns null on 404 so callers can render a not-found page. */
async function getOrNull<T>(path: string, params: Record<string, string | number | undefined>): Promise<T | null> {
  try {
    return await get<T>(path, params);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

async function getPaged<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<Paged<T>> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  const res = await fetch(`/api/public${path}?${qs.toString()}`, { headers: { Accept: 'application/json' } });
  const body = (await res.json()) as ApiResponse<T[]>;
  if (!body.ok) throw new ApiError(res.status, body.error.message);
  return { items: body.data, meta: body.meta ?? { page: 1, pageSize: body.data.length, total: body.data.length, totalPages: 1 } };
}

/** Browser implementation of the public read model (the server uses its service layer directly). */
export const httpDataSource: PublicDataSource = {
  settings: (lang: Locale) => get('/settings', { lang }),
  page: (key, lang) => getOrNull(`/pages/${encodeURIComponent(key)}`, { lang }),
  services: (lang) => get('/services', { lang }),
  service: (slug, lang) => getOrNull(`/services/${encodeURIComponent(slug)}`, { lang }),
  equipmentCategories: (lang) => get('/equipment-categories', { lang }),
  equipment: (lang, q = {}) => getPaged('/equipment', { lang, ...q }),
  equipmentItem: (slug, lang) => getOrNull(`/equipment/${encodeURIComponent(slug)}`, { lang }),
  fleet: (lang) => get('/fleet', { lang }),
  clients: (lang) => get('/clients', { lang }),
  testimonials: (lang) => get('/testimonials', { lang }),
  projects: (lang) => get('/projects', { lang }),
  project: (slug, lang) => getOrNull(`/projects/${encodeURIComponent(slug)}`, { lang }),
  blog: (lang, page = 1) => getPaged('/blog', { lang, page }),
  blogPost: (slug, lang) => getOrNull(`/blog/${encodeURIComponent(slug)}`, { lang }),
  faqs: (lang, group) => get('/faqs', { lang, group }),
};
