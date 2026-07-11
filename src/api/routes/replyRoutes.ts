import { Router } from 'express';
import { ReplyController } from '../controllers/ReplyController';
import { zodValidate } from '../middleware/zodValidate';
import { replySchema } from '../schemas/replySchemas';

export const replyRoutes = Router();
const controller = new ReplyController();

replyRoutes.post('/v1/reply', zodValidate(replySchema), controller.reply.bind(controller));

