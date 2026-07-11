import express from 'express';
import cors from 'cors';

import { routes } from './api/routes/routes';
import { errorHandler } from './api/middleware/errorHandler';
import { memoryStore } from './memory/store';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const startedAt = Date.now();
app.get('/v1/healthz', (_req, res) => res.status(200).json({ status: 'ok', uptime_seconds: Math.floor((Date.now() - startedAt) / 1000), contexts_loaded: memoryStore.contexts.counts() }));

app.get('/v1/metadata', (_req, res) => res.status(200).json({
  team_name: 'BlackboxAI',
  team_members: ['BlackboxAI'],
  model: 'deterministic-rule-based',
  approach: 'Clean Architecture deterministic composer (no hallucinations) + stateful suppression + conversation intelligence',
  contact_email: 'noreply@example.com',
  version: '0.0.1',
  submitted_at: new Date().toISOString()
}));

app.use(routes);
app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`VERA bot listening on :${port}`);
});


