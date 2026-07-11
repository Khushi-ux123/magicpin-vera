import type { Request, Response } from 'express';
import { memoryStore } from '../../memory/store';

export class ContextController {
  async pushContext(req: Request, res: Response) {
    const body = (req as any).validatedBody as {
      scope: 'category' | 'merchant' | 'customer' | 'trigger';
      context_id: string;
      version: number;
      payload: Record<string, any>;
      delivered_at: string;
    };

    const result = memoryStore.contexts.upsert(body.scope, body.context_id, body.version, body.payload, body.delivered_at);
    if (!result.accepted) return res.status(409).json(result);
    return res.status(200).json(result);
  }
}


