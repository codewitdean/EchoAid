import { Router } from 'express';
import { SessionService } from '../services/sessionService.js';
import { assemblyAiKey, getSessionToken } from '../middleware/auth.js';
import { assemblyEventSchema } from '../utils/validation.js';
import type { EventHub } from '../services/eventHub.js';

export function integrationRoutes(service: SessionService, hub: EventHub, key: string) {
  const router = Router();
  router.post('/assemblyai/emergency-state', assemblyAiKey(key), async (req, res, next) => {
    try {
      const body = assemblyEventSchema.parse(req.body);
      const token = getSessionToken(req);
      if (!token) return res.status(401).json({ error: { code: 'SESSION_TOKEN_REQUIRED', message: 'AssemblyAI update requires session token' } });
      const updated = await service.updateEmergency(body.sessionId, token, body.emergency);
      hub.publish(body.sessionId, { type: 'emergency.updated', session: service.publicView(updated!) });
      res.json({ session: service.publicView(updated!) });
    } catch (error) { next(error); }
  });
  return router;
}
