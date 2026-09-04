---
id: overview
title: Gambaran Arsitektur
sidebar_label: Gambaran Umum
---

# Gambaran Arsitektur

Hub Karyawan adalah aplikasi **full-stack monolitik** dengan backend Express, frontend React (Vite), dan database PostgreSQL — semuanya dalam satu repository.

## Diagram Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                  Internet / Browser                 │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
         ┌───────────▼────────────┐
         │   Cloudflare Tunnel    │
         │ aplikasi-hub.my.id     │
         └───────────┬────────────┘
                     │ HTTP (lokal)
         ┌───────────▼────────────┐
         │   Express (port 4000) │
         │   ┌─────────────────┐  │
         │   │  REST API /api  │  │
         │   └────────┬────────┘  │
         │   ┌────────▼────────┐  │
         │   │ Static dist/    │  │   ← Frontend React (built)
         │   └─────────────────┘  │
         └───────────┬────────────┘
                     │ Prisma ORM
         ┌───────────▼────────────┐
         │  PostgreSQL (port 5434)│
         │  hub_karyawan database │
         └────────────────────────┘
```

## Dua Mode Operasi

### Development

```
Browser
  └── Vite Dev Server :5173  (frontend + HMR)
        └── /api/* → Proxy → Express :4000  (backend)
                                └── PostgreSQL :5434 (Docker)
```

Vite memproxy semua request `/api/*` ke backend Express, sehingga tidak ada masalah CORS di dev.

### Production

```
Internet
  └── Cloudflare Tunnel
        └── Express :4000
              ├── /api/*         → REST API handlers
              └── /* (static)    → dist/ (Vite build output)
```

Di production, Express menjadi server tunggal: melayani API dan sekaligus menyajikan file statis hasil build Vite.

## Komponen Utama

### Frontend (`app-karyawan/src/`)

- **Admin Desktop** — route `/` sampai `/data-*`, `/limbah-b3`, `/pengaturan`
- **Portal Mobile Karyawan** — route `/karyawan/*`, mobile-first PWA
- **Shared Components** — `src/components/` dipakai oleh kedua area

### Backend (`app-karyawan/server/`)

- **`index.js`** — entry point, middleware stack, route registration
- **`routes/`** — handler per resource (auth, employees, leaves, dll)
- **`lib/`** — service layer (email, WhatsApp, push notification, cron job)
- **`middleware/`** — auth guard (admin dan karyawan)

### Database (`app-karyawan/prisma/`)

- **`schema.prisma`** — definisi semua model dan enum
- **`migrations/`** — riwayat perubahan schema (append-only)
- **`seed-login.mjs`** — script untuk membuat data admin awal

## Alur Request

```
User Browser
  → Navbar click
  → React Router (client-side)
  → Komponen halaman
  → apiRequest() / employeeMeRequest()
  → fetch() dengan Bearer token
  → Express route handler
  → Prisma query
  → PostgreSQL
  → Response JSON
  → Komponen React update
```
