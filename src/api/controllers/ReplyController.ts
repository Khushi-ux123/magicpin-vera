import type { Request, Response } from 'express';
import { ReplyService } from '../../engine/ReplyService';

const replyService = new ReplyService();

export class ReplyController {
  async reply(req: Request, res: Response) {
    const body = (req as any).validatedBody as any;
    const result = replyService.reply(body);
    return res.status(200).json(result);
  }
}

