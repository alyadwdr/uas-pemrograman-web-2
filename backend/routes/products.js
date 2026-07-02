const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/products — ambil semua produk
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — tambah produk baru
router.post('/', async (req, res) => {
  const { name, category, note } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'name dan category wajib diisi' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (name, category, note) VALUES ($1, $2, $3) RETURNING *',
      [name, category, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — edit produk
router.put('/:id', async (req, res) => {
  const { name, category, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name=$1, category=$2, note=$3 WHERE id=$4 RETURNING *',
      [name, category, note || null, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — hapus produk
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json({ message: 'Produk dihapus', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
