// The Voice You Didn't Send — interactions
// A quiet, local-only space. Nothing here is sent anywhere; everything stays
// in this browser. The "echo" counts are illustrative companionship, not real data.

const storageKeys = {
  dailyCount: 'secondVoice.unsent.dailyCount',
  echoes: 'secondVoice.unsent.echoes',
};

function readNumber(key) {
  const value = Number.parseInt(window.localStorage.getItem(key) || '0', 10);
  return Number.isFinite(value) ? value : 0;
}

/* ----------------------------- Daily memory ----------------------------- */

const dailyInput = document.getElementById('daily-input');
const dailySave = document.getElementById('daily-save');
const dailyCollected = document.getElementById('daily-collected');

function renderDailyCollected() {
  const count = readNumber(storageKeys.dailyCount);
  if (count <= 0) {
    dailyCollected.textContent = '';
    return;
  }
  const noun = count === 1 ? 'memory' : 'memories';
  dailyCollected.textContent = 'You\'ve kept ' + count + ' ' + noun + ' so far. Some things only need to be said to yourself.';
}

if (dailySave) {
  dailySave.addEventListener('click', () => {
    const text = (dailyInput.value || '').trim();
    if (!text) {
      dailyCollected.textContent = 'Even a few words count. Write the thing you didn\'t say.';
      return;
    }
    const next = readNumber(storageKeys.dailyCount) + 1;
    window.localStorage.setItem(storageKeys.dailyCount, String(next));
    dailyInput.value = '';
    renderDailyCollected();
  });
}

/* ------------------------------ Voice Split ----------------------------- */

const splitInput = document.getElementById('split-input');
const splitGo = document.getElementById('split-go');
const splitClear = document.getElementById('split-clear');
const splitGrid = document.getElementById('split-grid');

// Known short replies map to hand-written interpretations.
const splitLibrary = {
  k: { mean: 'I\'m a little annoyed.', fear: 'I feel ignored.', future: 'Can we talk about this?' },
  ok: { mean: 'I\'m not really okay with it.', fear: 'I wish you\'d asked how I felt.', future: 'I\'d like to talk it through.' },
  lol: { mean: 'I\'m playing it cool.', fear: 'I\'ve reread this six times.', future: 'I actually really like talking to you.' },
  'i\'m fine': { mean: 'I\'m not fine.', fear: 'I\'m hurt and don\'t know how to say it.', future: 'Something\'s bothering me and I want to share it.' },
  'im fine': { mean: 'I\'m not fine.', fear: 'I\'m hurt and don\'t know how to say it.', future: 'Something\'s bothering me and I want to share it.' },
  whatever: { mean: 'I do care, a lot.', fear: 'I was actually excited to hear from you.', future: 'It mattered to me. Can we start over?' },
  fine: { mean: 'I\'m holding something back.', fear: 'I\'d like you to notice I\'m upset.', future: 'I\'m not okay and I\'d like to talk.' },
  nvm: { mean: 'It still matters to me.', fear: 'I\'m scared it\'ll be a big deal.', future: 'It\'s important. Can we come back to it?' },
  'no worries': { mean: 'I am a bit worried.', fear: 'I don\'t want to seem difficult.', future: 'It\'s okay, but I\'d like to understand what happened.' },
  sure: { mean: 'I\'m not sure at all.', fear: 'I don\'t want to disappoint you.', future: 'Can we figure out what actually works for me too?' },
};

function interpret(raw) {
  const key = raw.toLowerCase().replace(/[.!?]+$/g, '').trim();
  if (splitLibrary[key]) return splitLibrary[key];
  // Generic fallback for anything not in the library.
  return {
    mean: 'There\'s more here than the words show.',
    fear: 'You\'re holding back how you really feel.',
    future: 'Maybe: "Can we talk about how I\'m actually feeling?"',
  };
}

function makeLayer(extraClass, tag, text, delay) {
  const layer = document.createElement('div');
  layer.className = 'layer ' + extraClass;
  layer.style.animationDelay = delay + 'ms';
  const tagEl = document.createElement('span');
  tagEl.className = 'tag';
  tagEl.textContent = tag;
  const textEl = document.createElement('p');
  textEl.className = 'text';
  textEl.textContent = text;
  layer.appendChild(tagEl);
  layer.appendChild(textEl);
  return layer;
}

