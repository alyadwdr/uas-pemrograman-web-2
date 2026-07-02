const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/routines?date=YYYY-MM-DD — ambil rutinitas berdasarkan tanggal
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Parameter date wajib diisi' });
  try {
    const result = await pool.query(
      'SELECT * FROM routines WHERE date=$1 ORDER BY session, item_name',
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/routines/month?year=YYYY&month=MM — ambil semua rutinitas dalam satu bulan
router.get('/month', async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'Parameter year dan month wajib diisi' });
  try {
    const result = await pool.query(
      `SELECT * FROM routines
       WHERE EXTRACT(YEAR FROM date) = $1
         AND EXTRACT(MONTH FROM date) = $2
       ORDER BY date, session, item_name`,
      [year, month]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/routines — tambah atau update item rutinitas
router.post('/', async (req, res) => {
  const { date, session, item_name, is_checked, note } = req.body;
  if (!date || !session || !item_name) {
    return res.status(400).json({ error: 'date, session, dan item_name wajib diisi' });
  }
  try {
    // Upsert: insert jika belum ada, update jika sudah ada
    const result = await pool.query(
      `INSERT INTO routines (date, session, item_name, is_checked, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (date, session, item_name)
       DO UPDATE SET is_checked = $4, note = $5
       RETURNING *`,
      [date, session, item_name, is_checked ?? false, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/routines/:id — update status centang / catatan
router.put('/:id', async (req, res) => {
  const { is_checked, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE routines SET is_checked=$1, note=$2 WHERE id=$3 RETURNING *',
      [is_checked ?? false, note || null, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Rutinitas tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/routines/:id — hapus satu item rutinitas
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM routines WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Rutinitas tidak ditemukan' });
    res.json({ message: 'Item rutinitas dihapus', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
