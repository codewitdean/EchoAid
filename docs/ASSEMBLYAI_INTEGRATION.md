# AssemblyAI / Member 1 Integration Contract

The voice-agent layer owns the conversation, emergency detection, follow-up questions and extraction. The backend owns persistence and state transitions.

When the voice agent learns a new fact, send only the structured fields that changed.

```http
POST /api/integrations/assemblyai/emergency-state
X-AssemblyAI-Ingest-Key: <server secret>
X-Session-Token: <session token>
Content-Type: application/json
```

```json
{
  "sessionId": "ses_123",
  "emergency": {
    "emergencyType": "medical",
    "peopleAffected": 1,
    "conscious": false,
    "breathing": "unknown",
    "urgency": "high",
    "currentStatus": "Person collapsed and is not responding",
    "confidence": 0.96
  }
}
```

The backend merges the patch with the current state. This means the voice agent does not have to resend all fields every turn.

## Suggested event timing

1. User starts emergency session.
2. Backend returns `sessionId` + session token.
3. Voice agent identifies emergency type.
4. Voice agent posts `emergencyType`.
5. Each answered follow-up updates the relevant field.
6. Backend emits `emergency.updated` through SSE.
7. Frontend dashboard updates.
8. User confirms SOS.
9. Frontend calls SOS endpoint.
10. Backend matches simulated responder.
