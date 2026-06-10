// backend/scripts/create-admin.js
// Crea (o promuove) un utente admin nel database BeyMarket.
//
// Uso:
//   node scripts/create-admin.js <email> <password>
//
// Esempi:
//   node scripts/create-admin.js admin@beymarket.it SuperSecret99!
//   node scripts/create-admin.js admin@beymarket.it  # chiede la password interattivamente

const path     = require('path');
const readline = require('readline');

// Carica il db tramite il modulo esistente (applica anche le migrazioni).
const db = require('../src/db');

async function main() {
  const [,, emailArg, passwordArg] = process.argv;

  if (!emailArg) {
    console.error('Uso: node scripts/create-admin.js <email> [password]');
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();

  let password = passwordArg;
  if (!password) {
    password = await askPassword('Password per ' + email + ': ');
  }

  if (!password || password.length < 8) {
    console.error('La password deve essere lunga almeno 8 caratteri.');
    process.exit(1);
  }

  const bcrypt = require('bcryptjs');
  const hash   = bcrypt.hashSync(password, 10);

  // Controlla se l'utente esiste già.
  const existing = db
    .prepare('SELECT id, email, role FROM users WHERE email = ?')
    .get(email);

  if (existing) {
    // Promuovi a admin se non lo è già.
    db.prepare("UPDATE users SET role = 'admin', password = ? WHERE id = ?").run(hash, existing.id);
    console.log(`✅  Utente esistente aggiornato: ${email} → ruolo admin (id ${existing.id})`);
  } else {
    // Crea nuovo utente admin.
    const info = db
      .prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')")
      .run(email, hash);
    console.log(`✅  Nuovo admin creato: ${email} (id ${info.lastInsertRowid})`);
  }

  process.exit(0);
}

function askPassword(prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Nasconde l'input della password
    const stdin = process.openStdin();
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let pwd = '';
    process.stdin.on('data', function handler(ch) {
      ch = ch.toString();
      if (ch === '\n' || ch === '\r' || ch === '\u0003') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(pwd);
      } else if (ch === '\u007f') {
        pwd = pwd.slice(0, -1);
      } else {
        pwd += ch;
      }
    });
    rl.close();
  });
}

main().catch(err => {
  console.error('Errore:', err.message);
  process.exit(1);
});
