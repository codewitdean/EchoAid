import type { EmergencySession, Responder } from '../types/domain.js';
import { Store } from '../store/store.js';

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class ResponderService {
  constructor(private readonly store: Store) {}

  match(session: EmergencySession): Responder | null {
    const available = this.store.getAvailableResponders();
    if (!session.emergency.location) return available[0] ?? null;

    const candidates = available
      .map((responder) => ({ responder, distance: distanceKm(session.emergency.location!.latitude, session.emergency.location!.longitude, responder.latitude, responder.longitude) }))
      .sort((a, b) => a.distance - b.distance);

    return candidates[0]?.responder ?? null;
  }
}
