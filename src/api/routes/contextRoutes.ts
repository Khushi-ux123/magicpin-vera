import { Router } from 'express';
import { ContextController } from '../controllers/ContextController';
import { zodValidate } from '../middleware/zodValidate';
import { contextPushSchema } from '../schemas/contextSchemas';

export const contextRoutes = Router();
const controller = new ContextController();

contextRoutes.post('/v1/context', zodValidate(contextPushSchema), controller.pushContext.bind(controller));

