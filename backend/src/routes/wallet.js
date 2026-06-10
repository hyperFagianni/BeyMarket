// backend/src/routes/wallet.js
// Route per la gestione del portafoglio utente.
//
// Tutti gli endpoint richiedono autenticazione JWT.
//
// Deposito simulato:
//   In produzione sostituire POST /wallet/deposit con i webhook
//   ufficiali di PayPal (IPN/Webhooks) o con la notifica della
//   propria banca per i bonifici. L'endpoint attuale applica
//   immediatamente il saldo per facilitare lo sviluppo locale.

const express = require('express');
const auth    = require('../middleware/auth');
const {
  getBalance,
  applyDeposit,
  requestWithdrawal,
  getTransactions,
  getWithdrawals,
} = require('../models/wallet');

const router = express.Router();

// Tutti gli endpoint del wallet richiedono login.
router.use(auth);

// ── GET /wallet/balance ────────────────────────────────────
// Restituisce il saldo attuale dell'utente autenticato.

router.get('/balance', (req, res) => {
  const balance = getBalance(req.user.id);
  res.json({ balance });
});

// ── POST /wallet/deposit ───────────────────────────────────
// Avvia (e in dev-mode applica immediatamente) una ricarica.
// Body: { amount: number, method: 'paypal'|'bank_transfer'|string }
//
// ⚠ In produzione questo endpoint NON dovrebbe applicare
//   direttamente il saldo: deve essere chiamato solo dopo
//   la conferma del pagamento tramite webhook esterno.

router.post('/deposit', (req, res) => {
  const amount = Number(req.body.amount);
  const method = String(req.body.method || 'manual').trim();

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Importo non valido' });
  }
  if (amount > 10000) {
    return res.status(400).json({ error: 'Importo massimo per operazione: €10.000' });
  }

  try {
    const newBalance = applyDeposit(req.user.id, amount, method);
    res.json({ ok: true, balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /wallet/transactions ───────────────────────────────
// Storico movimenti. Query param: ?limit=N (default 50, max 200).

router.get('/transactions', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const txs   = getTransactions(req.user.id, limit);
  res.json(txs);
});

// ── POST /wallet/withdraw ──────────────────────────────────
// Richiede un prelievo dal saldo verso IBAN o PayPal.
// Body: { amount: number, method: 'iban'|'paypal', destination: string }

router.post('/withdraw', (req, res) => {
  const amount      = Number(req.body.amount);
  const method      = String(req.body.method || '').trim();
  const destination = String(req.body.destination || '').trim();

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Importo non valido' });
  }
  if (!['iban', 'paypal'].includes(method)) {
    return res.status(400).json({ error: 'Metodo deve essere "iban" o "paypal"' });
  }
  if (!destination) {
    return res.status(400).json({ error: 'Destinazione richiesta (IBAN o email PayPal)' });
  }

  try {
    const withdrawal = requestWithdrawal(req.user.id, amount, method, destination);
    res.status(201).json({ ok: true, withdrawal });
  } catch (err) {
    const status = err.message === 'Saldo insufficiente' ? 422 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ── GET /wallet/withdrawals ────────────────────────────────
// Elenco delle richieste di prelievo dell'utente.

router.get('/withdrawals', (req, res) => {
  res.json(getWithdrawals(req.user.id));
});

module.exports = router;
