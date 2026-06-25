// Second Voice — private, no-login dashboard.
// Reads only this browser's localStorage. Nothing is sent anywhere.
(function () {
  'use strict';

  var KEYS = {
    improved: 'secondVoiceMessagesImproved',
    saved: 'secondVoiceSavedRephrases',
    dailyCount: 'secondVoice.unsent.dailyCount',
    echoes: 'secondVoice.unsent.echoes'
  };

  function readNumber(key) {
    var raw = localStorage.getItem(key);
    var n = parseInt(raw || '0', 10);
    return isNaN(n) ? 0 : n;
  }

  function readArray(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function status(message) {
    var el = document.getElementById('dashboard-status');
    if (el) el.textContent = message || '';
  }

  function renderStats(saved) {
    setText('stat-improved', readNumber(KEYS.improved));
    setText('stat-saved', saved.length);
    setText('stat-prompts', readNumber(KEYS.dailyCount));
  }

  function renderSaved(saved) {
    var list = document.getElementById('saved-list');
    var empty = document.getElementById('saved-empty');
    if (!list) return;
    list.textContent = '';

    if (!saved.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    saved.forEach(function (entry) {
      var item = document.createElement('li');
      item.className = 'saved-item';

      var tone = document.createElement('span');
      tone.className = 'saved-tone';
      tone.textContent = entry && entry.tone ? entry.tone : 'Saved';
      item.appendChild(tone);

      var rephrased = document.createElement('p');
      rephrased.className = 'saved-text';
      rephrased.textContent = entry && entry.text ? entry.text : '';
      item.appendChild(rephrased);

      if (entry && entry.original) {
        var original = document.createElement('p');
        original.className = 'saved-original';
        original.textContent = 'You wrote: ' + entry.original;
        item.appendChild(original);
      }

      list.appendChild(item);
    });
  }

  function render() {
    var saved = readArray(KEYS.saved);
    renderStats(saved);
    renderSaved(saved);
  }

  function exportData() {
    var payload = {
      exportedAt: new Date().toISOString(),
      app: 'Second Voice',
      messagesImproved: readNumber(KEYS.improved),
      unsentPromptsOpened: readNumber(KEYS.dailyCount),
      savedRephrasings: readArray(KEYS.saved),
      localEchoes: readArray(KEYS.echoes)
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'second-voice-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status('Exported a copy to your downloads.');
  }

  function clearData() {
    var ok = window.confirm(
      'Clear everything saved on this device? This removes your saved rephrasings and counts here. It cannot be undone.'
    );
    if (!ok) return;
    Object.keys(KEYS).forEach(function (k) {
      localStorage.removeItem(KEYS[k]);
    });
    render();
    status('Cleared. Nothing is saved on this device anymore.');
  }

  function init() {
    render();
    var exportBtn = document.getElementById('export-btn');
    var clearBtn = document.getElementById('clear-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (clearBtn) clearBtn.addEventListener('click', clearData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
