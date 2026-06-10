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
    .prepare('SELECT id, email, password, balance, role, created_at FROM users WHERE email = ?')
    .get(email.toLowerCase());
}

// Recupera un utente per ID, senza esporre la password hashata.
function getUserById(id) {
  return db
    .prepare('SELECT id, email, balance, role, created_at FROM users WHERE id = ?')
    .get(id);
}

// Confronta la password in chiaro con l'hash memorizzato.
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// Restituisce tutti gli utenti (solo campi sicuri) — uso admin.
function getAllUsers() {
  return db
    .prepare('SELECT id, email, balance, role, created_at FROM users ORDER BY id DESC')
    .all();
}

// Aggiorna il ruolo di un utente — uso admin.
function setUserRole(id, role) {
  if (!['user', 'admin'].includes(role)) throw new Error('Ruolo non valido');
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  return getUserById(id);
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  getAllUsers,
  setUserRole,
};
