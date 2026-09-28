import 'dotenv/config';

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: numberEnv('PORT', 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  dataFile: process.env.DATA_FILE ?? './data/echoaid.json',
  assemblyAiIngestKey: process.env.ASSEMBLYAI_INGEST_KEY ?? 'change-me',
  sessionTtlHours: numberEnv('SESSION_TTL_HOURS', 24),
  rateLimitWindowMs: numberEnv('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: numberEnv('RATE_LIMIT_MAX', 120),
};
