import { Router } from 'express';
import { contentRouter } from './content.router.js';
import { mediaRouter } from './media.js';
import { inquiriesRouter, systemRouter, usersRouter } from './ops.router.js';
import { seoRouter } from './seo.router.js';
import { settingsRouter } from './settings.router.js';

/** Everything under /api/admin (auth + CSRF are applied by the caller). */
export function adminRouter(): Router {
  const r = Router();
  r.use('/settings', settingsRouter());
  r.use('/media', mediaRouter());
  r.use('/inquiries', inquiriesRouter());
  r.use('/users', usersRouter());
  r.use('/seo', seoRouter());
  r.use('/', systemRouter());
  r.use('/', contentRouter());
  return r;
}
