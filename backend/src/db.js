// backend/src/db.js
// Inizializza la connessione SQLite e crea le tabelle principali
// se non esistono ancora.

const Database = require('better-sqlite3');
const { DATABASE_FILE } = require('./config');

// Crea o apre il file SQLite locale.
const db = new Database(DATABASE_FILE);

// Attiva il journal in WAL per migliori prestazioni di lettura/scrittura.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Creazione delle tabelle se non esistono già.
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  bey TEXT,
  color TEXT,
  attack INTEGER DEFAULT 0,
  stamina INTEGER DEFAULT 0,
  defense INTEGER DEFAULT 0,
  condition TEXT,
  qty INTEGER DEFAULT 1,
  price REAL DEFAULT 0,
  photo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Storico movimenti di portafoglio per ogni utente.
-- type: 'deposit' | 'purchase_debit' | 'escrow_hold' |
--       'escrow_release' | 'sale_credit' | 'withdrawal'
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  reference_id INTEGER,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ordini con sistema di escrow integrato.
-- status: 'pending' | 'shipped' | 'completed' | 'cancelled' | 'disputed'
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER,
  listing_id INTEGER NOT NULL,
  listing_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  escrow_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Messaggi diretti tra utenti.
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Richieste di prelievo dal conto BeyMarket verso IBAN/PayPal.
-- status: 'pending' | 'processed' | 'failed'
CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// ── Migrazioni per database esistenti ──────────────────────
// Aggiunge colonne che non esistevano nelle versioni precedenti.
const migrations = [
  'ALTER TABLE users ADD COLUMN balance REAL NOT NULL DEFAULT 0',
  "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
  'ALTER TABLE listings ADD COLUMN seller_id INTEGER',
];
for (const sql of migrations) {
  try { db.exec(sql); } catch (_) { /* colonna già presente */ }
}

module.exports = db;
