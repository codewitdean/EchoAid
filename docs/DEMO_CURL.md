# 3-minute demo script

## Terminal 1 — server

```bash
npm install
cp .env.example .env
npm run dev
```

## Terminal 2 — session

```bash
curl -s -X POST http://localhost:4000/api/sessions
```

Copy `session.id` and `accessToken`.

## Add emergency information

```bash
curl -s -X PATCH http://localhost:4000/api/sessions/SESSION_ID/emergency \
  -H 'Content-Type: application/json' \
  -H 'X-Session-Token: SESSION_TOKEN' \
  -d '{"emergencyType":"medical","peopleAffected":1,"conscious":false,"urgency":"high","summary":"Friend collapsed and is not responding"}'
```

## Add permitted location

```bash
curl -s -X POST http://localhost:4000/api/sessions/SESSION_ID/location \
  -H 'Content-Type: application/json' \
  -H 'X-Session-Token: SESSION_TOKEN' \
  -d '{"latitude":28.6139,"longitude":77.209,"source":"browser","permissionGranted":true}'
```

## Trigger SOS

```bash
curl -s -X POST http://localhost:4000/api/sos/sessions/SESSION_ID/sos \
  -H 'X-Session-Token: SESSION_TOKEN'
```

Copy `sos.id`.

## Open responder view

```bash
curl -s http://localhost:4000/api/responder/sos/SOS_ID/view
```

## Accept

```bash
curl -s -X POST http://localhost:4000/api/responder/sos/SOS_ID/accept
```
