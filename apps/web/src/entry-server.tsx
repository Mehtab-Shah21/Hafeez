import { dehydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { isRouteErrorResponse } from 'react-router-dom';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom/server';
import { Writable } from 'node:stream';
import { dirFor, DEFAULT_LOCALE, isLocale, LOCALE_TAGS, type SsrRender, type SsrResult } from '@app/shared';
import { I18nextProvider } from 'react-i18next';
import { QueriesProvider } from './data/context';
import { RequestProvider } from './data/request';
import { createI18n } from './lib/i18n';
import { createQueries } from './data/queries';
import { createRoutes } from './routes';
import './styles/globals.css';

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

/** Route errors (e.g. thrown 404 Responses) are not JSON-safe; mirror React Router's own serialisation. */
function serializeErrors(errors: Record<string, unknown> | null) {
  if (!errors) return null;
  const out: Record<string, unknown> = {};
  for (const [id, err] of Object.entries(errors) as [string, unknown][]) {
    out[id] = isRouteErrorResponse(err)
      ? { __type: 'RouteErrorResponse', status: err.status, statusText: err.statusText, data: err.data, internal: (err as { internal?: boolean }).internal === true }
      : { __type: 'Error', message: err instanceof Error ? err.message : 'Unknown error' };
  }
  return out;
}

/**
 * Renders one public URL to HTML. Called by the Express SSR host with an in-process data source.
 * Waits for `onAllReady` so crawlers always receive complete HTML (title, H1, copy, JSON-LD).
 */
export const render: SsrRender = async ({ url, data, siteUrl, showPreloader }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false } } });
  const queries = createQueries(data);
  const routes = createRoutes(queryClient, queries);
  const handler = createStaticHandler(routes);

  const context = await handler.query(new Request(new URL(url, siteUrl)));
  if (context instanceof Response) {
    if (REDIRECT_CODES.has(context.status)) {
      return { type: 'redirect', status: context.status as 301 | 302 | 307 | 308, location: context.headers.get('Location') ?? '/' };
    }
    throw context;
  }

  const lastMatch = context.matches.at(-1);
  const isNotFound = (lastMatch?.route.handle as { notFound?: boolean } | undefined)?.notFound === true;
  const status = isNotFound ? 404 : context.statusCode;

  const rawLang = context.matches[0]?.params.lang;
  const lang = isLocale(rawLang) ? rawLang : DEFAULT_LOCALE;

  const router = createStaticRouter(handler.dataRoutes, context);
  const helmetContext: { helmet?: HelmetServerState } = {};
  const i18n = createI18n(lang);
  const flags = { showPreloader };

  const appHtml = await new Promise<string>((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk: Buffer, _enc, cb) {
        html += chunk.toString();
        cb();
      },
      final(cb) {
        resolve(html);
        cb();
      },
    });
    const stream = renderToPipeableStream(
      <StrictMode>
        <HelmetProvider context={helmetContext}>
          <QueryClientProvider client={queryClient}>
            <QueriesProvider queries={queries}>
              <I18nextProvider i18n={i18n}>
                <RequestProvider flags={flags}>
                  <StaticRouterProvider router={router} context={context} hydrate={false} />
                </RequestProvider>
              </I18nextProvider>
            </QueriesProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </StrictMode>,
      {
        onAllReady() {
          stream.pipe(sink);
        },
        onShellError: reject,
        onError(err) {
          // Logged by the host via the rejected promise on shell errors; boundary errors render the error page.
          if (!(err instanceof Error && err.message.includes('aborted'))) console.error(err);
        },
      },
    );
    setTimeout(() => stream.abort(), 10_000);
  });

  const h = helmetContext.helmet;
  const head = h
    ? [h.title.toString(), h.priority.toString(), h.meta.toString(), h.link.toString(), h.style.toString(), h.script.toString()].join('')
    : '';

  const result: SsrResult = {
    type: 'html',
    status,
    htmlAttrs: { lang: LOCALE_TAGS[lang], dir: dirFor(lang) },
    head,
    appHtml,
    state: {
      rq: dehydrate(queryClient),
      flags,
      router: { loaderData: context.loaderData, actionData: context.actionData, errors: serializeErrors(context.errors) },
    },
  };
  return result;
};
