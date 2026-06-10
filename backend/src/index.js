// backend/src/index.js
// Punto di ingresso del backend Express per BeyMarket.
// Qui si configurano le middleware globali, le route principali e il listener HTTP.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PORT } = require('./config');
const authRoutes     = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const checkoutRoutes = require('./routes/checkout');
const walletRoutes   = require('./routes/wallet');
const ordersRoutes   = require('./routes/orders');
const adminRoutes    = require('./routes/admin');

const app = express();

// Sicurezza HTTP di base e CORS aperto per sviluppo.
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// Mount dei router delle API.
app.use('/auth', authRoutes);
app.use('/listings', listingsRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/wallet', walletRoutes);
app.use('/orders', ordersRoutes);
app.use('/admin', adminRoutes);

// Endpoint di health-check semplice.
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'BeyMarket backend is running' });
});

// Gestione route non trovate.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Avvio del server.
app.listen(PORT, () => {
  console.log(`BeyMarket backend listening on http://localhost:${PORT}`);
});
