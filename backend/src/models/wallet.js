// backend/src/models/wallet.js
// Gestione del portafoglio utente: saldo, transazioni, depositi, prelievi.
// Tutte le operazioni che modificano il saldo usano transazioni SQLite
// per garantire consistenza.

const db = require('../db');

// ── Lettura saldo ──────────────────────────────────────────

function getBalance(userId) {
  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  return row ? row.balance : 0;
}

// ── Inserimento transazione (uso interno) ──────────────────

function _insertTx(userId, type, amount, referenceId, note) {
  return db
    .prepare(
      `INSERT INTO wallet_transactions (user_id, type, amount, reference_id, note)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(userId, type, amount, referenceId || null, note || null);
}

// ── Deposito fondi ─────────────────────────────────────────
// In produzione questo verrebbe chiamato dal webhook PayPal/banca.
// amount deve essere > 0.

function applyDeposit(userId, amount, method, note) {
  if (amount <= 0) throw new Error('Importo non valido');

  const applyTx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
    _insertTx(userId, 'deposit', amount, null, note || `Ricarica via ${method}`);
  });
  applyTx();

  return getBalance(userId);
}

// ── Addebito (acquisto) ────────────────────────────────────

function debitBalance(userId, amount, orderId, note) {
  if (amount <= 0) throw new Error('Importo non valido');
  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  if (!row || row.balance < amount) throw new Error('Saldo insufficiente');

  const applyTx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
    _insertTx(userId, 'purchase_debit', -amount, orderId, note || 'Acquisto');
  });
  applyTx();

  return getBalance(userId);
}

// ── Accredito (sblocco escrow al venditore) ────────────────

function creditBalance(userId, amount, orderId, note) {
  if (amount <= 0) throw new Error('Importo non valido');

  const applyTx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
    _insertTx(userId, 'sale_credit', amount, orderId, note || 'Pagamento ordine ricevuto');
  });
  applyTx();

  return getBalance(userId);
}

// ── Prelievo ───────────────────────────────────────────────

function requestWithdrawal(userId, amount, method, destination) {
  if (amount <= 0) throw new Error('Importo non valido');
  if (!['iban', 'paypal'].includes(method)) throw new Error('Metodo non supportato');
  if (!destination || destination.trim().length < 3) throw new Error('Destinazione non valida');

  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  if (!row || row.balance < amount) throw new Error('Saldo insufficiente');

  let withdrawalId;

  const applyTx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
    const ins = db
      .prepare(
        `INSERT INTO withdrawals (user_id, amount, method, destination, status)
         VALUES (?, ?, ?, ?, 'pending')`
      )
      .run(userId, amount, method, destination.trim());
    withdrawalId = ins.lastInsertRowid;
    _insertTx(userId, 'withdrawal', -amount, withdrawalId, `Prelievo verso ${method}`);
  });
  applyTx();

  return db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(withdrawalId);
}

// ── Storico transazioni ────────────────────────────────────

function getTransactions(userId, limit) {
  const n = Number(limit) > 0 ? Number(limit) : 50;
  return db
    .prepare(
      `SELECT * FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(userId, n);
}

// ── Storico prelievi ───────────────────────────────────────

function getWithdrawals(userId) {
  return db
    .prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);
}

module.exports = {
  getBalance,
  applyDeposit,
  debitBalance,
  creditBalance,
  requestWithdrawal,
  getTransactions,
  getWithdrawals,
};