function renderSplit() {
  const raw = (splitInput.value || '').trim();
  splitGrid.innerHTML = '';
  if (!raw) {
    const hint = makeLayer('said', 'Try it', 'Type something short, like "K", then unfold it.', 0);
    splitGrid.appendChild(hint);
    return;
  }
  const layers = interpret(raw);
  splitGrid.appendChild(makeLayer('said', 'What You Said', raw, 0));
  splitGrid.appendChild(makeLayer('mean', 'What You Might Mean', layers.mean, 90));
  splitGrid.appendChild(makeLayer('fear', 'What You\'re Afraid To Say', layers.fear, 180));
  splitGrid.appendChild(makeLayer('future', 'What Future You Might Say', layers.future, 270));
}

if (splitGo) {
  splitGo.addEventListener('click', renderSplit);
  splitInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') renderSplit();
  });
}
if (splitClear) {
  splitClear.addEventListener('click', () => {
    splitInput.value = '';
    splitGrid.innerHTML = '';
  });
}

/* --------------------------- Anonymous Echoes --------------------------- */

const echoInput = document.getElementById('echo-input');
const echoGo = document.getElementById('echo-go');
const echoCount = document.getElementById('echo-count');
const echoList = document.getElementById('echo-list');

// Real-sounding notes from other people, written in. Not live, not comments.
const echoResponses = [
  'honestly same. some days are just like this.',
  'me too lol. didn\'t think anyone else would say it.',
  'ok the texting first thing... yeah. all the time.',
  'felt this so hard today. kinda glad it\'s not just me.',
  'i never say it out loud but yeah. exactly this.',
  'going through it rn too. we got this i guess.',
];

// Deterministic "how many felt this" number so the same feeling feels consistent.
function feltCount(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return 800 + (hash % 6200);
}

// Optional real backend for Anonymous Echoes. Leave null to stay fully
// local/offline. See docs/echoes-backend.md for the proposed API shape.
const ECHOES_API = null; // e.g. '/api/echoes'

function pickLocalEchoes() {
  return echoResponses.slice().sort(() => Math.random() - 0.5).slice(0, 3);
}

function localEchoes(raw) {
  return { count: feltCount(raw.toLowerCase()), echoes: pickLocalEchoes() };
}

// Try a real backend if one is configured; otherwise (or on any failure,
// timeout, or offline) fall back to the local seeded echoes so the page
// always works. Nothing is sent anywhere while ECHOES_API is null.
async function fetchEchoes(raw) {
  if (!ECHOES_API) return localEchoes(raw);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(ECHOES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: raw }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('bad status ' + res.status);
    const data = await res.json();
    const count = typeof data.feltCount === 'number' ? data.feltCount : feltCount(raw.toLowerCase());
    const echoes = Array.isArray(data.echoes) && data.echoes.length ? data.echoes.slice(0, 3) : pickLocalEchoes();
    return { count, echoes };
  } catch (err) {
    return localEchoes(raw);
  }
}

async function renderEchoes() {
  const raw = (echoInput.value || '').trim();
  if (!raw) {
    echoCount.classList.remove('hidden');
    echoCount.textContent = 'Whenever you\'re ready. Even a small feeling counts.';
    echoList.innerHTML = '';
    return;
  }
  const { count, echoes } = await fetchEchoes(raw);
  echoCount.classList.remove('hidden');
  echoCount.textContent = count.toLocaleString() + ' people felt this this month.';
  echoList.innerHTML = '';
  echoes.forEach((response, index) => {
    const echo = document.createElement('div');
    echo.className = 'echo';
    echo.style.animationDelay = (index * 120) + 'ms';
    echo.textContent = '"' + response + '"';
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = 'Anonymous · sometime this month';
    echo.appendChild(meta);
    echoList.appendChild(echo);
  });
}

if (echoGo) {
  echoGo.addEventListener('click', renderEchoes);
  echoInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') renderEchoes();
  });
}

/* -------------------------- Floating ambience --------------------------- */

const floatingHost = document.getElementById('floating-bubbles');
const ambientPhrases = [
  'I was actually excited to hear from you.',
  'I\'m hurt and don\'t know how to say it.',
  'I\'ve reread this six times.',
  'Can we talk about this?',
  'I miss how it used to be.',
  'I\'m proud of you, I just never said it.',
  'I didn\'t mean what I texted.',
];

function spawnBubbles() {
  if (!floatingHost) return;
  ambientPhrases.forEach((phrase, index) => {
    const bubble = document.createElement('span');
    bubble.textContent = phrase;
    bubble.style.left = (8 + (index * 13) % 84) + '%';
    bubble.style.animationDuration = (22 + (index % 5) * 6) + 's';
    bubble.style.animationDelay = (index * 3.5) + 's';
    floatingHost.appendChild(bubble);
  });
}

/* -------------------------------- Init ---------------------------------- */

renderDailyCollected();
spawnBubbles();
