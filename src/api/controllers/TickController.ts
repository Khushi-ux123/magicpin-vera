import type { Request, Response } from 'express';
import { TickService } from '../../engine/TickService';

const tickService = new TickService();

export class TickController {
  async tick(req: Request, res: Response) {
    const body = (req as any).validatedBody as any;
    const result = tickService.tick(body.now, body.available_triggers);
    return res.status(200).json(result);
  }
}

