// backend/src/routes/orders.js
// Route per la gestione degli ordini con escrow.
//
// Flusso tipico:
//   POST /orders/buy            → acquirente paga, escrow attivato
//   POST /orders/:id/shipped    → venditore segna come spedito
//   POST /orders/:id/confirm    → acquirente conferma ricezione, fondi al venditore
//   POST /orders/:id/cancel     → cancella ordine pending con rimborso

const express = require('express');
const auth    = require('../middleware/auth');
const db      = require('../db');
const {
  createOrder,
  markShipped,
  confirmReceipt,
  cancelOrder,
  getOrderById,
  getOrdersByBuyer,
  getOrdersBySeller,
} = require('../models/order');

const router = express.Router();

router.use(auth);

// ── POST /orders/buy ──────────────────────────────────────
// L'acquirente acquista un prodotto. Il totale viene addebitato
// sul suo saldo e trattenuto in escrow fino alla conferma.
// Body: { listingId: number, qty: number }

router.post('/buy', (req, res) => {
  const listingId = Number(req.body.listingId);
  const qty       = Number(req.body.qty) || 1;

  if (!listingId) {
    return res.status(400).json({ error: 'listingId richiesto' });
  }
  if (qty < 1) {
    return res.status(400).json({ error: 'Quantità non valida' });
  }

  try {
    const order = createOrder({ buyerId: req.user.id, listingId, qty });
    res.status(201).json({ ok: true, order });
  } catch (err) {
    const statusMap = {
      'Saldo insufficiente':          422,
      'Prodotto non trovato':         404,
      'Quantità non disponibile':     409,
      'Non puoi acquistare i tuoi stessi prodotti': 403,
    };
    const status = statusMap[err.message] || 500;
    res.status(status).json({ error: err.message });
  }
});

// ── GET /orders ────────────────────────────────────────────
// Lista degli ordini dell'utente autenticato come acquirente
// e come venditore.

router.get('/', (req, res) => {
  const asBuyer  = getOrdersByBuyer(req.user.id);
  const asSeller = getOrdersBySeller(req.user.id);
  res.json({ asBuyer, asSeller });
});

// ── GET /orders/:id ────────────────────────────────────────

router.get('/:id', (req, res) => {
  const order = getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }
  res.json(order);
});

// ── POST /orders/:id/shipped ──────────────────────────────
// Solo il venditore può segnare l'ordine come spedito.

router.post('/:id/shipped', (req, res) => {
  try {
    const order = markShipped(Number(req.params.id), req.user.id);
    res.json({ ok: true, order });
  } catch (err) {
    const status = err.message === 'Ordine non trovato' ? 404 :
                   err.message === 'Non autorizzato'    ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── POST /orders/:id/confirm ──────────────────────────────
// L'acquirente conferma la ricezione. I fondi in escrow vengono
// trasferiti al saldo del venditore.

router.post('/:id/confirm', (req, res) => {
  try {
    const order = confirmReceipt(Number(req.params.id), req.user.id);
    res.json({ ok: true, order });
  } catch (err) {
    const status = err.message === 'Ordine non trovato' ? 404 :
                   err.message === 'Non autorizzato'    ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── POST /orders/:id/cancel ───────────────────────────────
// Cancella un ordine in stato 'pending'. L'acquirente viene
// rimborsato automaticamente.

router.post('/:id/cancel', (req, res) => {
  try {
    const order = cancelOrder(Number(req.params.id), req.user.id);
    res.json({ ok: true, order });
  } catch (err) {
    const status = err.message === 'Ordine non trovato' ? 404 :
                   err.message === 'Non autorizzato'    ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

// ── POST /orders/:id/tracking ─────────────────────────────
// Solo il venditore può aggiungere/aggiornare il codice di tracciamento.
// Body: { trackingCode: string }

router.post('/:id/tracking', (req, res) => {
  const { trackingCode } = req.body;
  if (!trackingCode || !trackingCode.trim()) {
    return res.status(400).json({ error: 'trackingCode richiesto' });
  }
  const orderId = Number(req.params.id);
  const order   = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  if (order.seller_id !== req.user.id) return res.status(403).json({ error: 'Non autorizzato' });
  if (!['pending', 'shipped'].includes(order.status)) {
    return res.status(400).json({ error: 'Impossibile aggiornare il tracking in questo stato' });
  }
  db.prepare('UPDATE orders SET tracking_code = ? WHERE id = ?').run(trackingCode.trim(), orderId);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({ ok: true, order: updated });
});

// ── POST /orders/:id/dispute ──────────────────────────────
// L'acquirente apre una controversia. L'ordine passa a 'disputed'
// e i fondi rimangono in escrow fino all'intervento dell'admin.
// Body: { reason: string }

router.post('/:id/dispute', (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Motivo della controversia richiesto' });
  }
  const orderId = Number(req.params.id);
  const order   = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Non autorizzato' });
  if (!['pending', 'shipped'].includes(order.status)) {
    return res.status(400).json({ error: 'Non è possibile aprire una controversia in questo stato' });
  }
  db.prepare(
    "UPDATE orders SET status = 'disputed', dispute_reason = ? WHERE id = ?"
  ).run(reason.trim(), orderId);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({ ok: true, order: updated });
});

module.exports = router;
