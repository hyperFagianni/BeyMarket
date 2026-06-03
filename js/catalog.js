// ============================================================
//  BeyMarket – catalog.js  v1.0
//  Carica e filtra i prodotti di una categoria
//  Usa fetch() verso API_BASE; fallback ai dati di esempio
// ============================================================

const API_BASE = 'https://api.beymarket.it/v1';

// ---- Dati di esempio (usati quando l'API non è disponibile) ----
const MOCK_LISTINGS = [
  // BX Blade
  { id:  1, category: 'bx-blade',              name: 'Dran Sword',           bey: 'Dranzer Spiral',   color: 'Rosso',       attack: 8, stamina: 4, defense: 3, condition: 'NM', qty: 2, price: 4.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Dran+Sword' },
  { id:  2, category: 'bx-blade',              name: 'Hells Scythe',         bey: 'Hells Hammer',     color: 'Nero',        attack: 9, stamina: 2, defense: 4, condition: 'GD', qty: 1, price: 6.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Hells+Scythe' },
  { id:  3, category: 'bx-blade',              name: 'Cobalt Dragoon',       bey: 'Cobalt Drake',     color: 'Blu',         attack: 7, stamina: 5, defense: 5, condition: 'MN', qty: 3, price: 8.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Cobalt+Dragoon' },
  { id:  4, category: 'bx-blade',              name: 'Wizard Arrow',         bey: 'Wizard Rod',       color: 'Viola',       attack: 6, stamina: 7, defense: 4, condition: 'LP', qty: 1, price: 3.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Wizard+Arrow' },
  { id:  5, category: 'bx-blade',              name: 'Leon Claw',            bey: 'Leon Crest',       color: 'Arancio',     attack: 7, stamina: 3, defense: 6, condition: 'PO', qty: 1, price: 1.80,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Leon+Claw' },
  // UX Blade
  { id:  6, category: 'ux-blade',              name: 'Shark Edge',           bey: 'Aquila Almight',   color: 'Grigio',      attack: 6, stamina: 6, defense: 5, condition: 'LP', qty: 1, price: 3.50,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Shark+Edge' },
  { id:  7, category: 'ux-blade',              name: 'Phoenix Wing',         bey: 'Phoénix Rudder',   color: 'Arancio',     attack: 5, stamina: 7, defense: 3, condition: 'NM', qty: 2, price: 5.00,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Phoenix+Wing' },
  { id:  8, category: 'ux-blade',              name: 'Unicorn Stinger',      bey: 'Unicorn Sting',    color: 'Bianco',      attack: 4, stamina: 8, defense: 5, condition: 'MN', qty: 1, price: 7.50,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Unicorn+Stinger' },
  // CX Assist Blade
  { id:  9, category: 'cx-assist-blade',       name: 'Assist Blade S',       bey: 'Cobra Assault',    color: 'Rosso',       attack: 5, stamina: 5, defense: 5, condition: 'NM', qty: 2, price: 3.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Assist+S' },
  { id: 10, category: 'cx-assist-blade',       name: 'Assist Blade D',       bey: 'Drake Wing',       color: 'Blu',         attack: 7, stamina: 3, defense: 4, condition: 'GD', qty: 1, price: 2.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Assist+D' },
  // CX Lock Chip
  { id: 11, category: 'cx-lock-chip',          name: 'Lock Chip Type A',     bey: 'Universale',       color: 'Grigio',      attack: 0, stamina: 0, defense: 0, condition: 'MN', qty: 3, price: 1.20,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Lock+A' },
  { id: 12, category: 'cx-lock-chip',          name: 'Lock Chip Type B',     bey: 'Universale',       color: 'Nero',        attack: 0, stamina: 0, defense: 0, condition: 'NM', qty: 1, price: 1.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Lock+B' },
  // CX Main Blade
  { id: 13, category: 'cx-main-blade',         name: 'Main Blade V1',        bey: 'Viper Tail',       color: 'Viola',       attack: 7, stamina: 5, defense: 4, condition: 'GD', qty: 1, price: 5.50,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Main+V1' },
  { id: 14, category: 'cx-main-blade',         name: 'Main Blade Z',         bey: 'Zero Storm',       color: 'Bianco',      attack: 6, stamina: 6, defense: 5, condition: 'NM', qty: 2, price: 6.00,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Main+Z' },
  // CX Expand Metal Blade
  { id: 15, category: 'cx-expand-metal-blade', name: 'Metal Blade M3',       bey: 'Universale',       color: 'Argento',     attack: 6, stamina: 4, defense: 7, condition: 'NM', qty: 2, price: 6.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Metal+M3' },
  { id: 16, category: 'cx-expand-metal-blade', name: 'Metal Blade X',        bey: 'Universale',       color: 'Nero',        attack: 8, stamina: 2, defense: 5, condition: 'GD', qty: 1, price: 4.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Metal+X' },
  // CX Expand Over Blade
  { id: 17, category: 'cx-expand-over-blade',  name: 'Over Blade O2',        bey: 'Universale',       color: 'Verde',       attack: 4, stamina: 7, defense: 6, condition: 'LP', qty: 1, price: 4.00,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Over+O2' },
  // Ratchet
  { id: 18, category: 'ratchet',               name: 'Ratchet 3-60',         bey: 'Universale',       color: 'Verde',       attack: 0, stamina: 0, defense: 0, condition: 'MN', qty: 4, price: 2.50,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=3-60' },
  { id: 19, category: 'ratchet',               name: 'Ratchet 4-70',         bey: 'Universale',       color: 'Viola',       attack: 0, stamina: 0, defense: 0, condition: 'LP', qty: 1, price: 1.80,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=4-70' },
  { id: 20, category: 'ratchet',               name: 'Ratchet 5-80',         bey: 'Universale',       color: 'Arancio',     attack: 0, stamina: 0, defense: 0, condition: 'GD', qty: 2, price: 2.00,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=5-80' },
  { id: 21, category: 'ratchet',               name: 'Ratchet 9-60',         bey: 'Universale',       color: 'Rosso',       attack: 0, stamina: 0, defense: 0, condition: 'NM', qty: 3, price: 2.20,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=9-60' },
  // Bit
  { id: 22, category: 'bit',                   name: 'Point',                bey: 'Universale',       color: 'Trasparente', attack: 0, stamina: 9, defense: 2, condition: 'NM', qty: 5, price: 1.50,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Point' },
  { id: 23, category: 'bit',                   name: 'Rush',                 bey: 'Universale',       color: 'Rosso',       attack: 7, stamina: 3, defense: 1, condition: 'GD', qty: 2, price: 2.00,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Rush' },
  { id: 24, category: 'bit',                   name: 'Needle',               bey: 'Universale',       color: 'Bianco',      attack: 2, stamina: 8, defense: 2, condition: 'MN', qty: 3, price: 2.20,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Needle' },
  { id: 25, category: 'bit',                   name: 'Kick',                 bey: 'Universale',       color: 'Giallo',      attack: 6, stamina: 4, defense: 3, condition: 'LP', qty: 1, price: 1.80,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Kick' },
  // Launcher
  { id: 26, category: 'launcher',              name: 'String Launcher L',    bey: 'N/A',              color: 'Nero',        attack: 0, stamina: 0, defense: 0, condition: 'GD', qty: 1, price: 7.00,  photo: 'https://placehold.co/600x400/0d1117/ff6b6b?text=String+L' },
  { id: 27, category: 'launcher',              name: 'Ripcord Launcher',     bey: 'N/A',              color: 'Rosso',       attack: 0, stamina: 0, defense: 0, condition: 'NM', qty: 2, price: 4.50,  photo: 'https://placehold.co/600x400/0d1117/ff6b6b?text=Ripcord' },
  { id: 28, category: 'launcher',              name: 'Light Launcher 2',     bey: 'N/A',              color: 'Blu',         attack: 0, stamina: 0, defense: 0, condition: 'MN', qty: 1, price: 5.50,  photo: 'https://placehold.co/600x400/0d1117/ff6b6b?text=Light+L2' },
  // Accessori
  { id: 29, category: 'accessories',           name: 'Stadium BX-15',        bey: 'N/A',              color: 'Bianco',      attack: 0, stamina: 0, defense: 0, condition: 'GD', qty: 1, price: 15.00, photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Stadium' },
  { id: 30, category: 'accessories',           name: 'Carry Case 12 pezzi',  bey: 'N/A',              color: 'Nero',        attack: 0, stamina: 0, defense: 0, condition: 'NM', qty: 2, price: 8.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Case' },
  { id: 31, category: 'accessories',           name: 'Beyblade Grip',        bey: 'N/A',              color: 'Rosso',       attack: 0, stamina: 0, defense: 0, condition: 'MN', qty: 3, price: 3.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Grip' },
];

// ---- Legge la categoria dalla pagina ----
function getCategory() {
  return document.querySelector('.catalog-layout')?.dataset.category ?? null;
}

// ---- Fetch dall'API con fallback mock ----
async function fetchListings(category) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `${API_BASE}/listings?category=${encodeURIComponent(category)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.listings ?? []);
  } catch {
    return MOCK_LISTINGS.filter(l => l.category === category);
  }
}

// ---- Badge condizione ----
const COND_META = {
  MN: 'Near mint / perfetto',
  NM: 'Near mint',
  GD: 'Good / buono',
  LP: 'Lightly played / poco usato',
  PO: 'Poor / molto usato',
};

function condBadge(cond) {
  const title = COND_META[cond] ?? cond;
  return `<span class="cond-badge cond-${(cond ?? 'xx').toLowerCase()}" title="${title}">${cond ?? '?'}</span>`;
}

// ---- Cella foto ----
function photoCell(url) {
  const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  if (!url) {
    return `<span class="photo-icon photo-icon--none" title="Nessuna foto">${icon}</span>`;
  }
  return `<a class="photo-icon" href="${url}" target="_blank" rel="noopener noreferrer" title="Vedi foto">${icon}</a>`;
}

// ---- Selettore quantità ----
function qtyCell(qty, id) {
  if (qty <= 1) return `<span class="qty-static">1</span>`;
  const opts = Array.from({ length: qty }, (_, i) =>
    `<option value="${i + 1}">${i + 1}</option>`
  ).join('');
  return `<select class="qty-select" id="qty-${id}" aria-label="Quantità">${opts}</select>`;
}

// ---- Render riga ----
function renderRow(item) {
  const price = parseFloat(item.price ?? 0).toFixed(2);
  const beyLabel = item.bey && item.bey !== 'N/A' ? `<span class="listing-bey">${item.bey}</span>` : '';
  return `
    <tr data-id="${item.id}" data-name="${item.name}" data-price="${item.price ?? 0}" data-img="${item.photo ?? ''}">
      <td class="col-name">
        <span class="listing-name">${item.name}</span>
        ${beyLabel}
      </td>
      <td class="col-cond">${condBadge(item.condition)}</td>
      <td class="col-photo">${photoCell(item.photo)}</td>
      <td class="col-qty"><span class="qty-avail">${item.qty}</span></td>
      <td class="col-sel">${qtyCell(item.qty, item.id)}</td>
      <td class="col-price"><span class="listing-price">€ ${price}</span></td>
      <td class="col-action">
        <button class="btn-cart-row" data-id="${item.id}" aria-label="Aggiungi al carrello" title="Aggiungi al carrello">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </button>
      </td>
    </tr>`;
}

// ---- Lettura filtri ----
function getFilters() {
  return {
    name:       (document.getElementById('f-name')?.value    ?? '').trim().toLowerCase(),
    bey:        (document.getElementById('f-bey')?.value     ?? '').trim().toLowerCase(),
    color:      (document.getElementById('f-color')?.value   ?? '').trim().toLowerCase(),
    attack:     parseInt(document.getElementById('f-attack')?.value)  || 0,
    stamina:    parseInt(document.getElementById('f-stamina')?.value) || 0,
    defense:    parseInt(document.getElementById('f-defense')?.value) || 0,
    conditions: [...document.querySelectorAll('.f-condition:checked')].map(c => c.value),
  };
}

let allListings = [];

function applyAndRender() {
  const f = getFilters();
  const filtered = allListings.filter(item => {
    if (f.name      && !item.name.toLowerCase().includes(f.name))           return false;
    if (f.bey       && !(item.bey  ?? '').toLowerCase().includes(f.bey))    return false;
    if (f.color     && !(item.color ?? '').toLowerCase().includes(f.color)) return false;
    if (f.attack  > 0 && (item.attack  ?? 0) < f.attack)                    return false;
    if (f.stamina > 0 && (item.stamina ?? 0) < f.stamina)                   return false;
    if (f.defense > 0 && (item.defense ?? 0) < f.defense)                   return false;
    if (f.conditions.length && !f.conditions.includes(item.condition))       return false;
    return true;
  });

  const tbody = document.getElementById('catalog-body');
  const empty = document.getElementById('catalog-empty');
  const count = document.getElementById('catalog-count');
  if (!tbody) return;

  tbody.innerHTML = filtered.length ? filtered.map(renderRow).join('') : '';
  if (empty) empty.style.display = filtered.length ? 'none' : '';
  if (count) count.textContent = `${filtered.length} annuncio${filtered.length !== 1 ? 'i' : ''}`;
}

// ---- Aggiunta al carrello ----
function bindCart() {
  document.getElementById('catalog-body')?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-cart-row');
    if (!btn) return;
    const row   = btn.closest('tr');
    const id    = row.dataset.id;
    const name  = row.dataset.name;
    const price = parseFloat(row.dataset.price);
    const img   = row.dataset.img;
    const qty   = parseInt(document.getElementById(`qty-${id}`)?.value ?? 1);

    if (!window.BeyAuth?.isAuthenticated()) {
      // Non autenticato: mostra la modale di login e blocca il bottone
      btn.classList.add('btn-cart-row--locked');
      btn.disabled = true;
      btn.title    = 'Accedi per aggiungere al carrello';
      window.BeyAuth?.openModal('login');
      return;
    }

    if (typeof addToCart === 'function') {
      addToCart(name, parseFloat(row.dataset.price), img, id, qty);
    }

    btn.classList.add('btn-cart-row--added');
    setTimeout(() => btn.classList.remove('btn-cart-row--added'), 900);
  });
}

// ---- Init ----
async function initCatalog() {
  const category = getCategory();
  if (!category) return;

  const tbody = document.getElementById('catalog-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr class="catalog-loading">
        <td colspan="7">
          <div class="loading-inner">
            <span class="loading-spinner"></span>
            Caricamento annunci…
          </div>
        </td>
      </tr>`;
  }

  allListings = await fetchListings(category);
  applyAndRender();
  bindCart();

  // Filtri live
  ['f-name', 'f-bey', 'f-color', 'f-attack', 'f-stamina', 'f-defense'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyAndRender);
  });
  document.querySelectorAll('.f-condition').forEach(cb =>
    cb.addEventListener('change', applyAndRender)
  );

  // Reset
  document.getElementById('reset-filters')?.addEventListener('click', () => {
    ['f-name', 'f-bey', 'f-color', 'f-attack', 'f-stamina', 'f-defense'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.f-condition').forEach(cb => cb.checked = true);
    applyAndRender();
  });
}

document.addEventListener('DOMContentLoaded', initCatalog);
