// backend/src/config.js
// Configurazione condivisa per il backend. Legge le variabili d'ambiente
// da `.env` e fornisce valori di default per la configurazione locale.

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Porta del server Express.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Percorso del file SQLite locale.
const DATABASE_FILE = process.env.DATABASE_FILE
  ? path.resolve(process.cwd(), process.env.DATABASE_FILE)
  : path.resolve(__dirname, '..', 'data', 'beymarket.db');

// Segreto JWT per firmare i token di autenticazione.
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-strong-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

module.exports = {
  PORT,
  DATABASE_FILE,
  JWT_SECRET,
  JWT_EXPIRES,
};
