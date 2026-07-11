import { z } from 'zod';

export const replySchema = z.object({
  conversation_id: z.string().min(1),
  merchant_id: z.string().nullable().optional(),
  customer_id: z.string().nullable().optional(),
  from_role: z.enum(['merchant', 'customer']),
  message: z.string(),
  received_at: z.string().datetime(),
  turn_number: z.number().int().min(1)
});

