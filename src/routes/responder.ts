import { Router } from 'express';
import { Store } from '../store/store.js';
import { SosService } from '../services/sosService.js';
import { SessionService } from '../services/sessionService.js';
import { notFound } from '../utils/errors.js';
import type { EventHub } from '../services/eventHub.js';

export function responderRoutes(store: Store, sos: SosService, sessions: SessionService, hub: EventHub) {
  const router = Router();

  router.get('/responders', (_req, res) => {
    const responders = store.getAvailableResponders().map(({ id, displayName, latitude, longitude, capabilities }) => ({ id, displayName, latitude, longitude, capabilities }));
    res.json({ responders });
  });

  router.get('/sos/:sosId/view', (req, res, next) => {
    try {
      const event = store.getSos(req.params.sosId);
      if (!event) throw notFound('SOS event');
      const session = store.getSession(event.sessionId);
      if (!session) throw notFound('Session');
      const responder = event.responderId ? store.getResponder(event.responderId) : null;
      res.json({
        sos: { id: event.id, status: event.status, createdAt: event.createdAt, matchedAt: event.matchedAt, acceptedAt: event.acceptedAt },
        responder: responder ? { id: responder.id, displayName: responder.displayName, capabilities: responder.capabilities } : null,
        emergency: sessions.responderView(session, event.id).emergency,
      });
    } catch (error) { next(error); }
  });

  router.post('/sos/:sosId/accept', async (req, res, next) => {
    try {
      const event = await sos.accept(req.params.sosId);
      hub.publish(event.sessionId, { type: 'responder.accepted', sos: event });
      res.json({ sos: event });
    } catch (error) { next(error); }
  });

  return router;
}
