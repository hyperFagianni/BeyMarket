// ============================================================
//  BeyMarket – theme.js
//  Gestione del tema chiaro/scuro tramite localStorage
// ============================================================

const THEME_KEY = 'beymarket_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Applica il tema salvato subito (evita flash)
const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
applyTheme(savedTheme);

// Collega il bottone quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});
