import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ApiSuccess, PageMeta } from '@app/shared';

/** Express 4 does not catch rejected promises; forward them to the error handler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const ok = <T>(res: Response, data: T, meta?: PageMeta, status = 200) => {
  const body: ApiSuccess<T> = meta ? { ok: true, data, meta } : { ok: true, data };
  return res.status(status).json(body);
};
