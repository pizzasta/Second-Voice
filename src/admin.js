// Moderation view logic for Anonymous Echoes.
// The admin token is kept only in memory for this page session and sent as
// the 'x-admin-token' header. It is never written to storage by this script.

const tokenInput = document.getElementById('admin-token');
const loadButton = document.getElementById('admin-load');
const statusEl = document.getElementById('mod-status');
const listEl = document.getElementById('mod-list');

let token = '';

function setStatus(message) {
  statusEl.textContent = message || '';
}

function authHeaders(extra) {
  return Object.assign({ 'x-admin-token': token }, extra || {});
}

async function loadPending() {
  token = (tokenInput.value || '').trim();
  if (!token) {
    setStatus('Enter the admin token first.');
    return;
  }
  setStatus('Loading pending echoes...');
  listEl.innerHTML = '';
  try {
    const res = await fetch('/api/admin/echoes', { headers: authHeaders() });
    if (res.status === 401) { setStatus('That token was not accepted.'); return; }
    if (res.status === 503) { setStatus('Moderation is disabled: set ADMIN_TOKEN on the server.'); return; }
    if (!res.ok) { setStatus('Could not load (error ' + res.status + ').'); return; }
    const data = await res.json();
    render(data.pending || []);
  } catch (err) {
    setStatus('Network error. Is the server running?');
  }
}

function render(pending) {
  listEl.innerHTML = '';
  if (!pending.length) {
    setStatus('Nothing pending. You are all caught up.');
    return;
  }
  setStatus(pending.length + ' pending to review.');
  pending.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'echo';

    const text = document.createElement('p');
    text.className = 'echo-text';
    text.textContent = item.text;
    card.appendChild(text);

    const meta = document.createElement('span');
    meta.className = 'meta';
    const when = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'unknown time';
    meta.textContent = 'topic: ' + item.topic + ' \u00b7 ' + when;
    card.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'mod-actions';

    const approve = document.createElement('button');
    approve.type = 'button';
    approve.textContent = 'Approve';
    approve.addEventListener('click', () => moderate(item.id, 'approve', card));

    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'secondary';
    reject.textContent = 'Reject';
    reject.addEventListener('click', () => moderate(item.id, 'reject', card));

    actions.appendChild(approve);
    actions.appendChild(reject);
    card.appendChild(actions);
    listEl.appendChild(card);
  });
}

async function moderate(id, action, card) {
  try {
    const res = await fetch('/api/admin/echoes/' + action, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { setStatus('Could not ' + action + ' (error ' + res.status + ').'); return; }
    card.remove();
    const remaining = listEl.querySelectorAll('.echo').length;
    setStatus(remaining ? remaining + ' pending to review.' : 'Nothing pending. You are all caught up.');
  } catch (err) {
    setStatus('Network error while trying to ' + action + '.');
  }
}

if (loadButton) loadButton.addEventListener('click', loadPending);
if (tokenInput) {
  tokenInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loadPending();
  });
}
