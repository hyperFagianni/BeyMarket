// ============================================================
//  BeyMarket – auth.js  v1.0
//  Autenticazione utenti tramite Supabase o Demo Mode
//  Sessione locale valida 24 ore dal login
// ============================================================

// ──────────────────────────────────────────────────────────────
//  CONFIGURAZIONE SUPABASE
//  Sostituisci i due valori qui sotto con le tue credenziali.
//  Se lasci 'XXXXXXXX' il sito funziona in Demo Mode
//  (utenti salvati in localStorage, solo per sviluppo locale).
// ──────────────────────────────────────────────────────────────
const SB_URL = 'https://XXXXXXXX.supabase.co';
const SB_KEY = 'eyJhbGci...';  // anon / public key

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
//  API PUBBLICA  –  window.BeyAuth
// ════════════════════════════════════════════════════════════
window.BeyAuth = {
  isAuthenticated() { return !!getLocalSession(); },
  getUser()         { return getLocalSession(); },
  openModal(tab)    { openAuthModal(tab); },
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
  const db = initSupabase();

  if (!db) {
    // ── Demo Mode ────────────────────────────────────────────
    const users = JSON.parse(localStorage.getItem('beymarket_demo_users') || '[]');
    const found = users.find(u => u.email === email && u._pw === password);
    if (!found) throw new Error('Email o password non corretti.');
    saveSession(found);
    return found;
  }

  // ── Supabase Mode ─────────────────────────────────────────
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
//  NAVBAR – stato utente
// ════════════════════════════════════════════════════════════
function updateNavbarUser() {
  const container = document.getElementById('navbar-user');
  if (!container) return;
  const session = getLocalSession();

  if (session) {
    const nick = session.email.split('@')[0];
    container.innerHTML =
      '<span class="navbar__username" title="' + session.email + '">' + nick + '</span>' +
      '<button class="navbar__logout" id="btn-logout" aria-label="Disconnettiti">Esci</button>';
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await logout();
      window.location.reload();
    });
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
