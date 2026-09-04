---
id: backend
title: Arsitektur Backend
sidebar_label: Backend
---

# Arsitektur Backend

Backend adalah **Express.js REST API** yang berjalan di Node.js, melayani dua jenis client: Admin Desktop dan Portal Mobile Karyawan.

## Struktur Folder

```
app-karyawan/server/
├── index.js             # Entry point, middleware stack, route registration
├── middleware/
│   ├── requireAdminAuth.js    # Validasi JWT admin
│   └── requireEmployeeAuth.js # Validasi JWT karyawan
├── routes/
│   ├── auth.js          # POST /api/auth/login, /logout, /refresh
│   ├── employeeAuth.js  # POST /api/employee-auth/login
│   ├── employeeMe.js    # GET/POST /api/employee-me/* (portal karyawan)
│   ├── employees.js     # CRUD Master Karyawan
│   ├── admins.js        # CRUD Master Admin
│   ├── masterData.js    # Generic master data (sites, units, dll)
│   ├── employeeLeaves.js        # Manajemen cuti (admin)
│   ├── emailNotificationSettings.js  # Pengaturan email notifikasi
│   └── ...              # Route lainnya per resource
├── lib/
│   ├── prisma.js        # Prisma client singleton
│   ├── emailService.js  # Kirim email via Brevo API / SMTP
│   ├── emailTemplates.js # HTML email templates
│   ├── whatsappService.js # Kirim WhatsApp via Fonnte/WAHA
│   ├── leaveWorkflow.js # Logic approval cuti
│   └── ...
└── jobs/
    └── expiryNotificationJob.js  # Cron job notifikasi kadaluarsa
```

## Middleware Stack

Urutan middleware di `server/index.js`:

```
1. app.set('trust proxy', 1)   — reverse proxy support
2. CORS                        — origin whitelist
3. Helmet                      — security headers
4. compression                 — gzip response
5. express.json({ limit: '1mb' })
6. Rate limiter (auth: 20/15min, api: 200/1min)
7. Request timeout (30s)
8. Routes
9. Static files (dist/)
10. Error handler
```

## Autentikasi

Dua sistem auth yang terpisah:

| Jenis | Endpoint Login | Secret Env Var | Middleware |
|-------|---------------|----------------|------------|
| Admin | `POST /api/auth/login` | `ADMIN_AUTH_SECRET` | `requireAdminAuth` |
| Karyawan | `POST /api/employee-auth/login` | `EMPLOYEE_AUTH_SECRET` | `requireEmployeeAuth` |

Semua token adalah **JWT Bearer** yang dikirim via header `Authorization: Bearer <token>`.

Token admin menyimpan: `{ sub: adminId, role, tokenVersion }`  
Token karyawan menyimpan: `{ sub: employeeId, tokenVersion }`

## Rate Limiting

```js
// Auth endpoints (login)
windowMs: 15 menit, max: 20 request/IP

// API endpoints
windowMs: 1 menit, max: 200 request/IP
```

## Pola Route

Semua route menggunakan helper `withAsync` untuk error handling:

```js
function withAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
```

## Cron Job

`server/jobs/expiryNotificationJob.js` berjalan setiap jam via `node-cron`:
- Jadwal: `0 * * * *` (setiap jam tepat)
- PM2 guard: hanya berjalan pada instance 0 (`NODE_APP_INSTANCE === '0'`)
- Mengecek lisensi/sertifikasi yang kadaluarsa berdasarkan threshold per-site
- Mengirim email notifikasi ke penerima aktif

## Error Handler Global

```js
app.use((error, req, res, next) => {
  if (error.code === 'P2002') return res.status(409).json({ message: 'Data sudah ada.' });
  if (error.code === 'P2003') return res.status(409).json({ message: 'Data masih digunakan.' });
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});
```
