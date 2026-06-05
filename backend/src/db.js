// backend/src/db.js
// Inizializza la connessione SQLite e crea le tabelle principali
// se non esistono ancora.

const Database = require('better-sqlite3');
const { DATABASE_FILE } = require('./config');

// Crea o apre il file SQLite locale.
const db = new Database(DATABASE_FILE);

// Attiva il journal in WAL per migliori prestazioni di lettura/scrittura.
db.pragma('journal_mode = WAL');

// Creazione delle tabelle se non esistono già.
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
