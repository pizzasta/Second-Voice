const { accessSync, readFileSync } = require('node:fs');

const requiredFiles = ['index.html', 'src/main.js', 'src/styles.css'];

for (const file of requiredFiles) {
  accessSync(file);
}

const html = readFileSync('index.html', 'utf8');
const script = readFileSync('src/main.js', 'utf8');

if (!html.includes('Second Voice')) {
  throw new Error('index.html must include the app name.');
}

if (!script.includes('const tones')) {
  throw new Error('src/main.js must define tone options.');
}

const toneCount = (script.match(/id: '/g) || []).length;
if (toneCount < 15) {
  throw new Error(`Expected at least 15 tone options, found ${toneCount}.`);
}

for (const marker of ['dailyPrompts', 'secondVoiceSavedRephrases', 'secondVoiceMessagesImproved', 'restructureSentence', 'navigator.clipboard', 'Everything stays on this device', 'status-message', 'compare-panel', 'clear-button']) {
  if (!script.includes(marker)) {
    throw new Error(`src/main.js must include retention marker: ${marker}.`);
  }
}

console.log('Static app validation passed.');
