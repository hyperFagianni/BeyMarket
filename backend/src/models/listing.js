const db = require('../db');

function getListingsByCategory(category) {
  return db
    .prepare('SELECT * FROM listings WHERE category = ? ORDER BY id DESC')
    .all(category);
}

function getListingById(id) {
  return db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(id);
}

function createListing(data) {
  return db
    .prepare(
      `INSERT INTO listings
        (category, name, bey, color, attack, stamina, defense, condition, qty, price, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.category,
      data.name,
      data.bey || null,
      data.color || null,
      Number(data.attack) || 0,
      Number(data.stamina) || 0,
      Number(data.defense) || 0,
      data.condition || null,
      Number(data.qty) || 1,
      Number(data.price) || 0,
      data.photo || null
    );
}

function adjustListingQty(id, diff) {
  const item = getListingById(id);
  if (!item) return null;
  const newQty = Math.max(0, Number(item.qty) + Number(diff));
  if (newQty <= 0) {
    db.prepare('DELETE FROM listings WHERE id = ?').run(id);
    return { id, qty: 0, removed: true };
  }
  db.prepare('UPDATE listings SET qty = ? WHERE id = ?').run(newQty, id);
  return { id, qty: newQty, removed: false };
}

module.exports = {
  getListingsByCategory,
  getListingById,
  createListing,
  adjustListingQty,
};
