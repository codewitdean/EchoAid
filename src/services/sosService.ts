import { nanoid } from 'nanoid';
import type { EmergencySession, SosEvent } from '../types/domain.js';
import { AppError, notFound } from '../utils/errors.js';
import { addHours, nowIso } from '../utils/time.js';
import { env } from '../config/env.js';
import { Store } from '../store/store.js';
import { ResponderService } from './responderService.js';
import { SessionService } from './sessionService.js';

export class SosService {
  constructor(
    private readonly store: Store,
    private readonly sessions: SessionService,
    private readonly responders: ResponderService,
  ) {}

  async trigger(sessionId: string, token: string) {
    const session = this.sessions.getAuthorized(sessionId, token);
    if (session.status === 'ended') throw new AppError(409, 'SESSION_ENDED', 'Session has ended');

    const existing = this.store.getSosForSession(sessionId);
    if (existing && ['pending', 'matched', 'accepted'].includes(existing.status)) return this.withResponder(existing);

    const createdAt = nowIso();
    const event: SosEvent = {
      id: `sos_${nanoid(12)}`,
      sessionId,
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
      responderId: null,
      matchedAt: null,
      acceptedAt: null,
      cancelledAt: null,
      expiresAt: addHours(new Date(createdAt), 1),
    };
    await this.store.createSos(event);
    await this.store.updateSession(sessionId, { status: 'sos_triggered', updatedAt: createdAt });

    const responder = this.responders.match(session);
    if (!responder) return this.store.getSos(event.id);

    const matchedAt = nowIso();
    const matched = await this.store.updateSos(event.id, {
      status: 'matched', responderId: responder.id, matchedAt, updatedAt: matchedAt,
    });
    return this.withResponder(matched!);
  }

  getAuthorized(sosId: string, token: string) {
    const event = this.store.getSos(sosId);
    if (!event) throw notFound('SOS event');
    this.sessions.getAuthorized(event.sessionId, token);
    return this.withResponder(event);
  }

  async accept(sosId: string) {
    const event = this.store.getSos(sosId);
    if (!event) throw notFound('SOS event');
    if (event.status !== 'matched') throw new AppError(409, 'SOS_NOT_MATCHED', 'SOS is not waiting for responder acceptance');
    if (!event.responderId) throw new AppError(409, 'RESPONDER_MISSING', 'No responder is assigned');

    const acceptedAt = nowIso();
    const updated = await this.store.updateSos(sosId, { status: 'accepted', acceptedAt, updatedAt: acceptedAt });
    await this.store.updateSession(event.sessionId, { status: 'responder_assigned', updatedAt: acceptedAt });
    await this.store.setResponderAvailability(event.responderId, false);
    return this.withResponder(updated!);
  }

  async cancel(sosId: string, token: string) {
    const event = this.store.getSos(sosId);
    if (!event) throw notFound('SOS event');
    this.sessions.getAuthorized(event.sessionId, token);
    if (['accepted', 'cancelled'].includes(event.status)) throw new AppError(409, 'SOS_CANNOT_CANCEL', 'SOS can no longer be cancelled');
    const cancelledAt = nowIso();
    const updated = await this.store.updateSos(sosId, { status: 'cancelled', cancelledAt, updatedAt: cancelledAt });
    await this.store.updateSession(event.sessionId, { status: 'active', updatedAt: cancelledAt });
    return this.withResponder(updated!);
  }

  private withResponder(event: SosEvent) {
    const responder = event.responderId ? this.store.getResponder(event.responderId) : null;
    return { ...event, responder: responder ? { id: responder.id, displayName: responder.displayName, capabilities: responder.capabilities } : null };
  }
}
