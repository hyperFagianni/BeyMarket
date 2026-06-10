// ============================================================
//  BeyMarket – auth.js  v2.0
//  Autenticazione utenti tramite Supabase o Demo Mode
//  Sessione locale valida 24 ore dal login
//  Portafoglio utente integrato con il backend Express
// ============================================================

// ──────────────────────────────────────────────────────────────
//  CONFIGURAZIONE SUPABASE
//  Sostituisci i due valori qui sotto con le tue credenziali.
//  Se lasci 'XXXXXXXX' il sito funziona in Demo Mode
//  (utenti salvati in localStorage, solo per sviluppo locale).
// ──────────────────────────────────────────────────────────────
const SB_URL = 'https://XXXXXXXX.supabase.co';
const SB_KEY = 'eyJhbGci...';  // anon / public key

// ──────────────────────────────────────────────────────────────
//  URL del backend Express (portafoglio, ordini)
// ──────────────────────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:3000';
const JWT_KEY     = 'beymarket_jwt';

const SESSION_KEY    = 'beymarket_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore

// ---- Istanza Supabase (null se Demo Mode) ----
let _db = null;

function initSupabase() {
  if (_db) return _db;
  if (SB_URL.includes('XXXXXXXX')) return null;
  if (typeof window.supabase?.createClient !== 'function') return null;
  _db = window.supabase.createClient(SB_URL, SB_KEY);
  window._beymarketDB = _db;   // esposto per cart.js
  return _db;
}

// ════════════════════════════════════════════════════════════
//  SESSIONE LOCALE  (TTL 24h)
// ════════════════════════════════════════════════════════════
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id:      user.id,
    email:   user.email,
    loginAt: Date.now(),
  }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(JWT_KEY);
}

function getLocalSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.loginAt > SESSION_TTL_MS) {
      clearSession();
      return null;
    }
    return data;
  } catch { return null; }
}

// ════════════════════════════════════════════════════════════
//  JWT BACKEND  –  token per le API del portafoglio
// ════════════════════════════════════════════════════════════
function saveJwt(token) {
  if (token) localStorage.setItem(JWT_KEY, token);
}

function getJwt() {
  return localStorage.getItem(JWT_KEY) || null;
}

// Chiama il backend Express. Restituisce { ok, data } oppure { ok: false, error }.
async function backendFetch(path, options) {
  options = options || {};
  const token = getJwt();
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res  = await fetch(BACKEND_URL + path, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Errore sconosciuto' };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Backend non raggiungibile' };
  }
}

// ════════════════════════════════════════════════════════════
//  API PUBBLICA  –  window.BeyAuth
// ════════════════════════════════════════════════════════════
window.BeyAuth = {
  isAuthenticated() { return !!getLocalSession(); },
  getUser()         { return getLocalSession(); },
  openModal(tab)    { openAuthModal(tab); },
  getJwt,
  backendFetch,
};

// ════════════════════════════════════════════════════════════
//  API PUBBLICA  –  window.BeyWallet
//  Usata da altri script per accedere al portafoglio.
// ════════════════════════════════════════════════════════════
window.BeyWallet = {
  // Recupera il saldo dal backend e aggiorna il contatore in navbar.
  async fetchBalance() {
    if (!getLocalSession()) return null;
    const res = await backendFetch('/wallet/balance');
    if (!res.ok) return null;
    const balance = res.data.balance;
    _updateBalanceBadge(balance);
    return balance;
  },

  // Deposita fondi sul conto BeyMarket.
  // method: 'paypal' | 'bank_transfer' | 'manual'
  async deposit(amount, method) {
    const res = await backendFetch('/wallet/deposit', {
      method: 'POST',
      body:   JSON.stringify({ amount, method: method || 'manual' }),
    });
    if (!res.ok) throw new Error(res.error);
    _updateBalanceBadge(res.data.balance);
    return res.data.balance;
  },

  // Richiede un prelievo verso IBAN o PayPal.
  async withdraw(amount, method, destination) {
    const res = await backendFetch('/wallet/withdraw', {
      method: 'POST',
      body:   JSON.stringify({ amount, method, destination }),
    });
    if (!res.ok) throw new Error(res.error);
    await this.fetchBalance();
    return res.data.withdrawal;
  },

  // Acquista un prodotto con l'escrow.
  async buy(listingId, qty) {
    const res = await backendFetch('/orders/buy', {
      method: 'POST',
      body:   JSON.stringify({ listingId, qty: qty || 1 }),
    });
    if (!res.ok) throw new Error(res.error);
    await this.fetchBalance();
    return res.data.order;
  },

  // Conferma la ricezione del pacco → sblocca i fondi al venditore.
  async confirmReceipt(orderId) {
    const res = await backendFetch('/orders/' + orderId + '/confirm', { method: 'POST' });
    if (!res.ok) throw new Error(res.error);
    await this.fetchBalance();
    return res.data.order;
  },

  // Elenco ordini dell'utente.
  async getOrders() {
    const res = await backendFetch('/orders');
    if (!res.ok) throw new Error(res.error);
    return res.data;
  },

  // Storico movimenti del portafoglio.
  async getTransactions(limit) {
    const qs  = limit ? '?limit=' + limit : '';
    const res = await backendFetch('/wallet/transactions' + qs);
    if (!res.ok) throw new Error(res.error);
    return res.data;
  },
};

