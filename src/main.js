const tones = [
  { id: 'chill', accent: '#38bdf8', label: 'Chill', description: 'Easygoing and casual', opener: 'No stress,', closers: ['we can figure it out.', 'just wanted to be honest.'], emoji: ['🙂', '✨'], swaps: { cannot: "can't", 'do not': "don't", 'I need': 'I could use' } },
  { id: 'kind', accent: '#fbbf24', label: 'Kind', description: 'Warm without sounding intense', opener: 'I hear you, and', closers: ['I appreciate you understanding.', 'thanks for hearing me out.'], emoji: ['💛'], swaps: { mad: 'upset', hate: 'really do not like', annoyed: 'bothered' } },
  { id: 'confident', accent: '#a78bfa', label: 'Confident', description: 'Clear and direct', opener: 'To be clear,', closers: ['That is what works for me.', 'I wanted to say it directly.'], emoji: [], swaps: { maybe: '', 'I guess': '', kinda: '' } },
  { id: 'apology', accent: '#f472b6', label: 'Apology', description: 'Owns the moment and keeps it real', opener: 'I am sorry —', closers: ['I will try to handle it better next time.', 'I want to make it right.'], emoji: [], sensitive: true, swaps: { 'my bad': 'I am sorry', fault: 'responsibility' } },
  { id: 'boundary', accent: '#34d399', label: 'Boundary', description: 'Respectful but firm', opener: 'I need to be honest:', closers: ['Please respect that.', 'That boundary matters to me.'], emoji: [], sensitive: true, swaps: { 'I cannot': 'I am not able to', 'I can\'t': 'I am not able to' } },
  { id: 'funny', accent: '#facc15', label: 'Funny', description: 'Light, playful, and not too serious', opener: 'Plot twist:', closers: ['not dramatic, just true.', 'that is the vibe.'], emoji: ['😂', '😅'], swaps: { very: 'super', really: 'actually' } },
  { id: 'crush', accent: '#fb7185', label: 'Crush', description: 'Sweet without doing too much', opener: 'Low-key,', closers: ['I wanted you to know.', 'no pressure, just being honest.'], emoji: ['🙈', '✨'], swaps: { like: 'like talking to', cool: 'really easy to be around' } },
  { id: 'parent', accent: '#60a5fa', label: 'Parent-safe', description: 'Respectful for family conversations', opener: 'I understand, and', closers: ['I am trying to handle this responsibly.', 'I wanted to explain calmly.'], emoji: [], swaps: { gonna: 'going to', wanna: 'want to', yeah: 'yes' } },
  { id: 'teacher', accent: '#22d3ee', label: 'Teacher-ready', description: 'Polite enough for school', opener: 'Hi, I wanted to explain that', closers: ['Thank you for understanding.', 'I appreciate your help.'], emoji: [], swaps: { kid: 'student', stuff: 'work', gonna: 'going to' } },
  { id: 'bestie', accent: '#e879f9', label: 'Bestie', description: 'Close-friend energy', opener: 'Bestie, real talk:', closers: ['love you for getting it.', 'you know I mean it.'], emoji: ['💕', '🫶'], swaps: { friend: 'bestie', really: 'for real' } },
  { id: 'group-chat', accent: '#818cf8', label: 'Group Chat', description: 'Short and easy to send to everyone', opener: 'Quick update:', closers: ['drop thoughts when you can.', 'let me know what works.'], emoji: ['💬'], swaps: { everyone: 'y’all', people: 'everyone' } },
  { id: 'hype', accent: '#fb923c', label: 'Hype', description: 'More excited and supportive', opener: 'Okay YES —', closers: ['I am so here for this!', 'you have got this.'], emoji: ['🔥', '👏'], swaps: { good: 'amazing', nice: 'so good', happy: 'excited' } },
  { id: 'soft-no', accent: '#94a3b8', label: 'Soft No', description: 'Declines without sounding harsh', opener: 'Thank you for asking, but', closers: ['I hope you understand.', 'maybe another time.'], emoji: [], sensitive: true, swaps: { no: 'I am going to pass', cannot: "can't" } },
  { id: 'check-in', accent: '#5eead4', label: 'Check-in', description: 'Caring and low-pressure', opener: 'No pressure to answer fast, but', closers: ['I am here if you want to talk.', 'just checking in on you.'], emoji: ['🤍'], swaps: { okay: 'doing okay', sad: 'having a hard time' } },
  { id: 'fix-it', accent: '#4ade80', label: 'Fix It', description: 'Turns tension into a next step', opener: 'I want to fix this, so', closers: ['Can we talk about what would help next?', 'What can we do differently from here?'], emoji: [], swaps: { fight: 'argument', problem: 'issue', angry: 'upset' } },
];

