import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ERROR_CODES, loginSchema, type ApiFailure } from '@app/shared';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { issueCsrfToken, requireCsrf } from '../../middleware/csrf.js';
import { validate } from '../../middleware/validate.js';
import * as auth from './auth.service.js';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from './tokens.js';

export interface AuthRouterOptions {
  loginMax: number;
  loginWindowMs: number;
}

export function authRouter({ loginMax, loginWindowMs }: AuthRouterOptions): Router {
  const router = Router();

  // Keyed on IP + email: slows guessing against one account without locking out a shared office IP.
  const loginLimiter = rateLimit({
    windowMs: loginWindowMs,
    limit: loginMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const body = req.body as { email?: unknown } | undefined;
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
      return `${req.ip ?? 'unknown'}|${email}`;
    },
    handler: (_req, res) => {
      const body: ApiFailure = {
        ok: false,
        error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many attempts. Try again in a few minutes.' },
      };
      res.status(429).json(body);
    },
  });

  const ua = (h: string | undefined) => h ?? '';

  router.get('/csrf', (_req, res) => ok(res, { token: issueCsrfToken(res) }));

  router.post(
    '/login',
    loginLimiter,
    requireCsrf,
    validate(loginSchema),
    asyncHandler(async (req, res) => {
      const session = await auth.login(req.body, ua(req.get('user-agent')), req.ip ?? '');
      setAuthCookies(res, session.accessToken, session.refreshToken);
      // Rotate the CSRF token on privilege change; the client switches to the returned one.
      const csrfToken = issueCsrfToken(res);
      return ok(res, { user: session.user, csrfToken });
    }),
  );

  router.post(
    '/refresh',
    requireCsrf,
    asyncHandler(async (req, res) => {
      const raw: unknown = req.cookies?.[REFRESH_COOKIE];
      if (typeof raw !== 'string' || !raw) {
        clearAuthCookies(res);
        return res.status(401).json({ ok: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Session expired' } });
      }
      try {
        const session = await auth.refresh(raw, ua(req.get('user-agent')));
        setAuthCookies(res, session.accessToken, session.refreshToken);
        return ok(res, { user: session.user });
      } catch (e) {
        clearAuthCookies(res);
        throw e;
      }
    }),
  );

  router.post(
    '/logout',
    requireCsrf,
    asyncHandler(async (req, res) => {
      const raw: unknown = req.cookies?.[REFRESH_COOKIE];
      await auth.logout(typeof raw === 'string' ? raw : undefined);
      clearAuthCookies(res);
      return ok(res, { loggedOut: true });
    }),
  );

  router.get('/me', requireAuth, (req, res) => ok(res, { user: req.user }));

  return router;
}
