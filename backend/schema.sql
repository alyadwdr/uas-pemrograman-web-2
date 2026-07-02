-- =============================================
-- DEAR SKIN — Database Schema
-- =============================================

-- Tabel produk skincare (Inventori)
CREATE TABLE IF NOT EXISTS products (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  category   VARCHAR(100) NOT NULL,
  note       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel log rutinitas harian
CREATE TABLE IF NOT EXISTS routines (
  id           SERIAL PRIMARY KEY,
  date         DATE NOT NULL,
  session      VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'night')),
  item_name    VARCHAR(255) NOT NULL,
  is_checked   BOOLEAN DEFAULT FALSE,
  note         TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (date, session, item_name)
);
