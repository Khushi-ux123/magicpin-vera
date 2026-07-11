import { z } from 'zod';

export const tickSchema = z.object({
  now: z.string().datetime(),
  available_triggers: z.array(z.string())
});

