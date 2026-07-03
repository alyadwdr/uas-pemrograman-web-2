# 🌸 Dear Skin — Skincare Tracker

Aplikasi web full-stack untuk membantu pengguna melacak rutinitas skincare harian, mengelola produk yang digunakan, dan memantau konsistensi perawatan kulit dari waktu ke waktu.

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL

---

## Struktur Folder

```
uas-pemrograman-web-2/
├── backend/
│   ├── routes/
│   │   ├── products.js
│   │   └── routines.js
│   ├── .env
│   ├── db.js
│   ├── index.js
│   ├── package.json
│   └── schema.sql
├── frontend/
│   ├── app.js
│   ├── bg-pattern.js
│   ├── calendar.js
│   ├── index.html
│   ├── inventory.js
│   ├── settings.js
│   └── style.css
├── .gitignore
└── README.md
```

---

## Cara Menjalankan di Lokal

### Prasyarat
Pastikan sudah menginstal:
- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/)

---

### 1. Clone Repository

```bash
git clone https://github.com/alyadwdr/uas-pemrograman-web-2.git
cd uas-pemrograman-web-2
```

### 2. Setup Database

Buka pgAdmin, lalu buat database baru bernama `dear_skin`. Setelah itu buka **Query Tool** dan jalankan isi file `backend/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS products (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  category   VARCHAR(100) NOT NULL,
  note       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

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
```

### 3. Setup Backend

Masuk ke folder backend:

```bash
cd backend
```

Buat file `.env` di dalam folder `backend/`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dear_skin
DB_USER=postgres
DB_PASSWORD=password_postgres_kamu
PORT=3000
```

Install dependencies:

```bash
npm install
```

Jalankan server:

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`

### 4. Jalankan Frontend

Buka VS Code, klik kanan file `frontend/index.html`, lalu pilih **Open with Live Server**.

Aplikasi akan terbuka di browser secara otomatis.

---

## Fitur Utama

- Kalender pelacak rutinitas skincare harian (pagi & malam)
- Checklist item rutinitas yang tersimpan ke database
- Manajemen inventori produk skincare per kategori
- Treatment scheduler (jadwal perawatan berkala)
- Kustomisasi default rutinitas & kategori produk
- Background pattern yang bisa diganti-ganti