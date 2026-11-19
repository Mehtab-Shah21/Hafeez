import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES, type ApiFailure } from '@app/shared';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiFailure = { ok: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Route not found' } };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  let status = 500;
  let body: ApiFailure = {
    ok: false,
    error: { code: ERROR_CODES.INTERNAL, message: 'Something went wrong' },
  };

  if (err instanceof ZodError) {
    status = 400;
    body = {
      ok: false,
      error: { code: ERROR_CODES.VALIDATION, message: 'Invalid request', details: err.flatten() },
    };
  } else if (err instanceof AppError) {
    status = err.status;
    body = { ok: false, error: { code: err.code, message: err.message, details: err.details } };
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type: string }).type === 'entity.parse.failed'
  ) {
    status = 400;
    body = { ok: false, error: { code: ERROR_CODES.VALIDATION, message: 'Malformed JSON body' } };
  }

  // Never leak internals: 5xx details are logged, not returned.
  if (status >= 500) logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(status).json(body);
};
