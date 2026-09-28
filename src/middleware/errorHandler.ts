import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.issues } });
  }
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
  }
  console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};
