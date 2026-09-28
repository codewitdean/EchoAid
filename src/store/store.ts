import { JsonStore } from './jsonStore.js';
import type { EmergencySession, PersistedData, Responder, SosEvent } from '../types/domain.js';

export class Store {
  constructor(private readonly db: JsonStore) {}

  async init() {
    await this.db.init();
    const data = this.db.read();
    if (data.responders.length === 0) {
      data.responders = seedResponders();
      await this.db.replace(data);
    }
  }

  snapshot(): PersistedData { return this.db.read(); }

  async createSession(session: EmergencySession) {
    const data = this.db.read();
    data.sessions.push(session);
    await this.db.replace(data);
    return session;
  }

  getSession(id: string) { return this.db.read().sessions.find((s) => s.id === id) ?? null; }

  async updateSession(id: string, update: Partial<EmergencySession>) {
    const data = this.db.read();
    const index = data.sessions.findIndex((s) => s.id === id);
    if (index < 0) return null;
    data.sessions[index] = { ...data.sessions[index], ...update };
    await this.db.replace(data);
    return data.sessions[index];
  }

  async createSos(event: SosEvent) {
    const data = this.db.read();
    data.sosEvents.push(event);
    await this.db.replace(data);
    return event;
  }

  getSos(id: string) { return this.db.read().sosEvents.find((e) => e.id === id) ?? null; }
  getSosForSession(sessionId: string) { return this.db.read().sosEvents.find((e) => e.sessionId === sessionId) ?? null; }

  async updateSos(id: string, update: Partial<SosEvent>) {
    const data = this.db.read();
    const index = data.sosEvents.findIndex((e) => e.id === id);
    if (index < 0) return null;
    data.sosEvents[index] = { ...data.sosEvents[index], ...update };
    await this.db.replace(data);
    return data.sosEvents[index];
  }

  getAvailableResponders() { return this.db.read().responders.filter((r) => r.available); }
  getResponder(id: string) { return this.db.read().responders.find((r) => r.id === id) ?? null; }

  async setResponderAvailability(id: string, available: boolean) {
    const data = this.db.read();
    const index = data.responders.findIndex((r) => r.id === id);
    if (index < 0) return null;
    data.responders[index].available = available;
    await this.db.replace(data);
    return data.responders[index];
  }
}

function seedResponders(): Responder[] {
  return [
    { id: 'resp_01', displayName: 'Responder A', available: true, latitude: 28.6139, longitude: 77.209, capabilities: ['first_aid', 'medical'] },
    { id: 'resp_02', displayName: 'Responder B', available: true, latitude: 28.6205, longitude: 77.217, capabilities: ['first_aid', 'fire'] },
    { id: 'resp_03', displayName: 'Responder C', available: true, latitude: 28.601, longitude: 77.198, capabilities: ['first_aid', 'accident'] },
  ];
}
