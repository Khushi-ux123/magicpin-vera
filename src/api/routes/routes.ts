import { Router } from 'express';

import { contextRoutes } from './contextRoutes';
import { tickRoutes } from './tickRoutes';
import { replyRoutes } from './replyRoutes';

export const routes = Router();
routes.use(contextRoutes);
routes.use(tickRoutes);
routes.use(replyRoutes);

