# Anonymous Echoes — Backend Design Sketch

This document sketches how to turn **Anonymous Echoes** from the current
local/illustrative demo into a real, privacy-first community feature.

> Status: implemented. A working, dependency-free reference version of this
> API ships in `server.js` (`POST /api/echoes` and `GET /api/echoes?topic=`),
> and the client (`src/unsent.js`) calls it with `ECHOES_API = '/api/echoes'`,
> falling back to local seeded echoes when offline. The notes below describe
> the design; harden moderation and storage before any real launch.

## Goals

- Let a user submit a short feeling and see (a) roughly how many other
  people felt something similar and (b) a few short, anonymous echoes
  from real people.
- Make people feel less alone — not create a social network.
- Collect as little personal data as possible. No accounts, no profiles,
  no public identities, no DMs, no follower counts.

## Non-goals

- No comments threads, likes, replies, or any reply-to-a-person feature.
- No real-time chat.
- No storing anything that can identify a specific minor.

## Data model

Two core tables.

### echoes
| field        | type      | notes                                        |
|--------------|-----------|----------------------------------------------|
| id          | uuid      | primary key                                  |
| text        | text      | the submitted feeling, max ~280 chars        |
| topic       | text      | derived cluster label (e.g. "left on read")  |
| status      | enum      | pending / approved / rejected                |
| created_at  | timestamp | server time only                             |
| lang        | text      | detected language code                       |

### topic_counts
| field        | type      | notes                                        |
|--------------|-----------|----------------------------------------------|
| topic       | text      | primary key                                  |
| count       | integer   | how many approved echoes in this topic       |
| month       | text      | YYYY-MM bucket for the "this month" number   |

We intentionally do NOT store IP address, device id, user id, geolocation,
or any session token alongside the text. Rate limiting (below) uses a
short-lived, hashed token that is never written to the echoes table.

## API endpoints

```
POST /api/echoes
  body: { text: string }
  -> { topic: string, feltCount: number, echoes: string[] }
  Submits a feeling. Returns the matched topic, an approximate count,
  and up to 3 approved echoes from the same topic. The submitted text
  is queued as "pending" and is NOT shown to others until it clears
  moderation.

GET /api/echoes?topic=...
  -> { feltCount: number, echoes: string[] }
  Fetches approved echoes for a topic (e.g. when re-opening the page).
```

Counts returned to the client are rounded/fuzzed (e.g. nearest 100) so
no one can infer that they were the single Nth submitter.

## Moderation (the hard part)

Because the audience skews young, every echo must clear moderation
before any other user can see it. Suggested layered approach:

1. **Hard filters at submit time** — reject obvious self-harm crisis
   language, contact info (phone/email/handles), URLs, slurs, and
   sexual content. On self-harm signals, do not publish; instead
   return crisis-support resources (this ties into safety.html).
2. **Automated classification** — score remaining text for safety,
   PII, and topic. Auto-approve only high-confidence safe + generic
   items; route anything uncertain to a human queue.
3. **Human review queue** — a simple admin view listing "pending"
   echoes with approve/reject buttons. Nothing reaches other users
   without passing this gate at launch.
4. **Report path** — even approved echoes get a lightweight "this
   doesn't belong here" report link that re-queues them.

## Privacy & safety commitments

- No accounts means no login data to leak.
- Store only the text + derived topic + timestamps. No identifiers.
- Fuzz public counts; never expose exact ordering.
- Honor a data-minimization / retention policy (e.g. auto-delete raw
  pending submissions that are rejected after N days).
- Keep this consistent with the COPPA / age-appropriate notes in
  safety.html before going live.

## Minimal implementation path

A small step-up from the current static app:

1. Stand up a tiny serverless function (e.g. a single edge function)
   backed by a managed database table.
2. Implement `POST /api/echoes` with the hard filters + auto/queue logic.
3. Build a one-page private admin moderation view (behind real auth).
4. Swap the client's seeded `echoResponses` for a `fetch()` to the API,
   keeping the existing seeded samples as an offline fallback so the
   feature still works with no network (matches the PWA/offline goal).
5. Add abuse rate-limiting via a hashed, ephemeral token.

A working reference of steps 1-2 now lives in `server.js` (in-memory + a
JSON file under `data/`, with `pending` moderation status, hard input
filters, topic clustering, and fuzzed counts). Step 3 (a real human
moderation UI behind authentication) and durable, scalable storage are
still required before launch. The client keeps the seeded samples as an
offline fallback, so the feature degrades gracefully with no network.
