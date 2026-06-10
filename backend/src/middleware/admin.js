// backend/src/middleware/admin.js
// Middleware di autorizzazione per le route admin.
// Deve essere usato DOPO authMiddleware: presuppone che req.user sia già impostato.

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso riservato agli amministratori' });
  }
  next();
}

module.exports = adminMiddleware;
