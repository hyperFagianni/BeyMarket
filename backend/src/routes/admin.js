// backend/src/routes/admin.js
// Route protette per gli amministratori di BeyMarket.
// Tutte le route richiedono autenticazione (authMiddleware) + ruolo admin (adminMiddleware).
//
// Funzionalità:
//   GET  /admin/users                       – lista tutti gli utenti
//   PUT  /admin/users/:id/role              – promuovi/declassa un utente
//   GET  /admin/listings                    – lista tutti gli annunci
//   DELETE /admin/listings/:id             – elimina un annuncio
//   GET  /admin/orders                      – lista tutti gli ordini
//   POST /admin/orders/:id/refund           – forza rimborso acquirente
//   GET  /admin/messages                    – lista conversazioni (coppie)
//   GET  /admin/messages/:uid1/:uid2        – leggi chat tra due utenti

const express  = require('express');
const db       = require('../db');
const auth     = require('../middleware/auth');
const admin    = require('../middleware/admin');
const { getAllUsers, setUserRole } = require('../models/user');
const { creditBalance }            = require('../models/wallet');

const router = express.Router();

// Applica autenticazione + controllo admin a tutte le route di questo router.
router.use(auth, admin);

// ── Utenti ─────────────────────────────────────────────────

// Restituisce tutti gli utenti registrati.
router.get('/users', (req, res) => {
  const users = getAllUsers();
  res.json(users);
});

// Cambia il ruolo di un utente ('user' | 'admin').
router.put('/users/:id/role', (req, res) => {
  const id   = Number(req.params.id);
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Campo "role" obbligatorio' });

  try {
    const updated = setUserRole(id, role);
    if (!updated) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Annunci ────────────────────────────────────────────────

// Restituisce tutti gli annunci con email del venditore.
router.get('/listings', (req, res) => {
  const listings = db
    .prepare(
      `SELECT l.*, u.email AS seller_email
       FROM listings l
       LEFT JOIN users u ON u.id = l.seller_id
       ORDER BY l.id DESC`
    )
    .all();
  res.json(listings);
});

// Elimina un annuncio qualsiasi.
router.delete('/listings/:id', (req, res) => {
  const id   = Number(req.params.id);
  const info = db.prepare('DELETE FROM listings WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Annuncio non trovato' });
  res.json({ ok: true, deleted: id });
});

// ── Ordini ─────────────────────────────────────────────────

// Restituisce tutti gli ordini con email acquirente/venditore.
router.get('/orders', (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.*,
              b.email AS buyer_email,
              s.email AS seller_email
       FROM orders o
       LEFT JOIN users b ON b.id = o.buyer_id
       LEFT JOIN users s ON s.id = o.seller_id
       ORDER BY o.id DESC`
    )
    .all();
  res.json(orders);
});

// Forza rimborso dell'acquirente su qualsiasi ordine non ancora rimborsato.
// Riaccredita l'escrow_amount all'acquirente e segna l'ordine come 'cancelled'.
router.post('/orders/:id/refund', (req, res) => {
  const orderId = Number(req.params.id);
  const order   = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  if (['cancelled', 'refunded'].includes(order.status)) {
    return res.status(400).json({ error: 'Ordine già annullato o rimborsato' });
  }
  if (order.escrow_amount <= 0) {
    return res.status(400).json({ error: 'Nessun importo da rimborsare (escrow vuoto)' });
  }

  const txn = db.transaction(() => {
    creditBalance(
      order.buyer_id,
      order.escrow_amount,
      orderId,
      `Rimborso admin – ordine #${orderId}`
    );

    db
      .prepare(
        `UPDATE orders
         SET status = 'cancelled', escrow_amount = 0
         WHERE id = ?`
      )
      .run(orderId);
  });
  txn();

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.json({ ok: true, order: updated });
});

// ── Messaggi ───────────────────────────────────────────────

// Restituisce le ultime conversazioni distinte (coppie di utenti).
router.get('/messages', (req, res) => {
  const conversations = db
    .prepare(
      `SELECT
         MIN(m.id)                       AS id,
         MIN(u1.email)                   AS user1_email,
         MIN(u2.email)                   AS user2_email,
         CASE WHEN m.sender_id < m.receiver_id
              THEN m.sender_id   ELSE m.receiver_id   END AS uid1,
         CASE WHEN m.sender_id < m.receiver_id
              THEN m.receiver_id ELSE m.sender_id END AS uid2,
         COUNT(*)                        AS msg_count,
         MAX(m.created_at)               AS last_message_at
       FROM messages m
       JOIN users u1 ON u1.id = CASE WHEN m.sender_id < m.receiver_id
                                     THEN m.sender_id ELSE m.receiver_id END
       JOIN users u2 ON u2.id = CASE WHEN m.sender_id < m.receiver_id
                                     THEN m.receiver_id ELSE m.sender_id END
       GROUP BY uid1, uid2
       ORDER BY last_message_at DESC`
    )
    .all();
  res.json(conversations);
});

// Restituisce tutti i messaggi tra due utenti specifici.
router.get('/messages/:uid1/:uid2', (req, res) => {
  const uid1 = Number(req.params.uid1);
  const uid2 = Number(req.params.uid2);

  const messages = db
    .prepare(
      `SELECT m.*, u.email AS sender_email
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`
    )
    .all(uid1, uid2, uid2, uid1);

  res.json(messages);
});

module.exports = router;