// ════════════════════════════════════════════════════════════
//  REGISTRAZIONE
// ════════════════════════════════════════════════════════════
async function register(email, password) {
  const db = initSupabase();

  if (!db) {
    // ── Demo Mode ────────────────────────────────────────────
    const users = JSON.parse(localStorage.getItem('beymarket_demo_users') || '[]');
    if (users.some(u => u.email === email)) {
      throw new Error('Email già registrata.');
    }
    const user = { id: 'demo-' + Date.now(), email };
    // ATTENZIONE: password in chiaro solo in Demo Mode locale.
    // In produzione usa sempre Supabase Auth.
    users.push(Object.assign({}, user, { _pw: password }));
    localStorage.setItem('beymarket_demo_users', JSON.stringify(users));
    saveSession(user);
    return user;
  }

  // ── Supabase Mode ─────────────────────────────────────────
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) throw new Error(translateError(error.message));
  const user = data.user;
  if (user) saveSession(user);
  return user;
}

// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════
async function login(email, password) {
  // ── Prova prima il backend Express ────────────────────────────
  try {
    const res = await fetch(BACKEND_URL + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const { user, token } = await res.json();
      saveJwt(token);
      saveSession(user);
      return user;
    }
    if (res.status === 401) throw new Error('Email o password non corretti.');
  } catch (e) {
    if (e.message === 'Email o password non corretti.') throw e;
    // Backend non disponibile: cade nel fallback sotto
  }

  const db = initSupabase();

  if (!db) {
    // ── Demo Mode fallback ────────────────────────────────────────────
    const users = JSON.parse(localStorage.getItem('beymarket_demo_users') || '[]');
    const found = users.find(u => u.email === email && u._pw === password);
    if (!found) throw new Error('Email o password non corretti.');
    saveSession(found);
    return found;
  }

  // ── Supabase Mode ─────────────────────────────────────────────────
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateError(error.message));
  const user = data.user;
  if (user) saveSession(user);
  return user;
}

// ════════════════════════════════════════════════════════════
//  LOGOUT
// ════════════════════════════════════════════════════════════
async function logout() {
  const db = initSupabase();
  if (db) await db.auth.signOut().catch(() => {});
  clearSession();
  updateNavbarUser();
}

// ════════════════════════════════════════════════════════════
//  NAVBAR – saldo portafoglio
// ════════════════════════════════════════════════════════════

// Aggiorna il badge del saldo nella navbar. Chiamata da BeyWallet.fetchBalance().
function _updateBalanceBadge(balance) {
  const amount = document.getElementById('navbar-balance-amount');
  if (!amount) return;
  amount.textContent = Number(balance).toFixed(2);
}

// ════════════════════════════════════════════════════════════
//  NAVBAR – stato utente
// ════════════════════════════════════════════════════════════
function updateNavbarUser() {
  const container = document.getElementById('navbar-user');
  if (!container) return;
  const session = getLocalSession();

  // Icona messaggi: visibile solo se loggato
  const msgIcon = document.getElementById('navbar-msg-icon');
  if (msgIcon) {
    msgIcon.style.display = session ? 'flex' : 'none';
    if (session && window.BeyMessages) {
      window.BeyMessages.updateBadge();
    }
  }

  if (session) {
    const nick = session.email.split('@')[0];
    container.innerHTML =
      '<a class="navbar__user-link" href="/pages/my-store.html" title="La mia vetrina da venditore">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
        ' Vetrina' +
      '</a>' +
      '<a class="navbar__user-link" href="/pages/my-orders.html" title="I miei acquisti">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        ' Acquisti' +
      '</a>' +
      '<span class="navbar__username" title="' + session.email + '">' + nick + '</span>' +
      '<span class="navbar__balance" id="navbar-balance" title="Saldo BeyMarket">' +
        '<span class="navbar__balance-icon">€</span>' +
        '<span id="navbar-balance-amount">0.00</span>' +
      '</span>' +
      '<button class="navbar__logout" id="btn-logout" aria-label="Disconnettiti">Esci</button>';
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await logout();
      window.location.reload();
    });
    // Carica il saldo in modo asincrono
    window.BeyWallet && window.BeyWallet.fetchBalance();
  } else {
    container.innerHTML =
      '<button class="navbar__login-btn" id="btn-open-auth">Accedi&nbsp;/&nbsp;Registrati</button>';
    document.getElementById('btn-open-auth')?.addEventListener('click', () => openAuthModal());
  }
}

