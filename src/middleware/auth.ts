import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';
import { SessionService } from '../services/sessionService.js';

export function getHeaderValue(req: Request, name: string): string | undefined {
  const value = req.header(name);
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function getRouteParamValue(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function getSessionToken(req: Request): string | undefined {
  const rawToken = getHeaderValue(req, 'x-session-token') ?? getHeaderValue(req, 'authorization');
  if (!rawToken) return undefined;
  const normalized = rawToken.trim();
  return /^Bearer\s+/i.test(normalized) ? normalized.replace(/^Bearer\s+/i, '') : normalized;
}

export function sessionToken(sessionService: SessionService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const sessionId = getRouteParamValue(req, 'sessionId');
      const token = getSessionToken(req);
      if (!token) throw new AppError(401, 'SESSION_TOKEN_REQUIRED', 'Provide X-Session-Token or Bearer token');
      req.session = sessionService.getAuthorized(sessionId, token);
      req.sessionToken = token;
      next();
    } catch (error) { next(error); }
  };
}

export function assemblyAiKey(expected: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const supplied = getHeaderValue(req, 'x-assemblyai-ingest-key');
    if (!supplied || supplied !== expected) return next(new AppError(401, 'INVALID_INGEST_KEY', 'Invalid AssemblyAI integration key'));
    next();
  };
}
