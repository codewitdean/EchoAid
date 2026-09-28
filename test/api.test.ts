import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

let app: any;
let dataFile: string;
let mod: typeof import('../src/app.js') | undefined;

beforeEach(async () => {
  dataFile = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'echoaid-')), 'db.json');
  process.env.DATA_FILE = dataFile;
  process.env.ASSEMBLYAI_INGEST_KEY = 'test-key';
  mod = mod ?? await import('../src/app.js');
  app = await mod.createApp();
});

afterEach(async () => {
  await fs.rm(path.dirname(dataFile), { recursive: true, force: true });
});

describe('EchoAid backend', () => {
  it('health endpoint works', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('creates a session and does not expose token in public session', async () => {
    const response = await request(app).post('/api/sessions');
    expect(response.status).toBe(201);
    expect(response.body.accessToken).toMatch(/^eat_/);
    expect(response.body.session.accessToken).toBeUndefined();
    expect(response.body.session.status).toBe('active');
  });

  it('lists sessions without exposing access tokens', async () => {
    const created = await request(app).post('/api/sessions');
    const response = await request(app).get('/api/sessions');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.some((session: any) => session.id === created.body.session.id)).toBe(true);
    expect(response.body.sessions[0].accessToken).toBeUndefined();
  });

  it('updates emergency state with a valid token', async () => {
    const created = await request(app).post('/api/sessions');
    const { session, accessToken } = created.body;
    const response = await request(app)
      .patch(`/api/sessions/${session.id}/emergency`)
      .set('X-Session-Token', accessToken)
      .send({ emergencyType: 'medical', peopleAffected: 1, conscious: false, urgency: 'high' });
    expect(response.status).toBe(200);
    expect(response.body.session.emergency.emergencyType).toBe('medical');
    expect(response.body.session.emergency.conscious).toBe(false);
  });

  it('blocks state access with the wrong token', async () => {
    const created = await request(app).post('/api/sessions');
    const response = await request(app)
      .get(`/api/sessions/${created.body.session.id}`)
      .set('X-Session-Token', 'wrong');
    expect(response.status).toBe(403);
  });

  it('requires explicit location permission', async () => {
    const created = await request(app).post('/api/sessions');
    const response = await request(app)
      .post(`/api/sessions/${created.body.session.id}/location`)
      .set('X-Session-Token', created.body.accessToken)
      .send({ latitude: 28.61, longitude: 77.20, source: 'browser', permissionGranted: false });
    expect(response.status).toBe(400);
  });

  it('triggers SOS and matches a simulated responder', async () => {
    const created = await request(app).post('/api/sessions');
    const { session, accessToken } = created.body;
    await request(app)
      .post(`/api/sessions/${session.id}/location`)
      .set('X-Session-Token', accessToken)
      .send({ latitude: 28.6139, longitude: 77.209, source: 'browser', permissionGranted: true });
    const response = await request(app)
      .post(`/api/sos/sessions/${session.id}/sos`)
      .set('X-Session-Token', accessToken);
    expect(response.status).toBe(201);
    expect(response.body.sos.status).toBe('matched');
    expect(response.body.sos.responder).toBeTruthy();
  });

  it('allows matched responder to accept SOS', async () => {
    const created = await request(app).post('/api/sessions');
    const sosResponse = await request(app)
      .post(`/api/sos/sessions/${created.body.session.id}/sos`)
      .set('X-Session-Token', created.body.accessToken);
    const sosId = sosResponse.body.sos.id;
    const response = await request(app).post(`/api/responder/sos/${sosId}/accept`);
    expect(response.status).toBe(200);
    expect(response.body.sos.status).toBe('accepted');
  });

  it('accepts an AssemblyAI structured-state update', async () => {
    const created = await request(app).post('/api/sessions');
    const response = await request(app)
      .post('/api/integrations/assemblyai/emergency-state')
      .set('X-AssemblyAI-Ingest-Key', 'test-key')
      .set('X-Session-Token', created.body.accessToken)
      .send({ sessionId: created.body.session.id, emergency: { emergencyType: 'medical', urgency: 'high', summary: 'Person collapsed' } });
    expect(response.status).toBe(200);
    expect(response.body.session.emergency.summary).toBe('Person collapsed');
  });
});