const dailyPrompts = [
  'Tell a friend you need to reschedule without making it awkward.',
  'Ask someone if they are okay without sounding nosy.',
  'Set a boundary about needing alone time after school.',
  'Apologize for replying late but keep it casual.',
  'Hype up a friend who shared good news.',
  'Say no to plans while still being kind.',
  'Text a teacher that you need help understanding an assignment.',
];

const storageKeys = {
  messagesImproved: 'secondVoiceMessagesImproved',
  saved: 'secondVoiceSavedRephrases',
};

let selectedTone = tones[0];
let savedRephrases = loadSavedRephrases();

const messageInput = document.querySelector('#message');
const toneGrid = document.querySelector('#tone-grid');
const output = document.querySelector('#output');
const selectedToneLabel = document.querySelector('#selected-tone-label');
const copyButton = document.querySelector('#copy-button');
const saveButton = document.querySelector('#save-button');
const randomToneButton = document.querySelector('#random-tone-button');
const clearButton = document.querySelector('#clear-button');
const compareButton = document.querySelector('#compare-button');
const messagesImprovedCount = document.querySelector('#messages-improved-count');
const dailyPrompt = document.querySelector('#daily-prompt');
const savedList = document.querySelector('#saved-list');
const safetyNote = document.querySelector('#safety-note');
const clipboardFallback = document.querySelector('#clipboard-fallback');
const characterCount = document.querySelector('#character-count');
const comparePanel = document.querySelector('#compare-panel');
const statusMessage = document.querySelector('#status-message');

function cleanInput(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function sentenceCase(text) {
  const trimmed = cleanInput(text).replace(/[.!?]+$/, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function applyContractions(text) {
  const contractions = {
    'cannot': "can't",
    'can not': "can't",
    'I am': "I'm",
    'I will': "I'll",
    'I would': "I'd",
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'that is': "that's",
    'it is': "it's",
    'you are': "you're",
    'we are': "we're",
  };

  return Object.entries(contractions).reduce((rewritten, [from, to]) => {
    return rewritten.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
  }, text);
}

function applySwaps(text, swaps = {}) {
  return Object.entries(swaps).reduce((rewritten, [from, to]) => {
    return rewritten.replace(new RegExp(`\\b${from}\\b`, 'gi'), to).replace(/\s+/g, ' ').trim();
  }, text);
}

function restructureSentence(text, tone) {
  const base = sentenceCase(applySwaps(applyContractions(text), tone.swaps));
  const lower = base.charAt(0).toLowerCase() + base.slice(1);

  const patterns = [
    { match: /^(I|I'm|I am|I can't|I cannot) (.+) because (.+)$/i, build: ([, subject, action, reason]) => `because ${reason}, ${subject} ${action}` },
    { match: /^(.+) but (.+)$/i, build: ([, first, second]) => `${second}, even though ${first.charAt(0).toLowerCase() + first.slice(1)}` },
    { match: /^Can you (.+)$/i, build: ([, ask]) => `would you be able to ${ask.charAt(0).toLowerCase() + ask.slice(1)}` },
    { match: /^Why (.+)$/i, build: ([, question]) => `I am trying to understand why ${question.charAt(0).toLowerCase() + question.slice(1)}` },
  ];

  const pattern = patterns.find(({ match }) => match.test(base));
  if (pattern) {
    return sentenceCase(base.replace(pattern.match, (...parts) => pattern.build(parts)));
  }

  if (tone.id === 'soft-no') return `I am going to pass on this, but I appreciate the invite`;
  if (tone.id === 'check-in') return `I was thinking about you and wanted to see how you are doing`;
  if (tone.id === 'fix-it') return `I want us to move forward instead of staying stuck on this`;
  return lower.length > 80 ? `what I mean is ${lower}` : `I wanted to say that ${lower}`;
}

function pickToneEmoji(tone, rewritten) {
  if (!tone.emoji?.length || rewritten.length > 140) return '';
  return Math.random() > 0.55 ? ` ${tone.emoji[Math.floor(Math.random() * tone.emoji.length)]}` : '';
}

function rephrase(text, tone) {
  const cleaned = cleanInput(text);

  if (!cleaned) {
    return 'Start with a few words you want help saying — we’ll keep it kind and clear.';
  }

  const rewritten = restructureSentence(cleaned, tone);
  const closer = tone.closers[Math.floor(Math.random() * tone.closers.length)];
  return `${tone.opener} ${rewritten}. ${closer}${pickToneEmoji(tone, rewritten)}`;
}

function renderMessagesImproved() {
  messagesImprovedCount.textContent = String(Number(localStorage.getItem(storageKeys.messagesImproved)) || 0);
}

function countImprovedMessage() {
  const nextCount = (Number(localStorage.getItem(storageKeys.messagesImproved)) || 0) + 1;
  localStorage.setItem(storageKeys.messagesImproved, String(nextCount));
  renderMessagesImproved();
}

function renderDailyPrompt() {
  const dayIndex = Math.floor(Date.now() / 86400000) % dailyPrompts.length;
  dailyPrompt.textContent = dailyPrompts[dayIndex];
}

function loadSavedRephrases() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.saved)) || [];
  } catch {
    return [];
  }
}

