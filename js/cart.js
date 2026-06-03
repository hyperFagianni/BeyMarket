// ============================================================
//  BeyMarket - cart.js
//  Gestione del carrello tramite localStorage
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
// listingId: ID del record nel database (per aggiornare le quantita al checkout)
// purchaseQty: quante unita aggiungere in una volta sola

function addToCart(name, price, img, listingId, purchaseQty) {
  listingId   = listingId   || null;
  purchaseQty = parseInt(purchaseQty) || 1;
  const cart = getCart();
  const existing = cart.find(i => i.listingId
    ? i.listingId === listingId
    : i.name === name);
  if (existing) {
    existing.qty += purchaseQty;
  } else {
    cart.push({ name, price: parseFloat(price) || 0, img: img || '', listingId, qty: purchaseQty });
  }
  saveCart(cart);
  updateBadge();
}

// ---------- Collega i bottoni della home ----------

document.querySelectorAll('.btn--add-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!window.BeyAuth?.isAuthenticated()) {
      window.BeyAuth?.openModal('login');
      return;
    }
    const card  = btn.closest('.product-card');
    const name  = card.querySelector('.product-card__name').textContent;
    const price = card.querySelector('.product-card__price').textContent;
    const img   = card.querySelector('img').src;
    addToCart(name, price, img);

    btn.textContent = 'Aggiunto';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Aggiungi al carrello';
      btn.disabled = false;
    }, 1500);
  });
});

// ---------- Pagina carrello ----------

function formatPrice(val) {
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

function renderCart() {
  const emptyState = document.getElementById('cart-empty-state');
  const cartLayout = document.getElementById('cart-layout');
  const itemsList  = document.getElementById('cart-items-list');
  if (!emptyState || !cartLayout || !itemsList) return;

  const cart = getCart();

  if (cart.length === 0) {
    emptyState.style.display = 'block';
    cartLayout.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  cartLayout.style.display = 'grid';

  itemsList.innerHTML = cart.map((item, idx) => {
    const priceNum = formatPrice(item.price);
    const priceStr = '&#8364; ' + priceNum.toFixed(2).replace('.', ',');
    return (
      '<div class="cart-item">' +
        '<img class="cart-item__img" src="' + (item.img || '') + '" alt="' + item.name + '" />' +
        '<div class="cart-item__info">' +
          '<p class="cart-item__name">' + item.name + '</p>' +
          '<p class="cart-item__meta">Quantita: ' + item.qty + '</p>' +
        '</div>' +
        '<span class="cart-item__price">' + priceStr + '</span>' +
        '<button class="cart-item__remove" aria-label="Rimuovi" data-idx="' + idx + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="3 6 5 6 21 6"></polyline>' +
            '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>' +
            '<path d="M10 11v6"></path><path d="M14 11v6"></path>' +
            '<path d="M9 6V4h6v2"></path>' +
          '</svg>' +
        '</button>' +
      '</div>'
    );
  }).join('');

  // Totali
  const subtotal = cart.reduce((sum, item) => sum + formatPrice(item.price) * item.qty, 0);
  const fmt = n => '&#8364; ' + n.toFixed(2).replace('.', ',');
  const elSub = document.getElementById('summary-subtotal');
  const elTot = document.getElementById('summary-total');
  if (elSub) elSub.innerHTML = fmt(subtotal);
  if (elTot) elTot.innerHTML = fmt(subtotal);

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

  // Checkout button
  const checkoutBtn = document.querySelector('.btn--checkout');
  if (checkoutBtn) {
    checkoutBtn.onclick = null;
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}

// ---------- Checkout con aggiornamento DB ----------

async function handleCheckout() {
  // 1. Verifica autenticazione
  if (!window.BeyAuth?.isAuthenticated()) {
    window.BeyAuth?.openModal('login');
    return;
  }

  const cart = getCart();
  if (!cart.length) return;

  const btn = document.querySelector('.btn--checkout');
  if (btn) { btn.disabled = true; btn.textContent = 'Elaborazione...'; }

  try {
    // 2. Aggiorna quantita nel database (solo se Supabase e configurato)
    const db = window._beymarketDB;
    if (db) {
      // Raggruppa per listingId
      const byListing = {};
      cart.forEach(item => {
        if (item.listingId) {
          byListing[item.listingId] = (byListing[item.listingId] || 0) + item.qty;
        }
      });

      for (const listingId in byListing) {
        const purchasedQty = byListing[listingId];

        const { data: listing, error: fetchErr } = await db
          .from('listings')
          .select('qty')
          .eq('id', listingId)
          .single();

        if (fetchErr || !listing) continue;

        const newQty = listing.qty - purchasedQty;

        if (newQty <= 0) {
          // Nessuna unita rimasta: cancella il record
          await db.from('listings').delete().eq('id', listingId);
        } else {
          // Aggiorna la quantita residua
          await db.from('listings').update({ qty: newQty }).eq('id', listingId);
        }
      }
    }

    // 3. Svuota il carrello locale
    saveCart([]);
    updateBadge();

    // 4. Mostra conferma d'ordine
    const emptyState = document.getElementById('cart-empty-state');
    const cartLayout = document.getElementById('cart-layout');
    if (cartLayout) cartLayout.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;margin:0 auto 1rem;display:block;color:var(--clr-mint)">' +
          '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
        '</svg>' +
        '<p style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Ordine completato!</p>' +
        '<p style="color:var(--clr-text-mute);margin-bottom:1.5rem">Grazie per il tuo acquisto su BeyMarket.</p>' +
        '<a href="../home.html" class="btn btn--primary">Torna all\'Home</a>';
    }

  } catch (err) {
    console.error('Errore checkout:', err);
    alert('Si e verificato un errore durante il checkout. Riprova.');
    if (btn) { btn.disabled = false; btn.textContent = 'Procedi al pagamento'; }
  }
}

// ---------- Init ----------
updateBadge();
renderCart();