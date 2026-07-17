import { z } from 'zod';

export const replySchema = z.object({
  conversation_id: z.string().min(1),
  merchant_id: z.string().nullable().optional(),
  customer_id: z.string().nullable().optional(),
  from_role: z.enum(['merchant', 'customer']),
  message: z.string(),
  received_at: z.string().datetime(),
  turn_number: z.number().int().min(1),

  // Optional state hints emitted/used by the challenge runner for slot selection flows.
  awaiting_slot_choice: z.boolean().optional(),
  state_hint: z
    .object({
      awaitingSlotChoice: z.boolean().optional(),
      // Optional reschedule date/time hint to echo back to the customer.
      reschedule_at: z.string().optional(),
    })
    .optional(),
  // Optional: directly passed reschedule date/time (string) to echo back.
  reschedule_at: z.string().optional(),
  // Note: we keep this minimal; ReplyService only requires awaitingSlotChoice for correct routing.
});



