// ============================================================
//  BeyMarket – messages.js  v1.0
//  Sistema di messaggistica privata tra utenti
//  Usa localStorage in Demo Mode; Supabase in produzione
// ============================================================

const MSG_STORE_KEY = 'beymarket_messages';
const MSG_READ_KEY  = 'beymarket_messages_read';

// ════════════════════════════════════════════════════════════
//  STRUTTURA MESSAGGIO
//  { id, fromId, fromEmail, toId, toEmail, text, ts, read }
// ════════════════════════════════════════════════════════════

function _allMessages() {
  try {
    return JSON.parse(localStorage.getItem(MSG_STORE_KEY) || '[]');
  } catch { return []; }
}

function _saveMessages(msgs) {
  localStorage.setItem(MSG_STORE_KEY, JSON.stringify(msgs));
}

// ════════════════════════════════════════════════════════════
//  THREAD ID  (ordine alfabetico per consistenza)
// ════════════════════════════════════════════════════════════
function threadId(idA, idB) {
  return [idA, idB].sort().join('::');
}

// ════════════════════════════════════════════════════════════
//  INVIO MESSAGGIO
// ════════════════════════════════════════════════════════════
function sendMessage(toId, toEmail, text) {
  const me = window.BeyAuth?.getUser();
  if (!me) return false;
  text = (text || '').trim();
  if (!text) return false;

  const msgs = _allMessages();
  msgs.push({
    id:        Date.now() + '-' + Math.random().toString(36).slice(2),
    threadId:  threadId(me.id, toId),
    fromId:    me.id,
    fromEmail: me.email,
    toId,
    toEmail,
    text,
    ts:        Date.now(),
    read:      false,
  });
  _saveMessages(msgs);
  _dispatchUnreadUpdate();
  return true;
}

// ════════════════════════════════════════════════════════════
//  LETTURA MESSAGGI
// ════════════════════════════════════════════════════════════
function getThread(otherUserId) {
  const me = window.BeyAuth?.getUser();
  if (!me) return [];
  const tid = threadId(me.id, otherUserId);
  return _allMessages()
    .filter(m => m.threadId === tid)
    .sort((a, b) => a.ts - b.ts);
}

// Tutti i thread dell'utente corrente (ultimo messaggio per thread)
function getInbox() {
  const me = window.BeyAuth?.getUser();
  if (!me) return [];
  const msgs = _allMessages().filter(m => m.fromId === me.id || m.toId === me.id);
  const byThread = {};
  msgs.forEach(m => {
    if (!byThread[m.threadId] || m.ts > byThread[m.threadId].ts) {
      byThread[m.threadId] = m;
    }
  });
  return Object.values(byThread).sort((a, b) => b.ts - a.ts);
}

// ════════════════════════════════════════════════════════════
//  MESSAGGI NON LETTI
// ════════════════════════════════════════════════════════════
function getUnreadCount() {
  const me = window.BeyAuth?.getUser();
  if (!me) return 0;
  return _allMessages().filter(m => m.toId === me.id && !m.read).length;
}

function markThreadRead(otherUserId) {
  const me = window.BeyAuth?.getUser();
  if (!me) return;
  const tid = threadId(me.id, otherUserId);
  const msgs = _allMessages().map(m => {
    if (m.threadId === tid && m.toId === me.id) {
      return Object.assign({}, m, { read: true });
    }
    return m;
  });
  _saveMessages(msgs);
  _dispatchUnreadUpdate();
}

// ════════════════════════════════════════════════════════════
//  EVENTO CUSTOM  (aggiorna badge navbar)
// ════════════════════════════════════════════════════════════
function _dispatchUnreadUpdate() {
  document.dispatchEvent(new CustomEvent('beymarket:unread-update'));
}

// ════════════════════════════════════════════════════════════
//  BADGE NAVBAR  – aggiornamento icona mail
// ════════════════════════════════════════════════════════════
function updateMessagesBadge() {
  const badge = document.getElementById('msg-badge');
  const count = getUnreadCount();
  if (!badge) return;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// ════════════════════════════════════════════════════════════
//  HELPER FORMATTAZIONE TIMESTAMP
// ════════════════════════════════════════════════════════════
function formatTs(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)    return 'Adesso';
  if (diffMin < 60)   return diffMin + ' min fa';
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)     return diffH + 'h fa';
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)      return diffD + 'g fa';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
}

// ════════════════════════════════════════════════════════════
//  API PUBBLICA
// ════════════════════════════════════════════════════════════
window.BeyMessages = {
  send:             sendMessage,
  getThread,
  getInbox,
  getUnreadCount,
  markThreadRead,
  formatTs,
  threadId,
  updateBadge:      updateMessagesBadge,
};

// Aggiorna badge al caricamento e su eventi
document.addEventListener('DOMContentLoaded', function () {
  updateMessagesBadge();
});
document.addEventListener('beymarket:unread-update', updateMessagesBadge);
