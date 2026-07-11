import { z } from 'zod';

export const contextPushSchema = z.object({
  scope: z.enum(['category', 'merchant', 'customer', 'trigger']),
  context_id: z.string().min(1),
  version: z.number().int().nonnegative(),
  payload: z.record(z.string(), z.any()),
  delivered_at: z.string().datetime()
});


