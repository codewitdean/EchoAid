import { nanoid } from 'nanoid';
import type { EmergencySession, EmergencyState, PublicEmergencyState } from '../types/domain.js';
import { AppError, notFound } from '../utils/errors.js';
import { addHours, nowIso } from '../utils/time.js';
import { Store } from '../store/store.js';
import { env } from '../config/env.js';

const defaultEmergency = (): EmergencyState => ({
  emergencyType: 'unknown',
  peopleAffected: null,
  conscious: null,
  breathing: 'unknown',
  location: null,
  hazards: [],
  urgency: 'unknown',
  currentStatus: null,
  summary: null,
  confidence: null,
  updatedAt: nowIso(),
});

export class SessionService {
  constructor(private readonly store: Store) {}

  async create() {
    const createdAt = nowIso();
    const session: EmergencySession = {
      id: `ses_${nanoid(12)}`,
      accessToken: `eat_${nanoid(32)}`,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
      expiresAt: addHours(new Date(createdAt), env.sessionTtlHours),
      emergency: defaultEmergency(),
    };
    await this.store.createSession(session);
    return session;
  }

  listPublic() {
    return this.store.snapshot().sessions.map((session) => this.publicView(session));
  }

  getAuthorized(id: string, token: string) {
    const session = this.store.getSession(id);
    if (!session) throw notFound('Session');
    if (session.accessToken !== token) throw new AppError(403, 'FORBIDDEN', 'Invalid session access token');
    return session;
  }

  async updateEmergency(id: string, token: string, patch: Partial<EmergencyState>) {
    const session = this.getAuthorized(id, token);
    if (session.status === 'ended') throw new AppError(409, 'SESSION_ENDED', 'Session has ended');
    const emergency: EmergencyState = {
      ...session.emergency,
      ...patch,
      updatedAt: nowIso(),
    };
    const updated = await this.store.updateSession(id, { emergency, updatedAt: emergency.updatedAt });
    return updated!;
  }

  async setLocation(id: string, token: string, location: EmergencyState['location']) {
    if (!location?.permissionGranted) throw new AppError(400, 'LOCATION_PERMISSION_REQUIRED', 'Location can only be stored after explicit permission');
    return this.updateEmergency(id, token, { location });
  }

  async end(id: string, token: string) {
    this.getAuthorized(id, token);
    const updated = await this.store.updateSession(id, { status: 'ended', updatedAt: nowIso() });
    return updated!;
  }

  publicView(session: EmergencySession): Omit<EmergencySession, 'accessToken'> {
    const { accessToken: _accessToken, ...safe } = session;
    return safe;
  }

  responderView(session: EmergencySession, sosId: string): { sessionId: string; sosId: string; emergency: PublicEmergencyState } {
    return {
      sessionId: session.id,
      sosId,
      emergency: session.emergency,
    };
  }
}
