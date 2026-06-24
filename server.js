const http = require('node:http');
const { createReadStream, existsSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { extname, join, normalize, dirname } = require('node:path');

const port = process.env.PORT || 4173;
const root = process.cwd();
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
};

/* ----------------------------- Anonymous Echoes API -----------------------------
 * A small, dependency-free, privacy-first backend.
 * - No accounts, no IPs, no device ids stored alongside text.
 * - Submissions are queued as 'pending' and are NOT shown to others until
 *   they pass the simple safety filters (auto-approve) or a human approves them.
 * - Public counts are fuzzed so no one can be singled out.
 * See docs/echoes-backend.md for the full design.
 * -------------------------------------------------------------------------------- */

const DATA_DIR = join(root, 'data');
const DATA_FILE = join(DATA_DIR, 'echoes.json');

// Seed echoes so the feature feels alive on a fresh install. These are the same
// human-written samples the client falls back to offline. status: 'approved'.
const SEED = [
  { topic: 'general', text: 'honestly same. some days are just like this.', status: 'approved' },
  { topic: 'left-on-read', text: 'ok the texting first thing... yeah. all the time.', status: 'approved' },
  { topic: 'left-out', text: "felt this so hard today. kinda glad it's not just me.", status: 'approved' },
  { topic: 'general', text: 'i never say it out loud but yeah. exactly this.', status: 'approved' },
  { topic: 'general', text: 'going through it rn too. we got this i guess.', status: 'approved' },
];

function loadStore() {
  try {
    if (existsSync(DATA_FILE)) return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.warn('echoes store unreadable, starting fresh:', err.message);
  }
  return { echoes: SEED.slice(), monthBase: {} };
}

function saveStore(store) {
  try {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.warn('could not persist echoes store:', err.message);
  }
}

let store = loadStore();

// Cluster a feeling into a coarse topic by keyword. Intentionally fuzzy.
const TOPIC_RULES = [
  { topic: 'left-on-read', re: /\b(left on read|read receipt|seen|ignored|no reply|didn'?t (text|reply) back)\b/i },
  { topic: 'left-out', re: /\b(left out|friend group|everyone else|no one (texts|invites)|excluded|alone)\b/i },
  { topic: 'crush', re: /\b(crush|like (him|her|them)|reread|butterflies)\b/i },
  { topic: 'fight', re: /\b(fight|argument|mad at|i'?m fine|hurt|don'?t know how to say)\b/i },
];

function classifyTopic(text) {
  for (const rule of TOPIC_RULES) if (rule.re.test(text)) return rule.topic;
  return 'general';
}

// Hard safety filters. Returns { ok, reason }.
const URL_RE = /(https?:\/\/|www\.|\.(com|net|org|io|gg)\b)/i;
const CONTACT_RE = /(@[a-z0-9_.]+|\b\d[\d\s().-]{6,}\d\b|[a-z0-9.]+@[a-z0-9.]+)/i;
const SELF_HARM_RE = /\b(kill myself|suicide|end it all|self ?harm|want to die)\b/i;

function screen(text) {
  const t = text.trim();
  if (t.length < 2) return { ok: false, reason: 'too-short' };
  if (t.length > 280) return { ok: false, reason: 'too-long' };
  if (SELF_HARM_RE.test(t)) return { ok: false, reason: 'crisis' };
  if (URL_RE.test(t)) return { ok: false, reason: 'link' };
  if (CONTACT_RE.test(t)) return { ok: false, reason: 'contact-info' };
  return { ok: true };
}

// Deterministic-ish fuzzed count so the same feeling feels consistent month to month,
// but never reveals an exact, attributable number.
function feltCount(topic) {
  const approved = store.echoes.filter((e) => e.topic === topic && e.status === 'approved').length;
  let hash = 0;
  for (let i = 0; i < topic.length; i += 1) hash = (hash * 31 + topic.charCodeAt(i)) % 100000;
  const base = 800 + (hash % 6200);
  const raw = base + approved * 7;
  return Math.round(raw / 100) * 100; // round to nearest 100
}

function approvedEchoes(topic, limit) {
  const pool = store.echoes.filter((e) => e.status === 'approved' && (e.topic === topic || topic === 'general'));
  const list = pool.length ? pool : store.echoes.filter((e) => e.status === 'approved');
  return list
    .map((e) => e.text)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit || 3);
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = '';
    let tooBig = false;
    request.on('data', (chunk) => {
      data += chunk;
      if (data.length > 4096) { tooBig = true; request.destroy(); }
    });
    request.on('end', () => (tooBig ? reject(new Error('payload-too-large')) : resolve(data)));
    request.on('error', reject);
  });
}

async function handleEchoesApi(request, response, url) {
  if (request.method === 'GET') {
    const topic = url.searchParams.get('topic') || 'general';
    sendJson(response, 200, { topic, feltCount: feltCount(topic), echoes: approvedEchoes(topic) });
    return;
  }

  if (request.method === 'POST') {
    let text = '';
    try {
      const body = await readBody(request);
      text = String((JSON.parse(body || '{}').text) || '');
    } catch (err) {
      sendJson(response, 400, { error: 'bad-request' });
      return;
    }

    const verdict = screen(text);
    const topic = classifyTopic(text);

    // Always respond with companionship, even if we cannot publish the text.
    const payload = { topic, feltCount: feltCount(topic), echoes: approvedEchoes(topic) };

    if (verdict.ok) {
      // Queue as pending. Nothing is shown to others until moderation approves it.
      store.echoes.push({ topic, text: text.trim(), status: 'pending', createdAt: Date.now() });
      saveStore(store);
    } else if (verdict.reason === 'crisis') {
      payload.support = 'If you are in crisis, please reach out to someone you trust or a local helpline. You are not alone.';
    }

    sendJson(response, 200, payload);
    return;
  }

  sendJson(response, 405, { error: 'method-not-allowed' });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/api/echoes') {
    handleEchoesApi(request, response, url).catch(() => sendJson(response, 500, { error: 'server-error' }));
    return;
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'text/plain' });
  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Second Voice running on http://localhost:${port}`);
});
