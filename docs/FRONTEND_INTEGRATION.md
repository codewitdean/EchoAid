# Frontend Integration Guide

## Start session

```ts
const response = await fetch(`${API}/api/sessions`, { method: 'POST' });
const { session, accessToken } = await response.json();
```

Keep `accessToken` in memory for the active emergency session. Do not display it or send it to the responder UI.

## Read session

```ts
const response = await fetch(`${API}/api/sessions/${session.id}`, {
  headers: { 'X-Session-Token': accessToken }
});
```

## Live dashboard

The backend authenticates SSE with `X-Session-Token`. Native browser `EventSource` cannot set custom headers, so use a `fetch()` streaming reader for the MVP:

```ts
const response = await fetch(`${API}/api/sessions/${session.id}/events`, {
  headers: { 'X-Session-Token': accessToken }
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  // Parse SSE frames separated by blank lines.
  console.log(chunk);
}
```

Do not put the long-lived session token in a URL.

## Emergency update

```ts
await fetch(`${API}/api/sessions/${session.id}/emergency`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-Token': accessToken
  },
  body: JSON.stringify({
    emergencyType: 'medical',
    peopleAffected: 1,
    conscious: false,
    breathing: 'unknown',
    urgency: 'high'
  })
});
```

## Browser location

Only call the location endpoint after the browser permission prompt has succeeded.

```ts
navigator.geolocation.getCurrentPosition(async ({ coords }) => {
  await fetch(`${API}/api/sessions/${session.id}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': accessToken
    },
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyMeters: coords.accuracy,
      source: 'browser',
      permissionGranted: true
    })
  });
});
```

## SOS

```ts
const response = await fetch(`${API}/api/sos/sessions/${session.id}/sos`, {
  method: 'POST',
  headers: { 'X-Session-Token': accessToken }
});
const { sos } = await response.json();
```

## Important responder separation

The responder interface should use:

```text
GET /api/responder/sos/:sosId/view
```

It should never receive the user's session access token.
