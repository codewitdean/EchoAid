import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { JsonStore } from './store/jsonStore.js';
import { Store } from './store/store.js';
import { SessionService } from './services/sessionService.js';
import { ResponderService } from './services/responderService.js';
import { SosService } from './services/sosService.js';
import { EventHub } from './services/eventHub.js';
import { sessionRoutes } from './routes/sessions.js';
import { sosRoutes } from './routes/sos.js';
import { responderRoutes } from './routes/responder.js';
import { integrationRoutes } from './routes/integration.js';
import { errorHandler } from './middleware/errorHandler.js';

export async function createApp() {
  const jsonStore = new JsonStore(env.dataFile);
  const store = new Store(jsonStore);
  await store.init();

  const sessions = new SessionService(store);
  const responders = new ResponderService(store);
  const sos = new SosService(store, sessions, responders);
  const hub = new EventHub();

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin, credentials: false }));
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp());
  app.use(rateLimit({ windowMs: env.rateLimitWindowMs, limit: env.rateLimitMax, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'echoaid-backend', timestamp: new Date().toISOString() }));
  app.get('/api', (_req, res) => res.json({ name: 'EchoAid Backend API', version: '1.0.0' }));

  app.use('/api/sessions', sessionRoutes(sessions, hub));
  app.use('/api/sos', sosRoutes(sos, sessions, hub));
  app.use('/api/responder', responderRoutes(store, sos, sessions, hub));
  app.use('/api/integrations', integrationRoutes(sessions, hub, env.assemblyAiIngestKey));

  app.use((_req, res) => res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } }));
  app.use(errorHandler);
  return app;
}
