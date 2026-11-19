import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { requireCsrf } from './middleware/csrf.js';
import { authRouter, type AuthRouterOptions } from './modules/auth/auth.router.js';
import { usersRouter } from './modules/users/users.router.js';

export interface AppOptions {
  auth?: Partial<AuthRouterOptions>;
}

/**
 * Builds the Express app without listening, so tests can drive it with Supertest.
 * Step 2 adds the full security stack (CSP, CORS, compression, hpp), public API, SSR and redirects.
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Nginx / a PaaS load balancer in production

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.use(
    '/api/admin/auth',
    authRouter({ loginMax: 5, loginWindowMs: 15 * 60 * 1000, ...options.auth }),
  );

  // Everything else under /api/admin needs a session and, for writes, a CSRF token.
  const admin = express.Router();
  admin.use(requireAuth, requireCsrf);
  admin.use('/users', usersRouter());
  app.use('/api/admin', admin);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
