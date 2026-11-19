import { hydrate, QueryClient, QueryClientProvider, type DehydratedState } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { createBrowserRouter, RouterProvider, UNSAFE_ErrorResponseImpl as ErrorResponseImpl } from 'react-router-dom';
import { QueriesProvider } from './data/context';
import { createQueries } from './data/queries';
import { httpDataSource } from './lib/api';
import { createRoutes } from './routes';
import './styles/globals.css';

interface SsrState {
  rq: DehydratedState;
  router: {
    loaderData: Record<string, unknown>;
    actionData: Record<string, unknown> | null;
    errors: Record<string, { __type: string; status?: number; statusText?: string; data?: unknown; internal?: boolean; message?: string }> | null;
  };
}

/** State is in a non-executable JSON script tag, so the CSP needs no inline-script allowance. */
function readState(): SsrState | null {
  const el = document.getElementById('__STATE__');
  if (!el?.textContent) return null;
  return JSON.parse(el.textContent) as SsrState;
}

function reviveErrors(errors: SsrState['router']['errors']) {
  if (!errors) return null;
  const out: Record<string, unknown> = {};
  for (const [id, e] of Object.entries(errors)) {
    out[id] =
      e.__type === 'RouteErrorResponse'
        ? new ErrorResponseImpl(e.status ?? 500, e.statusText, e.data, e.internal === true)
        : new Error(e.message);
  }
  return out;
}

const state = readState();
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } });
if (state) hydrate(queryClient, state.rq);

const queries = createQueries(httpDataSource);
const router = createBrowserRouter(createRoutes(queryClient, queries), {
  ...(state
    ? {
        hydrationData: {
          loaderData: state.router.loaderData,
          actionData: state.router.actionData,
          errors: reviveErrors(state.router.errors),
        },
      }
    : {}),
});

const root = document.getElementById('root');
if (root) {
  hydrateRoot(
    root,
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <QueriesProvider queries={queries}>
            <RouterProvider router={router} />
          </QueriesProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>,
  );
}
