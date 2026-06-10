// backend/src/models/order.js
// Gestione degli ordini con escrow integrato.
//
// Flusso:
//   1. createOrder()      → buyer paga, fondi finiscono in escrow (ordine 'pending')
//   2. markShipped()      → venditore segna come spedito ('shipped')
//   3. confirmReceipt()   → acquirente conferma ricezione → escrow rilasciato al venditore ('completed')
//   4. (opzionale) disputeOrder() → ordine 'disputed', fondi trattenuti fino a risoluzione

const db       = require('../db');
const { debitBalance, creditBalance } = require('./wallet');

// ── Creazione ordine con escrow ────────────────────────────

function createOrder({ buyerId, listingId, qty }) {
  if (!buyerId || !listingId || qty < 1) throw new Error('Dati ordine non validi');

  const listing = db
    .prepare('SELECT id, name, price, qty, seller_id FROM listings WHERE id = ?')
    .get(listingId);

  if (!listing) throw new Error('Prodotto non trovato');
  if (listing.qty < qty) throw new Error('Quantità non disponibile');
  if (listing.seller_id === buyerId) throw new Error('Non puoi acquistare i tuoi stessi prodotti');

  const unitPrice = listing.price;
  const total     = unitPrice * qty;
  const sellerId  = listing.seller_id || null;

  let orderId;

  const txn = db.transaction(() => {
    // 1. Scala il saldo acquirente (lancia se insufficiente)
    debitBalance(buyerId, total, null, `Acquisto: ${listing.name} ×${qty}`);

    // 2. Crea l'ordine con escrow = total
    const ins = db
      .prepare(
        `INSERT INTO orders
           (buyer_id, seller_id, listing_id, listing_name, qty,
            unit_price, total, escrow_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
      )
      .run(buyerId, sellerId, listingId, listing.name, qty, unitPrice, total, total);

    orderId = ins.lastInsertRowid;

    // 3. Aggiorna reference_id sulla transazione wallet appena inserita
    db
      .prepare(
        `UPDATE wallet_transactions
         SET reference_id = ?
         WHERE user_id = ? AND type = 'purchase_debit'
           AND reference_id IS NULL
         ORDER BY id DESC LIMIT 1`
      )
      .run(orderId, buyerId);

    // 4. Scala la quantità del listing
    const newQty = listing.qty - qty;
    if (newQty <= 0) {
      db.prepare('DELETE FROM listings WHERE id = ?').run(listingId);
    } else {
      db.prepare('UPDATE listings SET qty = ? WHERE id = ?').run(newQty, listingId);
    }
  });
  txn();

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

// ── Segna come spedito (solo il venditore) ─────────────────

function markShipped(orderId, sellerId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Ordine non trovato');
  if (order.seller_id !== sellerId) throw new Error('Non autorizzato');
  if (order.status !== 'pending') throw new Error('Ordine non in stato pending');

  db.prepare("UPDATE orders SET status = 'shipped' WHERE id = ?").run(orderId);
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

// ── Conferma ricezione (solo l'acquirente) ─────────────────
// Sblocca i fondi dall'escrow e li accredita al venditore.

function confirmReceipt(orderId, buyerId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Ordine non trovato');
  if (order.buyer_id !== buyerId) throw new Error('Non autorizzato');
  if (!['pending', 'shipped'].includes(order.status)) {
    throw new Error('Ordine non confermabile in questo stato');
  }

  const txn = db.transaction(() => {
    // Accredita il venditore (se esiste un seller registrato)
    if (order.seller_id) {
      creditBalance(
        order.seller_id,
        order.escrow_amount,
        orderId,
        `Pagamento ordine #${orderId} – ${order.listing_name}`
      );
    }

    db
      .prepare(
        `UPDATE orders
         SET status = 'completed', escrow_amount = 0,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(orderId);
  });
  txn();

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

// ── Cancellazione ordine con rimborso (solo 'pending') ─────

function cancelOrder(orderId, userId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Ordine non trovato');
  if (order.buyer_id !== userId && order.seller_id !== userId) {
    throw new Error('Non autorizzato');
  }
  if (order.status !== 'pending') throw new Error('Solo gli ordini pending possono essere cancellati');

  const txn = db.transaction(() => {
    // Rimborso acquirente
    creditBalance(
      order.buyer_id,
      order.escrow_amount,
      orderId,
      `Rimborso ordine #${orderId} cancellato`
    );

    // Ripristina quantità listing (se ancora esiste)
    const listing = db.prepare('SELECT qty FROM listings WHERE id = ?').get(order.listing_id);
    if (listing) {
      db
        .prepare('UPDATE listings SET qty = qty + ? WHERE id = ?')
        .run(order.qty, order.listing_id);
    }

    db.prepare("UPDATE orders SET status = 'cancelled', escrow_amount = 0 WHERE id = ?").run(orderId);
  });
  txn();

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
}

// ── Query ordini ───────────────────────────────────────────

function getOrderById(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function getOrdersByBuyer(userId) {
  return db
    .prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC')
    .all(userId);
}

function getOrdersBySeller(userId) {
  return db
    .prepare('SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC')
    .all(userId);
}

module.exports = {
  createOrder,
  markShipped,
  confirmReceipt,
  cancelOrder,
  getOrderById,
  getOrdersByBuyer,
  getOrdersBySeller,
};
