import { hydrate, QueryClient, QueryClientProvider, type DehydratedState } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { createBrowserRouter, RouterProvider, UNSAFE_ErrorResponseImpl as ErrorResponseImpl } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { DEFAULT_LOCALE, isLocale } from '@app/shared';
import { QueriesProvider } from './data/context';
import { RequestProvider, type RequestFlags } from './data/request';
import { createI18n } from './lib/i18n';
import { createQueries } from './data/queries';
import { httpDataSource } from './lib/api';
import { createRoutes } from './routes';
import './styles/globals.css';

interface SsrState {
  rq: DehydratedState;
  flags: RequestFlags;
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
const seg = location.pathname.split('/')[1];
const i18n = createI18n(isLocale(seg) ? seg : DEFAULT_LOCALE);
const flags: RequestFlags = state?.flags ?? { showPreloader: false };
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
            <I18nextProvider i18n={i18n}>
              <RequestProvider flags={flags}>
                <RouterProvider router={router} />
              </RequestProvider>
            </I18nextProvider>
          </QueriesProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>,
  );
}
