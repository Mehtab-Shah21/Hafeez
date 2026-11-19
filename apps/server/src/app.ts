import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';
import { DEFAULT_LOCALE, isLocale } from '@app/shared';
import { env, isProd } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { uploadsDir } from './lib/storage.js';
import { requireAuth } from './middleware/auth.js';
import { requireCsrf } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { redirects } from './middleware/redirects.js';
import { authRouter, type AuthRouterOptions } from './modules/auth/auth.router.js';
import { publicRouter, type PublicRouterOptions } from './modules/public/public.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { mountApiDocs } from './openapi/docs.js';
import type { SsrHost } from './ssr/ssr.js';

export interface AppOptions {
  auth?: Partial<AuthRouterOptions>;
  public?: Partial<PublicRouterOptions>;
  /** Omitted in API tests; the real server passes the Vite/production SSR host. */
  ssr?: SsrHost;
}

/**
 * Content-Security-Policy. Scripts only from our origin (SSR state is a non-executable JSON tag).
 * Inline styles are allowed for the server-rendered theme variables. Dev adds what Vite HMR needs.
 * Analytics/Maps origins are added in Step 7 when those integrations are wired.
 */
const csp = () => ({
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'", 'data:'],
    connectSrc: isProd ? ["'self'"] : ["'self'", 'ws:', 'wss:'],
    frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    ...(isProd ? { upgradeInsecureRequests: [] } : {}),
  },
});

/** Picks /en or /ar for the bare domain from Accept-Language, else the admin's default language. */
async function preferredLocale(acceptLanguage: string | undefined) {
  const tag = acceptLanguage?.split(',')[0]?.trim().slice(0, 2).toLowerCase();
  if (isLocale(tag)) return tag;
  const company = await prisma.setting.findUnique({ where: { key: 'company' } });
  const def = (company?.value as { defaultLocale?: unknown } | null)?.defaultLocale;
  return isLocale(def) ? def : DEFAULT_LOCALE;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Nginx / a PaaS load balancer in production
  app.set('etag', 'strong');

  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: { ignore: (req) => /^\/(assets|@vite|@fs|node_modules|src)\//.test(req.url ?? '') || req.url === '/healthz' },
        // One compact line per request; never log headers (cookies) or bodies.
        serializers: {
          req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
      }),
    );
  }
  app.use(
    helmet({
      contentSecurityPolicy: csp(),
      hsts: isProd ? { maxAge: 63_072_000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginEmbedderPolicy: false, // allows map iframes and third-party images later
      frameguard: { action: 'deny' },
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  // Admin edits (rich text, section JSON) need more room than public forms.
  app.use('/api/admin', express.json({ limit: '2mb' }));
  app.use('/api', express.json({ limit: '100kb' }), hpp());

  // CORS only for configured origins (the site itself is same-origin and needs none).
  const origins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
  app.use('/api', cors({ origin: origins.length ? origins : false, credentials: true }));

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  // Public media (processed images). Private inquiry files live in uploads-private and are never mounted.
  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

  // ---- API
  app.use('/api/public', publicRouter({ inquiryMax: 5, inquiryWindowMs: 60 * 60 * 1000, ...options.public }));
  app.use('/api/admin/auth', authRouter({ loginMax: 5, loginWindowMs: 15 * 60 * 1000, ...options.auth }));
  const admin = express.Router();
  admin.use(requireAuth, requireCsrf);
  admin.use(adminRouter());
  app.use('/api/admin', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, admin);
  mountApiDocs(app);
  app.use('/api', notFoundHandler);

  // ---- Pages
  app.use(redirects);
  if (options.ssr) {
    for (const mw of options.ssr.assets) app.use(mw);
    app.get('/', (req, res, next) => {
      preferredLocale(req.get('accept-language'))
        .then((l) => {
          res.set('Vary', 'Accept-Language');
          res.redirect(302, `/${l}`);
        })
        .catch(next);
    });
    app.get('*', options.ssr.handler);
  }

  app.use(errorHandler);
  return app;
}
