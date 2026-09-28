# EchoAid Backend

Backend/system service for the EchoAid AssemblyAI Voice Agent hackathon MVP.

## What it does

- Creates explicit emergency sessions.
- Maintains structured emergency state.
- Accepts state updates from the voice-agent/frontend.
- Stores only location submitted with explicit permission.
- Publishes live session updates over Server-Sent Events (SSE).
- Triggers a simulated SOS.
- Matches the SOS to a simulated nearby responder.
- Provides a responder-safe emergency view containing only necessary emergency information.
- Allows a simulated responder to accept the SOS.
- Supports SOS cancellation before acceptance.
- Persists MVP state in a JSON file so the demo works without a separate database.
- Includes request validation, security headers, CORS, rate limiting, structured logging and tests.

The hackathon project document explicitly scopes the responder and emergency-service interactions as simulated and excludes real emergency-service integration, automatic emergency calling, production responder verification and complex GPS infrastructure.

## Stack

- Node.js 20+
- TypeScript
- Express 5
- Zod
- JSON file persistence
- Vitest + Supertest
- Docker

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

API: `http://localhost:4000`

Health check:

```bash
curl http://localhost:4000/health
```

Run tests:

```bash
npm test
```

Build production JavaScript:

```bash
npm run build
npm start
```

## Docker

```bash
docker compose up --build
```

## Demo flow

### 1. Start a session

```bash
curl -X POST http://localhost:4000/api/sessions
```

Save `session.id` and `accessToken` from the response.

### 2. Update emergency state

```bash
curl -X PATCH http://localhost:4000/api/sessions/SESSION_ID/emergency \
  -H 'Content-Type: application/json' \
  -H 'X-Session-Token: SESSION_TOKEN' \
  -d '{
    "emergencyType":"medical",
    "peopleAffected":1,
    "conscious":false,
    "breathing":"unknown",
    "urgency":"high",
    "currentStatus":"Person collapsed and is not responding"
  }'
```

### 3. Save permitted location

```bash
curl -X POST http://localhost:4000/api/sessions/SESSION_ID/location \
  -H 'Content-Type: application/json' \
  -H 'X-Session-Token: SESSION_TOKEN' \
  -d '{
    "latitude":28.6139,
    "longitude":77.2090,
    "accuracyMeters":20,
    "source":"browser",
    "permissionGranted":true
  }'
```

The backend rejects `permissionGranted: false` and never accepts a location without explicit permission.

### 4. Trigger simulated SOS

```bash
curl -X POST http://localhost:4000/api/sos/sessions/SESSION_ID/sos \
  -H 'X-Session-Token: SESSION_TOKEN'
```

The response contains the simulated responder match.

### 5. Responder view

```bash
curl http://localhost:4000/api/responder/sos/SOS_ID/view
```

This endpoint intentionally returns a restricted emergency view instead of the user's session token or unrelated session metadata.

### 6. Responder accepts

```bash
curl -X POST http://localhost:4000/api/responder/sos/SOS_ID/accept
```

### 7. Frontend live updates

Open:

```text
GET /api/sessions/:sessionId/events
```

with `X-Session-Token`. The endpoint uses SSE and emits events such as `emergency.updated`, `location.updated`, `sos.updated`, `responder.accepted`, and `session.ended`.

## AssemblyAI integration

Member 1's voice layer can send structured information to:

```text
POST /api/integrations/assemblyai/emergency-state
```

Headers:

```text
X-AssemblyAI-Ingest-Key: <ASSEMBLYAI_INGEST_KEY>
X-Session-Token: <SESSION_TOKEN>
```

Body:

```json
{
  "sessionId": "ses_xxx",
  "emergency": {
    "emergencyType": "medical",
    "peopleAffected": 1,
    "conscious": false,
    "urgency": "high",
    "summary": "Person collapsed and is not responding"
  }
}
```

The backend does not attempt to diagnose a medical condition. It stores the structured information provided by the voice layer.

## API contract

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/sessions` | Start emergency session |
| GET | `/api/sessions/:sessionId` | Read own session |
| PATCH | `/api/sessions/:sessionId/emergency` | Update structured emergency state |
| POST | `/api/sessions/:sessionId/location` | Store permitted location |
| GET | `/api/sessions/:sessionId/events` | Live SSE updates |
| DELETE | `/api/sessions/:sessionId` | End session |
| POST | `/api/sos/sessions/:sessionId/sos` | Trigger simulated SOS |
| GET | `/api/sos/:sosId` | Read own SOS |
| POST | `/api/sos/:sosId/cancel` | Cancel SOS before acceptance |
| GET | `/api/responder/responders` | List simulated available responders |
| GET | `/api/responder/sos/:sosId/view` | Restricted responder emergency view |
| POST | `/api/responder/sos/:sosId/accept` | Accept simulated SOS |
| POST | `/api/integrations/assemblyai/emergency-state` | Voice-agent structured-state ingestion |

## Security / privacy MVP rules

1. A session token is returned only at session creation and is not included in normal session responses.
2. Session state requires the session token.
3. Location requires explicit `permissionGranted: true`.
4. Responder view does not expose the user's session access token.
5. The responder view contains emergency information needed for the simulation, not arbitrary session metadata.
6. Rate limiting, Helmet and CORS are enabled.
7. Request bodies are schema validated.
8. The JSON database is intended for the hackathon MVP, not production emergency-service deployment.

## Suggested team integration

- Member 1: creates the session and sends extracted emergency fields to the AssemblyAI integration endpoint.
- Member 3: reads the session and subscribes to the SSE endpoint for dashboard updates; triggers SOS through the API.
- Member 3/4: opens the responder view and accepts the simulated SOS.
- Member 2: owns this backend, API contracts, state transitions, testing and integration debugging.

## State machine

```text
active
  |
  | POST /sos
  v
sos_triggered -> matched -> responder_assigned
                    |              |
                    | accept       | session remains assigned
                    v              v
                 accepted

active -> ended
matched -> cancelled -> active
```

## Production follow-up

For a post-hackathon version, replace the JSON store with a transactional database, add real authentication/authorization, encrypt sensitive data, add audit logs, add durable event delivery, add idempotency keys, add observability/tracing, and introduce a verified responder authorization model. These are deliberately outside the MVP scope.
