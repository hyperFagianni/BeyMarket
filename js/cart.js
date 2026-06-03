// ============================================================
//  BeyMarket – cart.js
//  Gestione semplice del carrello tramite localStorage
// ============================================================

const CART_KEY = 'beymarket_cart';

// ---------- Utilities ----------

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateBadge() {
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = count;
  });
}

// ---------- Aggiungi al carrello ----------

function addToCart(name, price, img) {
  const cart = getCart();
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, img, qty: 1 });
  }
  saveCart(cart);
  updateBadge();
}

// ---------- Collega i bottoni della home ----------

document.querySelectorAll('.btn--add-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const name  = card.querySelector('.product-card__name').textContent;
    const price = card.querySelector('.product-card__price').textContent;
    const img   = card.querySelector('img').src;
    addToCart(name, price, img);

    btn.textContent = 'Aggiunto ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Aggiungi al carrello';
      btn.disabled = false;
    }, 1500);
  });
});

// ---------- Pagina carrello ----------

function formatPrice(str) {
  const num = parseFloat(str.replace('€', '').replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

function renderCart() {
  const emptyState  = document.getElementById('cart-empty-state');
  const cartLayout  = document.getElementById('cart-layout');
  const itemsList   = document.getElementById('cart-items-list');
  if (!emptyState || !cartLayout || !itemsList) return;

  const cart = getCart();

  if (cart.length === 0) {
    emptyState.style.display = 'block';
    cartLayout.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  cartLayout.style.display = 'grid';

  itemsList.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <img class="cart-item__img" src="${item.img}" alt="${item.name}" />
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__meta">Quantità: ${item.qty}</p>
      </div>
      <span class="cart-item__price">${item.price}</span>
      <button class="cart-item__remove" aria-label="Rimuovi" data-idx="${idx}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path><path d="M14 11v6"></path>
          <path d="M9 6V4h6v2"></path>
        </svg>
      </button>
    </div>
  `).join('');

  // Totali
  const subtotal = cart.reduce((sum, item) => {
    return sum + formatPrice(item.price) * item.qty;
  }, 0);
  const fmt = n => '€' + n.toFixed(2).replace('.', ',');
  document.getElementById('summary-subtotal').textContent = fmt(subtotal);
  document.getElementById('summary-total').textContent    = fmt(subtotal);

  // Rimuovi articolo
  itemsList.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const cart = getCart();
      cart.splice(Number(btn.dataset.idx), 1);
      saveCart(cart);
      updateBadge();
      renderCart();
    });
  });
}

// ---------- Init ----------
updateBadge();
renderCart();
