import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express, { type RequestHandler } from 'express';
import type { SsrRender, SsrResult } from '@app/shared';
import { env, isProd } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { publicService } from '../modules/public/public.service.js';
import { logNotFound } from '../middleware/redirects.js';

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../web');

/** State goes in a JSON script tag; escape characters that could end the tag or break JS parsers. */
const serializeState = (state: unknown) =>
  JSON.stringify(state).replace(/</g, '\\u003c').replaceAll(String.fromCharCode(0x2028), '\\u2028').replaceAll(String.fromCharCode(0x2029), '\\u2029');

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function injectTemplate(template: string, r: Extract<SsrResult, { type: 'html' }>): string {
  return template
    .replace('<html<!--app-html-attrs-->>', `<html lang="${escapeAttr(r.htmlAttrs.lang)}" dir="${r.htmlAttrs.dir}">`)
    .replace('<!--app-head-->', r.head)
    .replace('<!--app-html-->', r.appHtml)
    .replace('<!--app-state-->', `<script id="__STATE__" type="application/json">${serializeState(r.state)}</script>`);
}

export interface SsrHost {
  /** Static assets (prod) or Vite dev middleware (dev). Mount before the page handler. */
  assets: RequestHandler[];
  /** Catch-all page renderer for public routes. */
  handler: RequestHandler;
}

/** Admin is client-rendered only: serve the same shell without SSR, marked noindex. */
const adminShell = (template: string) =>
  template
    .replace('<html<!--app-html-attrs-->>', '<html lang="en" dir="ltr">')
    .replace('<!--app-head-->', '<meta name="robots" content="noindex,nofollow" /><title>Admin</title>')
    .replace('<!--app-html-->', '')
    .replace('<!--app-state-->', '');

export async function createSsrHost(): Promise<SsrHost> {
  if (!isProd) {
    // Dev: Vite in middleware mode gives HMR and on-the-fly SSR module loading.
    const { createServer } = await import('vite');
    const vite = await createServer({
      root: webDir,
      appType: 'custom',
      server: { middlewareMode: true },
      logLevel: 'warn',
    });
    const handler: RequestHandler = (req, res, next) => {
      void (async () => {
        try {
          const raw = await readFile(resolve(webDir, 'index.html'), 'utf8');
          const template = await vite.transformIndexHtml(req.originalUrl, raw);
          if (req.path.startsWith('/admin')) return res.status(200).type('html').send(adminShell(template));
          const { render } = (await vite.ssrLoadModule('/src/entry-server.tsx')) as { render: SsrRender };
          await respond(render, template, req, res);
        } catch (err) {
          if (err instanceof Error) vite.ssrFixStacktrace(err);
          next(err);
        }
      })();
    };
    return { assets: [vite.middlewares as unknown as RequestHandler], handler };
  }

  // Prod: prebuilt client assets + server bundle. Hashed assets are immutable for a year.
  const clientDir = resolve(webDir, 'dist/client');
  const template = await readFile(resolve(clientDir, 'index.html'), 'utf8');
  const entry = pathToFileURL(resolve(webDir, 'dist/server/entry-server.js')).href;
  const { render } = (await import(entry)) as { render: SsrRender };

  // Vite puts content-hashed files in /assets: cache forever. Anything else (favicon etc.) for an hour.
  const files = express.static(clientDir, {
    index: false,
    setHeaders(res, filePath) {
      const hashed = /[\\/]assets[\\/]/.test(filePath);
      res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    },
  });
  const assets: RequestHandler[] = [(req, res, next) => (req.path === '/index.html' ? next() : files(req, res, next))];

  const handler: RequestHandler = (req, res, next) => {
    if (req.path.startsWith('/admin')) {
      res.set('Cache-Control', 'no-store');
      return res.status(200).type('html').send(adminShell(template));
    }
    respond(render, template, req, res).catch(next);
  };
  return { assets, handler };
}

async function respond(render: SsrRender, template: string, req: express.Request, res: express.Response) {
  // First HTML view of the browser session shows the preloader; the session cookie skips it afterwards.
  const showPreloader = req.cookies?.pl !== '1';
  const result = await render({ url: req.originalUrl, data: publicService, siteUrl: env.PUBLIC_SITE_URL, showPreloader });
  if (showPreloader) res.cookie('pl', '1', { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' });
  if (result.type === 'redirect') {
    res.redirect(result.status, result.location);
    return;
  }
  if (result.status === 404) void logNotFound(req.path, req.get('referer') ?? '');
  if (result.status >= 500) logger.error({ url: req.originalUrl }, 'SSR rendered an error page');
  // HTML must revalidate so content edits in the admin show up immediately.
  res.set('Cache-Control', 'no-cache');
  res.status(result.status).type('html').send(injectTemplate(template, result));
}
