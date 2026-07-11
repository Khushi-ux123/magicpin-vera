import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function zodValidate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        accepted: false,
        reason: 'invalid_request',
        details: parsed.error.flatten()
      });
    }
    (req as any).validatedBody = parsed.data;
    next();
  };
}

