import type { EmergencySession } from './domain.js';

declare global {
  namespace Express {
    interface Request {
      session?: EmergencySession;
      sessionToken?: string;
    }
  }
}

export {};
