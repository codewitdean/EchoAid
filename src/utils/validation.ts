import { z } from 'zod';
import { emergencyTypes, urgencyLevels } from '../types/domain.js';

export const emergencyPatchSchema = z.object({
  emergencyType: z.enum(emergencyTypes).optional(),
  peopleAffected: z.number().int().min(0).max(1000).nullable().optional(),
  conscious: z.boolean().nullable().optional(),
  breathing: z.enum(['normal', 'abnormal', 'not_breathing', 'unknown']).optional(),
  hazards: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  urgency: z.enum(urgencyLevels).optional(),
  currentStatus: z.string().trim().max(1000).nullable().optional(),
  summary: z.string().trim().max(3000).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
}).strict();

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(100000).optional(),
  source: z.enum(['browser', 'user_provided']),
  permissionGranted: z.literal(true),
}).strict();

export const assemblyEventSchema = z.object({
  sessionId: z.string().min(1),
  emergency: emergencyPatchSchema,
}).strict();
