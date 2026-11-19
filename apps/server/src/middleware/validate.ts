import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

type Part = 'body' | 'query' | 'params';

/** Validates and replaces `req[part]` with the parsed (coerced, defaulted) value. ZodErrors go to the error handler. */
export const validate =
  (schema: ZodTypeAny, part: Part = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    if (part === 'query') {
      // req.query is a getter in some Express setups; assign via defineProperty.
      Object.defineProperty(req, 'query', { value: result.data, writable: true });
    } else {
      (req as unknown as Record<Part, unknown>)[part] = result.data;
    }
    next();
  };
