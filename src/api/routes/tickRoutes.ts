import { Router } from 'express';
import { TickController } from '../controllers/TickController';
import { zodValidate } from '../middleware/zodValidate';
import { tickSchema } from '../schemas/tickSchemas';

export const tickRoutes = Router();
const controller = new TickController();

tickRoutes.post('/v1/tick', zodValidate(tickSchema), controller.tick.bind(controller));

