// ============================================================
//  BeyMarket – catalog.js  v1.0
//  Carica e filtra i prodotti di una categoria
//  Usa fetch() verso API_BASE; fallback ai dati di esempio
// ============================================================

const API_BASE = 'https://api.beymarket.it/v1';

// ---- Dati di esempio (usati quando l'API non è disponibile) ----
const MOCK_LISTINGS = [
  // BX Blade
  { id:  1, category: 'bx-blade',              name: 'Dran Sword',           bey: 'Dranzer Spiral',   color: 'Rosso',       type: 'attack',  condition: 'NM', qty: 2, price: 4.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Dran+Sword' },
  { id:  2, category: 'bx-blade',              name: 'Hells Scythe',         bey: 'Hells Hammer',     color: 'Nero',        type: 'attack',  condition: 'GD', qty: 1, price: 6.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Hells+Scythe' },
  { id:  3, category: 'bx-blade',              name: 'Cobalt Dragoon',       bey: 'Cobalt Drake',     color: 'Blu',         type: 'defense', condition: 'MN', qty: 3, price: 8.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Cobalt+Dragoon' },
  { id:  4, category: 'bx-blade',              name: 'Wizard Arrow',         bey: 'Wizard Rod',       color: 'Viola',       type: 'stamina', condition: 'LP', qty: 1, price: 3.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Wizard+Arrow' },
  { id:  5, category: 'bx-blade',              name: 'Leon Claw',            bey: 'Leon Crest',       color: 'Arancio',     type: 'attack',  condition: 'PO', qty: 1, price: 1.80,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Leon+Claw' },
  // UX Blade
  { id:  6, category: 'ux-blade',              name: 'Shark Edge',           bey: 'Aquila Almight',   color: 'Grigio',      type: 'defense', condition: 'LP', qty: 1, price: 3.50,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Shark+Edge' },
  { id:  7, category: 'ux-blade',              name: 'Phoenix Wing',         bey: 'Phoénix Rudder',   color: 'Arancio',     type: 'stamina', condition: 'NM', qty: 2, price: 5.00,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Phoenix+Wing' },
  { id:  8, category: 'ux-blade',              name: 'Unicorn Stinger',      bey: 'Unicorn Sting',    color: 'Bianco',      type: 'stamina', condition: 'MN', qty: 1, price: 7.50,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Unicorn+Stinger' },
  // CX Assist Blade
  { id:  9, category: 'cx-assist-blade',       name: 'Assist Blade S',       bey: 'Cobra Assault',    color: 'Rosso',       type: null,      condition: 'NM', qty: 2, price: 3.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Assist+S' },
  { id: 10, category: 'cx-assist-blade',       name: 'Assist Blade D',       bey: 'Drake Wing',       color: 'Blu',         type: 'attack',  condition: 'GD', qty: 1, price: 2.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Assist+D' },
  // CX Lock Chip
  { id: 11, category: 'cx-lock-chip',          name: 'Lock Chip Type A',     bey: 'Universale',       color: 'Grigio',      type: null,      condition: 'MN', qty: 3, price: 1.20,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Lock+A' },
  { id: 12, category: 'cx-lock-chip',          name: 'Lock Chip Type B',     bey: 'Universale',       color: 'Nero',        type: null,      condition: 'NM', qty: 1, price: 1.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Lock+B' },
  // CX Main Blade
  { id: 13, category: 'cx-main-blade',         name: 'Main Blade V1',        bey: 'Viper Tail',       color: 'Viola',       type: 'attack',  condition: 'GD', qty: 1, price: 5.50,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Main+V1' },
  { id: 14, category: 'cx-main-blade',         name: 'Main Blade Z',         bey: 'Zero Storm',       color: 'Bianco',      type: 'defense', condition: 'NM', qty: 2, price: 6.00,  photo: 'https://placehold.co/600x400/0d1117/8a5bff?text=Main+Z' },
  // CX Expand Metal Blade
  { id: 15, category: 'cx-expand-metal-blade', name: 'Metal Blade M3',       bey: 'Universale',       color: 'Argento',     type: 'defense', condition: 'NM', qty: 2, price: 6.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Metal+M3' },
  { id: 16, category: 'cx-expand-metal-blade', name: 'Metal Blade X',        bey: 'Universale',       color: 'Nero',        type: 'attack',  condition: 'GD', qty: 1, price: 4.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Metal+X' },
  // CX Expand Over Blade
  { id: 17, category: 'cx-expand-over-blade',  name: 'Over Blade O2',        bey: 'Universale',       color: 'Verde',       type: 'stamina', condition: 'LP', qty: 1, price: 4.00,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Over+O2' },
  // Ratchet
  { id: 18, category: 'ratchet',               name: 'Ratchet 3-60',         bey: 'Universale',       color: 'Verde',       type: null,      condition: 'MN', qty: 4, price: 2.50,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=3-60' },
  { id: 19, category: 'ratchet',               name: 'Ratchet 4-70',         bey: 'Universale',       color: 'Viola',       type: null,      condition: 'LP', qty: 1, price: 1.80,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=4-70' },
  { id: 20, category: 'ratchet',               name: 'Ratchet 5-80',         bey: 'Universale',       color: 'Arancio',     type: null,      condition: 'GD', qty: 2, price: 2.00,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=5-80' },
  { id: 21, category: 'ratchet',               name: 'Ratchet 9-60',         bey: 'Universale',       color: 'Rosso',       type: null,      condition: 'NM', qty: 3, price: 2.20,  photo: 'https://placehold.co/600x400/0d1117/f7c948?text=9-60' },
  // Bit
  { id: 22, category: 'bit',                   name: 'Point',                bey: 'Universale',       color: 'Trasparente', type: 'stamina', condition: 'NM', qty: 5, price: 1.50,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Point' },
  { id: 23, category: 'bit',                   name: 'Rush',                 bey: 'Universale',       color: 'Rosso',       type: 'attack',  condition: 'GD', qty: 2, price: 2.00,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Rush' },
  { id: 24, category: 'bit',                   name: 'Needle',               bey: 'Universale',       color: 'Bianco',      type: 'stamina', condition: 'MN', qty: 3, price: 2.20,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Needle' },
  { id: 25, category: 'bit',                   name: 'Kick',                 bey: 'Universale',       color: 'Giallo',      type: 'attack',  condition: 'LP', qty: 1, price: 1.80,  photo: 'https://placehold.co/600x400/0d1117/3be0a0?text=Kick' },
  // Launcher
  { id: 26, category: 'launcher',              name: 'String Launcher L',    bey: 'N/A',              color: 'Nero',        type: null,      condition: 'GD', qty: 1, price: 7.00,  photo: 'https://placehold.co/600x400/0d1117/ff6b6b?text=String+L' },
  { id: 27, category: 'launcher',              name: 'Ripcord Launcher',     bey: 'N/A',              color: 'Rosso',       type: null,      condition: 'NM', qty: 2, price: 4.50,  photo: 'https://placehold.co/600x400/0d1117/ff6b6b?text=Ripcord' },
  { id: 28, category: 'launcher',              name: 'Light Launcher 2',     bey: 'N/A',              color: 'Blu',         type: null,      condition: 'MN', qty: 1, price: 5.50,  photo: 'https://placehold.co/600x400/0d1117/ff6b6b?text=Light+L2' },
  // Accessori
  { id: 29, category: 'accessories',           name: 'Stadium BX-15',        bey: 'N/A',              color: 'Bianco',      type: null,      condition: 'GD', qty: 1, price: 15.00, photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Stadium' },
  { id: 30, category: 'accessories',           name: 'Carry Case 12 pezzi',  bey: 'N/A',              color: 'Nero',        type: null,      condition: 'NM', qty: 2, price: 8.00,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Case' },
  { id: 31, category: 'accessories',           name: 'Beyblade Grip',        bey: 'N/A',              color: 'Rosso',       type: null,      condition: 'MN', qty: 3, price: 3.50,  photo: 'https://placehold.co/600x400/0d1117/5b7fff?text=Grip' },
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

// ---- Tipo pezzo ----
const TYPE_META = {
  attack:  {
    label: 'Attacco',
    cls:   'type-badge--attack',
    svg:   '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><line x1="14.5" y1="1.5" x2="9" y2="7" stroke="#8898a8" stroke-width="2.4" stroke-linecap="round"/><line x1="14.5" y1="1.5" x2="9" y2="7" stroke="#ccdae8" stroke-width="0.7" stroke-linecap="round"/><line x1="6.8" y1="6.4" x2="9.6" y2="9.2" stroke="#b89020" stroke-width="1.8" stroke-linecap="round"/><line x1="8.2" y1="8" x2="3.5" y2="12.5" stroke="#5a3018" stroke-width="1.8" stroke-linecap="round"/><circle cx="2.8" cy="13.2" r="1.1" fill="#c89828"/><line x1="1.5" y1="1.5" x2="7" y2="7" stroke="#a8b8c8" stroke-width="2.4" stroke-linecap="round"/><line x1="1.5" y1="1.5" x2="7" y2="7" stroke="#dce8f2" stroke-width="0.7" stroke-linecap="round"/><line x1="6.4" y1="9.2" x2="9.2" y2="6.4" stroke="#c89828" stroke-width="1.8" stroke-linecap="round"/><line x1="7.8" y1="8" x2="12.5" y2="12.5" stroke="#5a3018" stroke-width="1.8" stroke-linecap="round"/><circle cx="13.2" cy="13.2" r="1.1" fill="#c89828"/></svg>',
  },
  stamina: {
    label: 'Stamina',
    cls:   'type-badge--stamina',
    svg:   '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 Q10.5 2 10.5 5.5 L8.5 12.5 Q8 13 8 12.8 Z" fill="#445058"/><path d="M5.5 5.5 Q5.5 2 8 2 Q10.5 2 10.5 5.5 L8.5 12.5 Q8 13 7.5 12.5 Z" fill="#8898a8"/><ellipse cx="7.2" cy="3.2" rx="1.2" ry="0.58" fill="white" opacity="0.22" transform="rotate(-20 7.2 3.2)"/><ellipse cx="8" cy="5.5" rx="3" ry="1.05" fill="#c89828" stroke="#8a6818" stroke-width="0.4"/><ellipse cx="8" cy="5.5" rx="1.9" ry="0.6" fill="#f0c030"/><path d="M6.3 5.1 Q8 4.55 9.7 5.1" stroke="#f8e880" stroke-width="0.55" fill="none" stroke-linecap="round"/><path d="M7.5 12.5 L8 15 L8.5 12.5" fill="#c89828"/></svg>',
  },
  defense: {
    label: 'Difesa',
    cls:   'type-badge--defense',
    svg:   '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5 L13.5 3.5 V8 C13.5 11.8 8 14.8 8 14.8 Z" fill="#5a6878"/><path d="M8 1.5 L2.5 3.5 V8 C2.5 11.8 8 14.8 8 14.8 Z" fill="#8898a8"/><path d="M8 1.5 L13.5 3.5 V8 C13.5 11.8 8 14.8 8 14.8 C8 14.8 2.5 11.8 2.5 8 V3.5 Z" fill="none" stroke="#c89828" stroke-width="1.4" stroke-linejoin="round"/><line x1="8" y1="3.8" x2="8" y2="12.5" stroke="#384048" stroke-width="1.8" stroke-linecap="round"/><line x1="8" y1="3.8" x2="8" y2="12.5" stroke="#98a8b4" stroke-width="0.65" stroke-linecap="round"/><line x1="4.2" y1="7.5" x2="11.8" y2="7.5" stroke="#384048" stroke-width="1.8" stroke-linecap="round"/><line x1="4.2" y1="7.5" x2="11.8" y2="7.5" stroke="#98a8b4" stroke-width="0.65" stroke-linecap="round"/><circle cx="8" cy="7.5" r="1.6" fill="#c89828" stroke="#8a6010" stroke-width="0.45"/><circle cx="8" cy="7.5" r="0.75" fill="#f0d050"/></svg>',
  },
};

function typeCell(type) {
  if (!type || !TYPE_META[type]) {
    return '<span class="type-badge type-badge--none" title="Nessun tipo">&#8212;</span>';
  }
  const m = TYPE_META[type];
  return '<span class="type-badge ' + m.cls + '" title="' + m.label + '">' + m.svg + '</span>';
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
      <td class="col-type">${typeCell(item.type)}</td>
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
    name:       (document.getElementById('f-name')?.value  ?? '').trim().toLowerCase(),
    bey:        (document.getElementById('f-bey')?.value   ?? '').trim().toLowerCase(),
    color:      (document.getElementById('f-color')?.value ?? '').trim().toLowerCase(),
    types:      [...document.querySelectorAll('.f-type:checked')].map(c => c.value),
    conditions: [...document.querySelectorAll('.f-condition:checked')].map(c => c.value),
  };
}

let allListings = [];

function applyAndRender() {
  const f = getFilters();
  const allTypes = Object.keys(TYPE_META);
  const filtered = allListings.filter(item => {
    if (f.name && !item.name.toLowerCase().includes(f.name))               return false;
    if (f.bey  && !(item.bey   ?? '').toLowerCase().includes(f.bey))       return false;
    if (f.color && !(item.color ?? '').toLowerCase().includes(f.color))    return false;
    // Filtro tipo: se non tutti e 3 selezionati, filtra (articoli senza tipo passano sempre)
    if (f.types.length > 0 && f.types.length < allTypes.length) {
      if (item.type && !f.types.includes(item.type))                       return false;
    }
    if (f.conditions.length && !f.conditions.includes(item.condition))     return false;
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
        <td colspan="8">
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
  ['f-name', 'f-bey', 'f-color'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyAndRender);
  });
  document.querySelectorAll('.f-type, .f-condition').forEach(cb =>
    cb.addEventListener('change', applyAndRender)
  );

  // Reset
  document.getElementById('reset-filters')?.addEventListener('click', () => {
    ['f-name', 'f-bey', 'f-color'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.f-type, .f-condition').forEach(cb => cb.checked = true);
    applyAndRender();
  });
}

document.addEventListener('DOMContentLoaded', initCatalog);
