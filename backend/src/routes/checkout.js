// backend/src/routes/checkout.js
// Router che gestisce il checkout: aggiorna le quantità dei listing
// in base agli articoli presenti nel carrello dell'utente.

const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Endpoint di checkout protetto da JWT.
router.post('/', auth, (req, res) => {
  const { cart } = req.body;
  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: 'cart richiesto' });
  }

  // Inizia una transazione per mantenere consistenza nelle modifiche.
  const transaction = db;
  transaction.prepare('BEGIN').run();

  try {
    const result = cart.map((item) => {
      const listing = transaction
        .prepare('SELECT id, qty FROM listings WHERE id = ?')
        .get(item.listingId);

      if (!listing) {
        return { listingId: item.listingId, status: 'missing' };
      }

      const newQty = listing.qty - Number(item.qty);
      if (newQty <= 0) {
        transaction.prepare('DELETE FROM listings WHERE id = ?').run(item.listingId);
        return { listingId: item.listingId, status: 'deleted' };
      }

      transaction
        .prepare('UPDATE listings SET qty = ? WHERE id = ?')
        .run(newQty, item.listingId);

      return { listingId: item.listingId, status: 'updated', qty: newQty };
    });

    transaction.prepare('COMMIT').run();
    res.json({ ok: true, result });
  } catch (err) {
    transaction.prepare('ROLLBACK').run();
    res.status(500).json({ error: 'Errore durante il checkout', details: err.message });
  }
});

module.exports = router;
