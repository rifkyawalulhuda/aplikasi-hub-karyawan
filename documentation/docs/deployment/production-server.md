---
id: production-server
title: Deploy ke Production Server
sidebar_label: Production Server
---

# Deploy ke Production Server

Panduan lengkap untuk menjalankan aplikasi di server Linux (Xubuntu/Ubuntu) dengan PM2.

## Prasyarat Server

- Node.js 18+ terinstal
- Docker & Docker Compose terinstal
- PM2 terinstal secara global: `npm install -g pm2`
- Git terinstal

## 1. Clone & Setup

```bash
git clone https://github.com/rifkyawalulhuda/aplikasi-hub-karyawan.git
cd aplikasi-hub-karyawan/app-karyawan
npm install
```

## 2. Konfigurasi `.env`

Buat file `.env` dengan nilai production:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
PORT=4000
ADMIN_AUTH_SECRET="strong-random-secret-here"
EMPLOYEE_AUTH_SECRET="another-strong-random-secret"
VITE_API_BASE_URL="https://api.aplikasi-hub.my.id/api"
APP_BASE_URL="https://aplikasi-hub.my.id"
EMPLOYEE_PWA_BASE_URL="https://pwa.aplikasi-hub.my.id"
CORS_ALLOWED_ORIGINS="https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id"
BREVO_API_KEY=xkeysib-...
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Workflow Pengajuan Cuti
```

Amankan file:
```bash
chmod 600 .env
```

## 3. Jalankan Database PostgreSQL

```bash
npm run db:up
# atau langsung: docker compose up -d
```

Verifikasi:
```bash
docker ps
# Pastikan: app-karyawan-postgres STATUS=Up (healthy)
```

## 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migration (JANGAN migrate dev di production)
npx prisma migrate deploy

# Seed data admin awal (hanya pertama kali)
npm run prisma:seed:login
```

## 5. Build Frontend

```bash
npm run build:prod
```

Output tersimpan di folder `dist/`. Express akan menyajikan file ini sebagai static assets.

## 6. Jalankan dengan PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # agar PM2 auto-start saat boot server
```

Cek status:
```bash
pm2 status
pm2 logs hub-karyawan-api
```

## 7. Update Aplikasi

Setiap kali ada update kode:

```bash
git pull

cd app-karyawan
npm install

# Jika ada perubahan schema Prisma
npx prisma migrate deploy
npx prisma generate

# Rebuild frontend jika ada perubahan
npm run build:prod

# Restart API
pm2 restart hub-karyawan-api
pm2 save
```

## Konfigurasi PM2 (`ecosystem.config.cjs`)

```js
{
  name: 'hub-karyawan-api',
  script: 'server/index.js',
  instances: 4,          // 4 proses (cluster mode)
  exec_mode: 'cluster',
  max_memory_restart: '512M',
  autorestart: true,
  max_restarts: 10,
  restart_delay: 3000,
}
```

:::info Cluster Mode & Cron Job
PM2 menjalankan 4 instance. Cron job notifikasi kadaluarsa hanya berjalan di instance 0 (via `NODE_APP_INSTANCE === '0'` guard).
:::

## Cek Kesehatan Aplikasi

```bash
curl http://127.0.0.1:4000/api/health
# Respons: {"status":"ok","uptime":...}
```
