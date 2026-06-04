// backend/src/routes/listings.js
// Router per la gestione dei prodotti. Offre endpoint pubblici per
// leggere i listings e endpoint protetti per la creazione.

const express = require('express');
const auth = require('../middleware/auth');
const { getListingsByCategory, createListing } = require('../models/listing');

const router = express.Router();

// Recupera i prodotti di una categoria specifica.
router.get('/', (req, res) => {
  const category = req.query.category;
  if (!category) {
    return res.status(400).json({ error: 'category richiesto' });
  }

  const items = getListingsByCategory(category);
  res.json(items);
});

// Crea un nuovo listing. Richiede autenticazione JWT.
router.post('/', auth, (req, res) => {
  const data = req.body;
  if (!data.category || !data.name) {
    return res.status(400).json({ error: 'category e name richiesti' });
  }

  const result = createListing(data);
  res.status(201).json({ id: result.lastInsertRowid });
});

module.exports = router;
