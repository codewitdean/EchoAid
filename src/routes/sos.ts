import { Router } from 'express';
import { SosService } from '../services/sosService.js';
import { SessionService } from '../services/sessionService.js';
import { getHeaderValue, getRouteParamValue, getSessionToken, sessionToken } from '../middleware/auth.js';
import type { EventHub } from '../services/eventHub.js';

export function sosRoutes(sos: SosService, sessions: SessionService, hub: EventHub) {
  const router = Router();

  router.post('/sessions/:sessionId/sos', sessionToken(sessions), async (req, res, next) => {
    try {
      const sessionId = getRouteParamValue(req, 'sessionId');
      const event = await sos.trigger(sessionId, req.sessionToken!);
      hub.publish(sessionId, { type: 'sos.updated', sos: event });
      res.status(201).json({ sos: event });
    } catch (error) { next(error); }
  });

  router.get('/:sosId', async (req, res, next) => {
    try {
      const token = getSessionToken(req);
      if (!token) return res.status(401).json({ error: { code: 'SESSION_TOKEN_REQUIRED', message: 'Provide session token' } });
      const event = sos.getAuthorized(getRouteParamValue(req, 'sosId'), token);
      res.json({ sos: event });
    } catch (error) { next(error); }
  });

  router.post('/:sosId/accept', async (req, res, next) => {
    try {
      const event = await sos.accept(getRouteParamValue(req, 'sosId'));
      hub.publish(event.sessionId, { type: 'sos.updated', sos: event });
      res.json({ sos: event });
    } catch (error) { next(error); }
  });

  router.post('/:sosId/cancel', async (req, res, next) => {
    try {
      const token = getSessionToken(req);
      if (!token) return res.status(401).json({ error: { code: 'SESSION_TOKEN_REQUIRED', message: 'Provide session token' } });
      const event = await sos.cancel(getRouteParamValue(req, 'sosId'), token);
      hub.publish(event.sessionId, { type: 'sos.updated', sos: event });
      res.json({ sos: event });
    } catch (error) { next(error); }
  });

  return router;
}
