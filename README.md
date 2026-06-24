# Second Voice

A teen-friendly web app for saying what you mean. It has two sides:

- **Rephrase tool** (`index.html`) — paste a message and re-tone it (chill, kind, confident, apology, boundary, parent-safe, teacher-ready, and more) before you send it.
- **The Voice You Didn't Send** (`unsent.html`) — a quieter, notebook-style space to explore what you're actually feeling, with three features:
  - **Voice Split** — type a short reply (like "K") and unfold what you might mean, what you're afraid to say, and what future-you might say.
  - **Anonymous Echoes** — share a feeling and see you're not the only one who's felt it.
  - **Daily memory** — "What's something you didn't say today?"

There's also an **Age & Safety** page (`safety.html`) describing the privacy and child-safety approach.

## Running locally

This is a static app with a tiny zero-dependency Node server. The same
server also exposes the Anonymous Echoes API (`/api/echoes`).

```bash
npm start
```

Then open the URL the server prints (http://localhost:4173 by default). A
plain static host works too for the front end, but the Anonymous Echoes API
needs this Node server (or an equivalent) running.

## Validating

```bash
npm run build
```

This runs `scripts/validate-static-app.js`, which checks that the core files exist and the rephrase tool still defines its tones and key behaviours.

## Project structure

```
index.html              Rephrase tool (home)
unsent.html             The Voice You Didn't Send
safety.html             Age & safety notes
admin.html              Private moderation view for Echoes
src/main.js             Rephrase logic and tone definitions
src/unsent.js           Voice Split, Echoes, daily memory
src/admin.js            Moderation view logic
src/styles.css          Shared styles
sw.js                   Service worker (offline-first)
manifest.webmanifest    PWA manifest (installable)
icons/                  App icons (192 + 512, maskable)
server.js               Static server + Anonymous Echoes & admin API
```

## Progressive Web App

The app is installable and works offline. `manifest.webmanifest` defines the icons, theme, and a shortcut to the unsent page; `sw.js` caches the app shell.

## Privacy

The rephrase tool and the unsent page run entirely on the device — there are no accounts, and message content for those features never leaves the browser. "Anonymous Echoes" is the one feature that talks to a server: a small, privacy-first API in `server.js` accepts a short feeling, returns a fuzzed "how many felt this" count plus a few approved anonymous echoes, and queues new submissions as `pending` so nothing is shown to others until it passes moderation. It stores only the text, a derived topic, and timestamps — no accounts, IPs, or device IDs. If the API is unavailable the client falls back to local seeded echoes, so the page still works offline. See `docs/echoes-backend.md` for the full design.

## Before launch

`safety.html` still uses a clearly-labeled placeholder contact address that must be swapped for a real, monitored email before launch. Have counsel and child-safety reviewers validate the notices and flows. A minimal moderation view now ships at `admin.html`: set `ADMIN_TOKEN` to a long random secret in the server environment to enable it (while unset, the admin API is disabled and returns 503). That shared-secret gate is only a starting point — before real use, replace it with proper per-moderator authentication, add audit logging, and move the Anonymous Echoes store from the in-memory + JSON-file reference (`data/`) to durable, scalable storage.
