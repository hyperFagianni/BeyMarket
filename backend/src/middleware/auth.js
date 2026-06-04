// backend/src/middleware/auth.js
// Middleware di autenticazione JWT. Verifica il token presente nell'header
// Authorization e attacca l'utente valido alla richiesta.

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { getUserById } = require('../models/user');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user; // l'utente autenticato è ora disponibile per le route protette.
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authMiddleware;
