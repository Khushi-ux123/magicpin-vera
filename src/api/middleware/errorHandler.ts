import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ accepted: false, reason: 'internal_error' });
}

