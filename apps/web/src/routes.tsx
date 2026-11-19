import type { QueryClient } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';
import { isLocale } from '@app/shared';
import type { Queries } from './data/queries';
import { LangLayout } from './pages/LangLayout';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { RouteError } from './pages/RouteError';

/** A 404 thrown from a loader becomes the route's errorElement and an HTTP 404 from SSR. */
export const notFoundResponse = () => new Response('Not found', { status: 404, statusText: 'Not Found' });

const langOrThrow = (params: LoaderFunctionArgs['params']) => {
  if (!isLocale(params.lang)) throw notFoundResponse();
  return params.lang;
};

const Styleguide = import.meta.env.DEV ? lazy(() => import('./dev/Styleguide')) : null;

/**
 * Route tree shared by SSR (createStaticHandler) and the browser (createBrowserRouter).
 * Loaders only warm the TanStack Query cache and return null; components read from the cache,
 * so the server's dehydrated cache makes hydration instant and identical.
 */
export function createRoutes(qc: QueryClient, q: Queries): RouteObject[] {
  const routes: RouteObject[] = [
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
          element: <Home />,
          loader: async ({ params }) => {
            const lang = langOrThrow(params);
            await Promise.all([qc.ensureQueryData(q.page('home', lang)), qc.ensureQueryData(q.services(lang))]);
            return null;
          },
        },
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

  // Anything without a valid language prefix (that Express did not redirect) is a 404.
  routes.push({ path: '*', id: 'not-found-root', element: <NotFound />, handle: { notFound: true } });
  return routes;
}
