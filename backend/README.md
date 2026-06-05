# BeyMarket Backend

Backend minimale per BeyMarket con autenticazione, gestione account, prodotti e checkout.

## Struttura

- `backend/src/index.js` — avvio server Express
- `backend/src/config.js` — configurazione ambiente
- `backend/src/db.js` — inizializzazione SQLite
- `backend/src/models/` — logica dati per utenti e listings
- `backend/src/routes/` — endpoint API per auth, listings e checkout
- `backend/src/middleware/auth.js` — middleware JWT

## Installazione

1. Apri un terminale in `backend`
2. Copia `.env.example` in `.env`
3. Esegui:

```bash
npm install
```

4. Avvia il server:

```bash
npm start
```

## API principali

- `POST /auth/register` — registra un nuovo utente
- `POST /auth/login` — effettua login
- `GET /auth/me` — dati utente autenticato
- `GET /listings?category=slug` — lista prodotti per categoria
- `POST /listings` — crea un nuovo prodotto (richiede token JWT)
- `POST /checkout` — aggiorna quantità prodotto in base al carrello (richiede token JWT)

## Prossimi passi

- Integrare il frontend con il backend
- Aggiungere validazione più solida (email, password, campi listings)
- Proteggere endpoint di creazione listing e checkout con RLS o policy più granulari
