# Second Voice

A teen-friendly web app for saying what you mean. It has two sides:

- **Rephrase tool** (`index.html`) — paste a message and re-tone it (chill, kind, confident, apology, boundary, parent-safe, teacher-ready, and more) before you send it.
- **The Voice You Didn't Send** (`unsent.html`) — a quieter, notebook-style space to explore what you're actually feeling, with three features:
  - **Voice Split** — type a short reply (like "K") and unfold what you might mean, what you're afraid to say, and what future-you might say.
  - **Anonymous Echoes** — share a feeling and see you're not the only one who's felt it.
  - **Daily memory** — "What's something you didn't say today?"

There's also an **Age & Safety** page (`safety.html`) describing the privacy and child-safety approach.

## Running locally

This is a static app with a tiny zero-dependency Node server.

```bash
npm start
```

Then open http://localhost:3000 (the port the server prints). Any static file host works too — just serve the project root.

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
src/main.js             Rephrase logic and tone definitions
src/unsent.js           Voice Split, Echoes, daily memory
src/styles.css          Shared styles
sw.js                   Service worker (offline-first)
manifest.webmanifest    PWA manifest (installable)
icons/                  App icons (192 + 512, maskable)
server.js               Minimal static file server
```

## Progressive Web App

The app is installable and works offline. `manifest.webmanifest` defines the icons, theme, and a shortcut to the unsent page; `sw.js` caches the app shell.

## Privacy

Everything stays on the device — there are no accounts and no servers processing message content. The "Anonymous Echoes" counts and responses are currently illustrative companionship written into the app, not live user data. To make them real, add a backend to store and aggregate anonymous submissions.

## Before launch

A few placeholders in `safety.html` still need real values: the contact email (`REPLACE_WITH_REAL_EMAIL@example.com`) and the "Last updated" date (`REPLACE_WITH_DATE`). Have counsel and child-safety reviewers validate the notices and flows before scaling.