// ════════════════════════════════════════════════════════════
//  MODALE AUTH
// ════════════════════════════════════════════════════════════
function openAuthModal(tab) {
  tab = tab || 'login';
  const overlay = document.getElementById('auth-overlay');
  if (!overlay) return;
  overlay.classList.add('auth-overlay--open');
  overlay.removeAttribute('aria-hidden');
  switchTab(tab);
}

function closeAuthModal() {
  const overlay = document.getElementById('auth-overlay');
  if (!overlay) return;
  overlay.classList.remove('auth-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
  const eLogin = document.getElementById('login-error');
  const eReg   = document.getElementById('reg-error');
  if (eLogin) eLogin.textContent = '';
  if (eReg)   eReg.textContent   = '';
  document.getElementById('form-login')?.reset();
  document.getElementById('form-register')?.reset();
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t =>
    t.classList.toggle('auth-tab--active', t.dataset.tab === tab)
  );
  const fLogin = document.getElementById('form-login');
  const fReg   = document.getElementById('form-register');
  if (fLogin) fLogin.hidden = (tab !== 'login');
  if (fReg)   fReg.hidden   = (tab !== 'register');
}

// ════════════════════════════════════════════════════════════
//  BIND FORM EVENTS
// ════════════════════════════════════════════════════════════
function bindAuthForms() {
  const overlay = document.getElementById('auth-overlay');
  if (!overlay) return;

  // Chiusura
  document.getElementById('auth-close')?.addEventListener('click', closeAuthModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeAuthModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAuthModal();
  });

  // Cambio tab
  document.querySelectorAll('.auth-tab').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );

  // ── Form Login ────────────────────────────────────────────
  document.getElementById('form-login')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const errEl     = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('.auth-submit');
    errEl.textContent  = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Accesso in corso…';
    try {
      await login(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value
      );
      closeAuthModal();
      updateNavbarUser();
      onAuthSuccess();
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Accedi';
    }
  });

  // ── Form Registrazione ────────────────────────────────────
  document.getElementById('form-register')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const errEl     = document.getElementById('reg-error');
    const submitBtn = e.target.querySelector('.auth-submit');
    errEl.textContent = '';
    const pw  = document.getElementById('reg-password').value;
    const pw2 = document.getElementById('reg-confirm').value;
    if (pw !== pw2) {
      errEl.textContent = 'Le password non coincidono.';
      return;
    }
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Creazione account…';
    try {
      await register(
        document.getElementById('reg-email').value.trim(),
        pw
      );
      closeAuthModal();
      updateNavbarUser();
      onAuthSuccess();
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Crea account';
    }
  });
}

// Chiamata dopo login/registrazione: riattiva pulsanti carrello
function onAuthSuccess() {
  document.querySelectorAll('.btn-cart-row--locked').forEach(btn => {
    btn.classList.remove('btn-cart-row--locked');
    btn.disabled = false;
    btn.title    = 'Aggiungi al carrello';
  });
}

// ════════════════════════════════════════════════════════════
//  CONTROLLO SESSIONE SCADUTA (ogni 30 secondi)
// ════════════════════════════════════════════════════════════
let _wasLoggedIn = false;

function watchSession() {
  setInterval(function() {
    const isNowLoggedIn = !!getLocalSession();
    if (_wasLoggedIn && !isNowLoggedIn) {
      _wasLoggedIn = false;
      updateNavbarUser();
      const banner = document.getElementById('session-expired-banner');
      if (banner) {
        banner.hidden = false;
        setTimeout(() => { banner.hidden = true; }, 7000);
      }
    }
    _wasLoggedIn = isNowLoggedIn;
  }, 30000);
}

// ════════════════════════════════════════════════════════════
//  TRADUZIONI ERRORI SUPABASE
// ════════════════════════════════════════════════════════════
function translateError(msg) {
  var map = {
    'Invalid login credentials':        'Email o password non corretti.',
    'User already registered':          'Email già registrata.',
    'Password should be at least 6':    'La password deve avere almeno 6 caratteri.',
    'Unable to validate email address': 'Indirizzo email non valido.',
    'Email not confirmed':              'Controlla la tua email e conferma la registrazione.',
    'Email rate limit exceeded':        'Troppi tentativi. Riprova tra qualche minuto.',
  };
  for (var key in map) {
    if (msg.indexOf(key) !== -1) return map[key];
  }
  return msg;
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  initSupabase();
  updateNavbarUser();
  bindAuthForms();
  _wasLoggedIn = BeyAuth.isAuthenticated();
  watchSession();
});
