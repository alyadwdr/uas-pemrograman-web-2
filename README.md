# Dear Skin - Skincare Tracker

Aplikasi web untuk membantu pengguna melacak rutinitas skincare harian, mengelola produk yang digunakan, dan memantau konsistensi perawatan kulit dari waktu ke waktu.

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL

---

## Cara Menjalankan di Lokal

### Prasyarat
Pastikan sudah menginstal:
- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/)

---

### 1. Clone Repository

```bash
git clone https://github.com/username/uas-pemrograman-web-2.git
cd uas-pemrograman-web-2
```

### 2. Setup Database

Buat database baru di PostgreSQL:

```sql
CREATE DATABASE dear_skin;
```

Lalu jalankan file migrasi (tersedia di folder `backend/db/`):

```bash
psql -U postgres -d dear_skin -f backend/db/schema.sql
```

### 3. Jalankan Backend

```bash
cd backend
npm install
```

Buat file `.env` di folder `backend/`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dear_skin
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
```

Lalu jalankan server:

```bash
npm start
```

Server berjalan di `http://localhost:3000`

### 4. Jalankan Frontend

Buka folder `frontend/`, lalu jalankan dengan live server (misalnya ekstensi Live Server di VS Code), atau langsung buka file `index.html` di browser.

---

## Fitur Utama

- Kalender pelacak rutinitas skincare harian (pagi & malam)
- Manajemen inventori produk skincare
- Statistik konsistensi perawatan