function persistSavedRephrases() {
  localStorage.setItem(storageKeys.saved, JSON.stringify(savedRephrases.slice(0, 5)));
}

function renderSavedRephrases() {
  savedList.innerHTML = '';

  if (savedRephrases.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'saved-empty-card';
    emptyItem.textContent = 'No saved quick-sends yet — save a favorite rephrase when one feels right.';
    savedList.append(emptyItem);
    return;
  }

  savedRephrases.forEach((saved) => {
    const item = document.createElement('li');
    const toneName = document.createElement('strong');
    const savedText = document.createElement('span');
    toneName.textContent = saved.tone;
    savedText.textContent = saved.text;
    item.append(toneName, savedText);
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Load saved ${saved.tone} rephrase`);
    const loadSaved = () => {
      messageInput.value = saved.original;
      selectedTone = tones.find((tone) => tone.label === saved.tone) || selectedTone;
      renderToneButtons();
      updateOutput();
    };
    item.addEventListener('click', loadSaved);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        loadSaved();
      }
    });
    savedList.append(item);
  });
}

function saveCurrentRephrase() {
  const text = output.textContent;
  if (!cleanInput(messageInput.value)) {
    announce('Type a message before saving.');
    return;
  }

  if (savedRephrases.some((saved) => saved.text === text)) {
    announce('That rephrase is already saved.');
    return;
  }

  savedRephrases.unshift({ original: messageInput.value, text, tone: selectedTone.label });
  savedRephrases = savedRephrases.slice(0, 5);
  persistSavedRephrases();
  renderSavedRephrases();
  countImprovedMessage();
  announce('Saved favorite rephrase.');
  saveButton.textContent = 'Saved!';
  window.setTimeout(() => { saveButton.textContent = 'Save fave'; }, 1600);
}

function renderToneButtons() {
  toneGrid.innerHTML = '';

  tones.forEach((tone) => {
    const button = document.createElement('button');
      const isSelected = tone.id === selectedTone.id;
      button.className = isSelected ? 'tone-card active' : 'tone-card';    
      button.type = 'button';
      button.setAttribute('aria-pressed', String(isSelected));
      button.style.setProperty('--tone-accent', tone.accent || 'var(--blue)');
    const emoji = document.createElement('span');
    emoji.className = 'tone-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = (tone.emoji && tone.emoji[0]) || '✨';
    const label = document.createElement('span');
    label.className = 'tone-label';
    label.textContent = tone.label;
    const description = document.createElement('small');
    description.className = 'tone-description';
    description.textContent = tone.description;
    button.append(emoji, label, description);
    button.addEventListener('click', () => {
      selectedTone = tone;
      renderToneButtons();
      updateOutput();
      revealOutput();
      announce(`${tone.label} tone selected.`);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        button.click();
      }
    });
    toneGrid.append(button);
  });
}

function updateSafetyNote() {
  const adultNote = selectedTone.sensitive
    ? ' For sensitive stuff, this can help with words, but it does not replace talking to a trusted adult if you feel unsafe, pressured, or overwhelmed.'
    : '';
  safetyNote.textContent = `Writing helper only: read your message before sending. Everything stays on this device and works offline; nothing is sent anywhere.${adultNote}`;
}

function updateCharacterCount() {
  characterCount.textContent = String(messageInput.value.length);
}

function updateOutput() {
  const hasMessage = Boolean(cleanInput(messageInput.value));
  selectedToneLabel.textContent = selectedTone.label;
  output.textContent = rephrase(messageInput.value, selectedTone);
  output.classList.toggle('output-placeholder', !hasMessage);
  updateSafetyNote();
  updateCharacterCount();
  renderComparison(false);
}

function revealOutput() {
  if (!cleanInput(messageInput.value)) {
    return;
  }
  output.scrollIntoView({ behavior: 'smooth', block: 'center' });
  output.classList.remove('output-flash');
  void output.offsetWidth;
  output.classList.add('output-flash');
}

function chooseRandomTone() {
  const otherTones = tones.filter((tone) => tone.id !== selectedTone.id);
  selectedTone = otherTones[Math.floor(Math.random() * otherTones.length)];
  renderToneButtons();
  updateOutput();
    revealOutput();
  announce(`${selectedTone.label} tone selected.`);
}

function clearInput() {
  messageInput.value = '';
  updateOutput();
  messageInput.focus();
  announce('Message cleared.');
}

function renderComparison(forceOpen = true) {
  if (forceOpen) {
    comparePanel.dataset.open = 'true';
  }

  if (comparePanel.dataset.open !== 'true') {
    comparePanel.innerHTML = '';
    return;
  }

  const comparisonTones = [selectedTone, ...tones.filter((tone) => tone.id !== selectedTone.id).slice(0, 2)];
  comparePanel.innerHTML = '';
  comparisonTones.forEach((tone) => {
    const card = document.createElement('article');
    const title = document.createElement('h3');
    const copy = document.createElement('p');
    card.className = 'compare-card';
    title.textContent = tone.label;
    copy.textContent = rephrase(messageInput.value, tone);
    card.append(title, copy);
    comparePanel.append(card);
  });
  announce('Showing tone comparison.');
}

function announce(message) {
  statusMessage.textContent = message;
}

function showCopyStatus(message) {
  announce(message === 'Copied!' ? 'Copied rephrased message.' : 'Manual copy field is ready.');
  copyButton.textContent = message;
  window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 1800);
}

async function copyOutput() {
  const text = output.textContent;
  clipboardFallback.value = text;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      countImprovedMessage();
      showCopyStatus('Copied!');
      return;
    } catch {
      // Fall through to the offline-friendly manual copy helper below.
    }
  }

  clipboardFallback.hidden = false;
  countImprovedMessage();
  clipboardFallback.focus();
  clipboardFallback.select();
  showCopyStatus('Select + copy');
}

messageInput.addEventListener('input', updateOutput);
copyButton.addEventListener('click', copyOutput);
saveButton.addEventListener('click', saveCurrentRephrase);
randomToneButton.addEventListener('click', chooseRandomTone);
clearButton.addEventListener('click', clearInput);
compareButton.addEventListener('click', () => renderComparison(true));

renderMessagesImproved();
renderDailyPrompt();
renderSavedRephrases();
renderToneButtons();
updateOutput();
