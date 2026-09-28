export const emergencyTypes = ['medical', 'fire', 'accident', 'crime', 'other', 'unknown'] as const;
export type EmergencyType = (typeof emergencyTypes)[number];

export const urgencyLevels = ['low', 'medium', 'high', 'critical', 'unknown'] as const;
export type Urgency = (typeof urgencyLevels)[number];

export const sessionStatuses = ['active', 'sos_triggered', 'responder_assigned', 'ended'] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

export const sosStatuses = ['pending', 'matched', 'accepted', 'cancelled', 'expired'] as const;
export type SosStatus = (typeof sosStatuses)[number];

export interface Location {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  source: 'browser' | 'user_provided';
  permissionGranted: true;
  capturedAt: string;
}

export interface EmergencyState {
  emergencyType: EmergencyType;
  peopleAffected: number | null;
  conscious: boolean | null;
  breathing: 'normal' | 'abnormal' | 'not_breathing' | 'unknown';
  location: Location | null;
  hazards: string[];
  urgency: Urgency;
  currentStatus: string | null;
  summary: string | null;
  confidence: number | null;
  updatedAt: string;
}

export interface EmergencySession {
  id: string;
  accessToken: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  emergency: EmergencyState;
}

export interface Responder {
  id: string;
  displayName: string;
  available: boolean;
  latitude: number;
  longitude: number;
  capabilities: string[];
}

export interface SosEvent {
  id: string;
  sessionId: string;
  status: SosStatus;
  createdAt: string;
  updatedAt: string;
  responderId: string | null;
  matchedAt: string | null;
  acceptedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string;
}

export interface PersistedData {
  sessions: EmergencySession[];
  sosEvents: SosEvent[];
  responders: Responder[];
}

export interface PublicEmergencyState {
  emergencyType: EmergencyType;
  peopleAffected: number | null;
  conscious: boolean | null;
  breathing: EmergencyState['breathing'];
  location: Location | null;
  hazards: string[];
  urgency: Urgency;
  currentStatus: string | null;
  summary: string | null;
  confidence: number | null;
  updatedAt: string;
}

export interface ResponderEmergencyView {
  sessionId: string;
  sosId: string;
  emergency: Pick<
    EmergencyState,
    'emergencyType' | 'peopleAffected' | 'conscious' | 'breathing' | 'location' | 'hazards' | 'urgency' | 'currentStatus' | 'summary'
  >;
}
