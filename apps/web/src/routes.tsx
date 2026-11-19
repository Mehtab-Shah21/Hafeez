import type { QueryClient } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import { isLocale, type Locale } from '@app/shared';
import type { Queries } from './data/queries';
import { parseEquipmentQuery } from './pages/equipmentQuery';
import { LangLayout } from './pages/LangLayout';
import { NotFound } from './pages/NotFound';
import { RouteError } from './pages/RouteError';
import { SERVICE_EQUIPMENT } from './pages/serviceEquipment';

/** Route-level code splitting: each page is its own chunk (resolved before hydration in entry-client). */
const lazyPage = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) => () => load().then((m) => ({ Component: m[name] }));

/** A 404 thrown from a loader becomes the route's errorElement and an HTTP 404 from SSR. */
export const notFoundResponse = () => new Response('Not found', { status: 404, statusText: 'Not Found' });

const langOrThrow = (params: LoaderFunctionArgs['params']): Locale => {
  if (!isLocale(params.lang)) throw notFoundResponse();
  return params.lang;
};
const orNotFound = <T,>(v: T | null): T => {
  if (v === null) throw notFoundResponse();
  return v;
};

const Styleguide = import.meta.env.DEV ? lazy(() => import('./dev/Styleguide')) : null;
// Admin is a separate lazy chunk, never referenced by public route code paths.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/**
 * Route tree shared by SSR (createStaticHandler) and the browser (createBrowserRouter).
 * Loaders only warm the TanStack Query cache (in parallel) and return null; components read
 * from the cache, so SSR HTML and hydration use identical data.
 */
export function createRoutes(qc: QueryClient, q: Queries): RouteObject[] {
  const page = (key: string) => ({ params }: LoaderFunctionArgs) => {
    const lang = langOrThrow(params);
    return qc.ensureQueryData(q.page(key, lang));
  };
  const all =
    (...fns: ((args: LoaderFunctionArgs) => Promise<unknown>)[]) =>
    async (args: LoaderFunctionArgs) => {
      await Promise.all(fns.map((f) => f(args)));
      return null;
    };
  // Query option objects differ only in their data type; the cache call is the same for all of them.
  const ensure =
    (make: (lang: Locale, args: LoaderFunctionArgs) => unknown) =>
    (args: LoaderFunctionArgs): Promise<unknown> =>
      qc.ensureQueryData(make(langOrThrow(args.params), args) as never);
  const ensureFound =
    <T,>(make: (lang: Locale, slug: string) => { queryKey: readonly unknown[]; queryFn?: unknown }) =>
    async ({ params }: LoaderFunctionArgs) => {
      const lang = langOrThrow(params);
      orNotFound((await qc.ensureQueryData(make(lang, params.slug ?? '') as never)) as T | null);
    };

  const routes: RouteObject[] = [
    {
      path: '/admin/*',
      element: (
        <Suspense fallback={null}>
          <AdminApp />
        </Suspense>
      ),
    },
    {
      id: 'lang',
      path: '/:lang',
      element: <LangLayout />,
      errorElement: <RouteError />,
      loader: async ({ params }) => {
        const lang = langOrThrow(params);
        await qc.ensureQueryData(q.settings(lang));
        return null;
      },
      children: [
        {
          index: true,
          id: 'home',
          lazy: lazyPage(() => import('./pages/Home'), 'Home'),
          loader: all(
            page('home'),
            ensure((l) => q.services(l)),
            ensure((l) => q.equipment(l, { featured: true, pageSize: 6 })),
            ensure((l) => q.clients(l)),
            ensure((l) => q.testimonials(l)),
            ensure((l) => q.projects(l)),
            ensure((l) => q.faqs(l, 'general')),
          ),
        },
        { path: 'about', lazy: lazyPage(() => import('./pages/About'), 'About'), loader: all(page('about'), page('home'), ensure((l) => q.team(l))) },
        { path: 'services', lazy: lazyPage(() => import('./pages/Services'), 'ServicesIndex'), loader: all(page('services'), ensure((l) => q.services(l))) },
        {
          path: 'services/:slug',
          lazy: lazyPage(() => import('./pages/Services'), 'ServiceDetail'),
          loader: all(
            ensureFound((l, s) => q.service(s, l)),
            ensure((l) => q.services(l)),
            ensure((l, a) => {
              const rel = SERVICE_EQUIPMENT[a.params.slug ?? ''];
              return q.equipment(l, rel ? { ...rel, pageSize: 3 } : { category: '__none__', pageSize: 1 });
            }),
          ),
        },
        {
          path: 'equipment',
          lazy: lazyPage(() => import('./pages/Equipment'), 'EquipmentCatalog'),
          loader: all(
            page('equipment'),
            ensure((l) => q.equipmentCategories(l)),
            ensure((l, a) => q.equipment(l, parseEquipmentQuery(new URL(a.request.url).searchParams))),
          ),
        },
        {
          path: 'equipment/:slug',
          lazy: lazyPage(() => import('./pages/Equipment'), 'EquipmentDetail'),
          loader: async (args) => {
            const lang = langOrThrow(args.params);
            const e = orNotFound(await qc.ensureQueryData(q.equipmentItem(args.params.slug ?? '', lang)));
            await qc.ensureQueryData(q.equipment(lang, { category: e.category.slug, pageSize: 4 }));
            return null;
          },
        },
        {
          path: 'logistics',
          lazy: lazyPage(() => import('./pages/Logistics'), 'Logistics'),
          loader: all(page('logistics'), ensure((l) => q.fleet(l)), ensure((l) => q.faqs(l, 'logistics')), ensure((l) => q.faqs(l, 'courier'))),
        },
        { path: 'contact', lazy: lazyPage(() => import('./pages/Contact'), 'Contact'), loader: all(page('contact'), ensure((l) => q.services(l))) },
        { path: 'projects', lazy: lazyPage(() => import('./pages/Content'), 'ProjectsIndex'), loader: all(page('projects'), ensure((l) => q.projects(l)), ensure((l) => q.clients(l))) },
        { path: 'projects/:slug', lazy: lazyPage(() => import('./pages/Content'), 'ProjectDetail'), loader: all(ensureFound((l, s) => q.project(s, l))) },
        { path: 'blog', lazy: lazyPage(() => import('./pages/Content'), 'BlogIndex'), loader: all(page('blog'), ensure((l) => q.blog(l, 1))) },
        { path: 'blog/:slug', lazy: lazyPage(() => import('./pages/Content'), 'BlogPost'), loader: all(ensureFound((l, s) => q.blogPost(s, l))) },
        { path: 'privacy', lazy: lazyPage(() => import('./pages/Content'), 'Privacy'), loader: all(page('privacy')) },
        { path: 'terms', lazy: lazyPage(() => import('./pages/Content'), 'Terms'), loader: all(page('terms')) },
        { path: 'credits', lazy: lazyPage(() => import('./pages/Content'), 'Credits'), loader: all(ensure((l) => q.credits(l))) },
        // Unknown paths inside a language get the localized 404 page (SSR sends status 404).
        { path: '*', id: 'not-found', element: <NotFound />, handle: { notFound: true } },
      ],
    },
  ];

  if (Styleguide) {
    routes.push({
      path: '/__styleguide',
      element: (
        <Suspense fallback={null}>
          <Styleguide />
        </Suspense>
      ),
    });
  }

  routes.push({ path: '*', id: 'not-found-root', element: <NotFound />, handle: { notFound: true } });
  return routes;
}
