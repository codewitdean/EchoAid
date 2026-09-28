import { Router } from 'express';
import { SessionService } from '../services/sessionService.js';
import { getRouteParamValue, sessionToken } from '../middleware/auth.js';
import { emergencyPatchSchema, locationSchema } from '../utils/validation.js';
import type { EventHub } from '../services/eventHub.js';

export function sessionRoutes(service: SessionService, hub: EventHub) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const sessions = service.listPublic();
      res.json({ sessions });
    } catch (error) { next(error); }
  });

  router.post('/', async (_req, res, next) => {
    try {
      const session = await service.create();
      res.status(201).json({ session: service.publicView(session), accessToken: session.accessToken });
    } catch (error) { next(error); }
  });

  router.get('/:sessionId', sessionToken(service), (req, res) => {
    res.json({ session: service.publicView(req.session!) });
  });

  router.patch('/:sessionId/emergency', sessionToken(service), async (req, res, next) => {
    try {
      const sessionId = getRouteParamValue(req, 'sessionId');
      const patch = emergencyPatchSchema.parse(req.body);
      const updated = await service.updateEmergency(sessionId, req.sessionToken!, patch);
      hub.publish(sessionId, { type: 'emergency.updated', session: service.publicView(updated!) });
      res.json({ session: service.publicView(updated!) });
    } catch (error) { next(error); }
  });

  router.post('/:sessionId/location', sessionToken(service), async (req, res, next) => {
    try {
      const sessionId = getRouteParamValue(req, 'sessionId');
      const location = locationSchema.parse(req.body);
      const updated = await service.setLocation(sessionId, req.sessionToken!, { ...location, capturedAt: new Date().toISOString() });
      hub.publish(sessionId, { type: 'location.updated', session: service.publicView(updated!) });
      res.json({ session: service.publicView(updated!) });
    } catch (error) { next(error); }
  });

  router.delete('/:sessionId', sessionToken(service), async (req, res, next) => {
    try {
      const sessionId = getRouteParamValue(req, 'sessionId');
      const updated = await service.end(sessionId, req.sessionToken!);
      hub.publish(sessionId, { type: 'session.ended', session: service.publicView(updated!) });
      res.json({ session: service.publicView(updated) });
    } catch (error) { next(error); }
  });

  router.get('/:sessionId/events', sessionToken(service), (req, res) => {
    const sessionId = getRouteParamValue(req, 'sessionId');
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`);
    const unsubscribe = hub.subscribe(sessionId, (event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    req.on('close', () => { clearInterval(heartbeat); unsubscribe(); });
  });

  return router;
}
