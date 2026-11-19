import { ERROR_CODES, type ErrorCode } from '@app/shared';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthorized = (msg = 'Authentication required') =>
  new AppError(401, ERROR_CODES.UNAUTHORIZED, msg);
export const forbidden = (msg = 'You do not have permission to do this') =>
  new AppError(403, ERROR_CODES.FORBIDDEN, msg);
export const notFound = (msg = 'Not found') => new AppError(404, ERROR_CODES.NOT_FOUND, msg);
