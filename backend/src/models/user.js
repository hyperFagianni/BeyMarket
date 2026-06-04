// backend/src/models/user.js
// Modello dati per gli utenti. Qui risiedono le query verso la tabella
// users e la gestione delle password.

const db = require('../db');
const bcrypt = require('bcryptjs');

// Crea un nuovo utente nel database.
// Salva l'email in minuscolo per uniformità e memorizza l'hash della password.
function createUser(email, password) {
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
  const info = stmt.run(email.toLowerCase(), hash);
  return getUserById(info.lastInsertRowid);
}

// Cerca un utente per email, restituendo anche l'hash della password.
function getUserByEmail(email) {
  return db
    .prepare('SELECT id, email, password, created_at FROM users WHERE email = ?')
    .get(email.toLowerCase());
}

// Recupera un utente per ID, senza esporre la password hashata.
function getUserById(id) {
  return db
    .prepare('SELECT id, email, created_at FROM users WHERE id = ?')
    .get(id);
}

// Confronta la password in chiaro con l'hash memorizzato.
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
};
