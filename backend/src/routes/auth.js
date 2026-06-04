// backend/src/routes/auth.js
// Router per le operazioni di autenticazione: registrazione, login e verifica
// dell'utente autenticato.

const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail, verifyPassword } = require('../models/user');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');

const router = express.Router();

// Crea un JWT per l'utente.
function makeToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

// Restituisce solo i campi sicuri dell'utente.
function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
  };
}

// Registrazione utente.
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password richieste' });
  }

  // Evita registrazioni duplicate.
  if (getUserByEmail(email)) {
    return res.status(409).json({ error: 'Email già registrata' });
  }

  // Salva utente e restituisce token.
  const user = createUser(email, password);
  const token = makeToken(user);
  res.status(201).json({ user: safeUser(user), token });
});

// Login utente.
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password richieste' });
  }

  const row = getUserByEmail(email);
  if (!row || !verifyPassword(password, row.password)) {
    return res.status(401).json({ error: 'Email o password non corretti' });
  }

  const user = { id: row.id, email: row.email };
  const token = makeToken(user);
  res.json({ user, token });
});

// Restituisce i dati dell'utente autenticato dal token.
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = getUserByEmail(payload.email);
    if (!user) {
      throw new Error('Unauthorized');
    }
    res.json(safeUser(user));
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;
