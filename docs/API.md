# API examples

All JSON responses use this general error shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Session creation

`POST /api/sessions`

Response contains:

- `session.id`: public session identifier
- `accessToken`: private token used by the user-side application
- `session.emergency`: structured emergency state

The token is intentionally excluded from subsequent session responses.

## Emergency state fields

| Field | Meaning |
|---|---|
| `emergencyType` | medical, fire, accident, crime, other or unknown |
| `peopleAffected` | number of people affected |
| `conscious` | known consciousness state |
| `breathing` | normal, abnormal, not_breathing or unknown |
| `location` | permitted location object or null |
| `hazards` | known immediate hazards |
| `urgency` | low, medium, high, critical or unknown |
| `currentStatus` | current textual situation |
| `summary` | responder-ready summary |
| `confidence` | optional 0–1 extraction confidence |
