---
id: env-configuration
title: Konfigurasi Environment
sidebar_label: Konfigurasi Environment
---

# Konfigurasi Environment

Semua konfigurasi runtime diatur melalui file `.env` di dalam folder `app-karyawan`.

## File Environment

| File | Digunakan Untuk |
|------|----------------|
| `.env` | Development lokal + production server |
| `.env.example` | Template dengan nilai default/contoh |
| `.env.production` | Override khusus saat build production (`npm run build:prod`) |

## Variabel Environment

### Database

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
```

Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`

Untuk production dengan banyak concurrent user, tambahkan connection limit:
```env
DATABASE_URL="postgresql://user:pass@host:5432/hub_karyawan?schema=public&connection_limit=10"
```

### Backend

```env
PORT=4000
ADMIN_AUTH_SECRET="dev-admin-auth-secret"
EMPLOYEE_AUTH_SECRET="dev-employee-auth-secret"
```

:::danger Penting
`ADMIN_AUTH_SECRET` dan `EMPLOYEE_AUTH_SECRET` digunakan untuk signing JWT token. Di production, ganti dengan nilai random yang panjang dan unik. Jangan gunakan nilai default.
:::

### Frontend / URL Publik

```env
VITE_API_BASE_URL="/api"
APP_BASE_URL="https://aplikasi-hub.my.id"
EMPLOYEE_PWA_BASE_URL="https://pwa.aplikasi-hub.my.id"
```

- `VITE_API_BASE_URL`: URL prefix untuk API request dari frontend. Di dev: `/api` (proxy via Vite). Di production: `https://api.aplikasi-hub.my.id/api`
- `APP_BASE_URL`: URL publik aplikasi admin, digunakan untuk link di email
- `EMPLOYEE_PWA_BASE_URL`: URL publik portal mobile karyawan

### CORS

```env
CORS_ALLOWED_ORIGINS="http://localhost:5173,https://aplikasi-hub.my.id,..."
```

Daftar origin yang diizinkan, dipisahkan koma. Mendukung wildcard `*` (contoh: `https://pwa-karyawan*.vercel.app`).

### Email (SMTP / Brevo)

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user@smtp-brevo.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Workflow Pengajuan Cuti

# Brevo API v3 (lebih direkomendasikan, tidak terikat IP)
BREVO_API_KEY=xkeysib-...
```

Jika `BREVO_API_KEY` diset, email dikirim via Brevo API (tidak butuh whitelist IP). Jika tidak, fallback ke SMTP.

:::info
Sender email (`SMTP_FROM`) harus diverifikasi di dashboard Brevo sebelum bisa digunakan.
:::

### WhatsApp

```env
# Provider: "fonnte" (default) atau "waha"
WHATSAPP_PROVIDER=fonnte

# Fonnte (production)
FONNTE_TOKEN=your-fonnte-token

# WAHA self-hosted (development)
WAHA_URL=https://waha.yourdomain.com
WAHA_API_KEY=your-waha-api-key
WAHA_SESSION=Default
```

:::warning
`WAHA_SESSION` bersifat case-sensitive. Pastikan nama session persis sama dengan yang ada di dashboard WAHA.
:::

### Push Notification

```env
PUSH_VAPID_PUBLIC_KEY=BDBjOA-5ROFb...
PUSH_VAPID_PRIVATE_KEY=Mv3qLc2Dwoc...
PUSH_VAPID_SUBJECT=mailto:admin@yourdomain.com
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Contoh `.env` Development Lokal

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
PORT=4000
ADMIN_AUTH_SECRET="dev-admin-secret-change-in-production"
EMPLOYEE_AUTH_SECRET="dev-employee-secret-change-in-production"
VITE_API_BASE_URL="/api"
APP_BASE_URL="http://localhost:5173"
EMPLOYEE_PWA_BASE_URL="http://localhost:5173"
CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=Workflow Pengajuan Cuti
```

## Keamanan File `.env`

Di server production, batasi permission file `.env`:

```bash
chmod 600 .env
```
