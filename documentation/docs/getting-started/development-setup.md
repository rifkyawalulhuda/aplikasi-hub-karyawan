---
id: development-setup
title: Setup Development
sidebar_label: Setup Development
---

# Setup Development

Panduan lengkap untuk menjalankan aplikasi di lingkungan development lokal (Windows/Linux/Mac).

## 1. Clone Repository

```bash
git clone https://github.com/rifkyawalulhuda/aplikasi-hub-karyawan.git
cd aplikasi-hub-karyawan
```

## 2. Masuk ke Folder Aplikasi

Semua pekerjaan development dilakukan di dalam folder `app-karyawan`:

```bash
cd app-karyawan
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Jalankan Database PostgreSQL

Project sudah menyediakan `docker-compose.yml` untuk PostgreSQL:

```bash
npm run db:up
```

Verifikasi container aktif:

```bash
docker ps
# Pastikan: app-karyawan-postgres STATUS=Up
```

Konfigurasi database Docker:
- **Database:** `hub_karyawan`
- **User:** `postgres`
- **Password:** `postgres`
- **Port:** `5434`

## 5. Konfigurasi File `.env`

Salin template environment:

```bash
cp .env.example .env
```

Edit `.env` dengan nilai untuk development lokal:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
PORT=4000
VITE_API_BASE_URL="/api"
ADMIN_AUTH_SECRET="dev-admin-auth-secret"
EMPLOYEE_AUTH_SECRET="dev-employee-auth-secret"
```

Lihat [Konfigurasi Environment →](/getting-started/env-configuration) untuk penjelasan semua variabel.

## 6. Setup Database (Prisma)

Generate Prisma Client dan jalankan migration:

```bash
# Generate client
npx prisma generate

# Jalankan migration
npx prisma migrate deploy

# Buat data login admin awal
npm run prisma:seed:login
```

## 7. Jalankan Development Server

```bash
npm run dev:full:host
```

Perintah ini menjalankan **frontend** dan **backend** secara bersamaan:
- Frontend Vite: `http://localhost:5173`
- Backend Express: `http://localhost:4000`

### Akses dari Perangkat Lain di Jaringan

Karena menggunakan flag `--host`, Vite juga bisa diakses dari perangkat lain di jaringan yang sama via IP lokal (misalnya `http://192.168.1.x:5173`).

## Perintah Development Lainnya

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Hanya frontend Vite |
| `npm run dev:server` | Hanya backend (dengan nodemon) |
| `npm run dev:full` | Frontend + backend (tanpa `--host`) |
| `npm run dev:full:host` | Frontend + backend (dengan `--host`) |
| `npm run dev:server:stop` | Hentikan backend saja |
| `npm run dev:server:status` | Cek status backend |
| `npm run prisma:generate:safe` | Regenerate Prisma tanpa matikan semua node |

## Workflow Harian

```bash
# Setiap hari sebelum mulai coding
cd app-karyawan
npm run dev:full:host
```

:::tip
Jika Prisma perlu di-regenerate (setelah mengubah schema), gunakan `npm run prisma:generate:safe` — ini hanya menghentikan backend dev, bukan semua proses node.
:::

:::warning
Jangan gunakan `Stop-Process -Force` atau `taskkill` ke semua proses `node.exe` — ini akan mematikan semua proses Node termasuk editor dan tools lain.
:::
