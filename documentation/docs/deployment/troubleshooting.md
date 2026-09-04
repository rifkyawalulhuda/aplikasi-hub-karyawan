---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting
---

# Troubleshooting

Panduan mengatasi masalah umum yang sering ditemui.

---

## Backend / API

### `Authentication failed against database server`

**Penyebab:** Password di `DATABASE_URL` tidak cocok dengan password database yang berjalan.

**Solusi:**
1. Cek password di `DATABASE_URL` pada file `.env`
2. Cek `POSTGRES_PASSWORD` di `docker-compose.yml`
3. Pastikan keduanya sama

```bash
# Tes koneksi dengan password yang benar
curl http://localhost:4000/api/health
```

### `Invalid value for argument stageType. Expected LeaveStageType`

**Penyebab:** Nama jabatan di database tidak cocok dengan mapping di `mapJobLevelToStageType`.

**Solusi:** Pastikan nama Job Level di Master Data menggunakan salah satu dari nama berikut:
- `Foreman`, `General Foreman`, `Section Chief`
- `Deputy Department Manager`, `Department Manager`, `Division Manager`

### `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

**Penyebab:** Server berjalan di belakang reverse proxy tapi `trust proxy` belum dikonfigurasi.

**Solusi:** Pastikan `app.set('trust proxy', 1)` ada di `server/index.js` sebelum rate limiter.

---

## Email

### `Sending has been rejected because the sender is not valid`

**Penyebab:** Sender email (`SMTP_FROM`) belum diverifikasi di dashboard Brevo.

**Solusi:**
1. Login ke [app.brevo.com](https://app.brevo.com)
2. Buka **Senders & Domains** → **Senders**
3. Tambah sender `SMTP_FROM` dan verifikasi email

### `Invalid login: 525 5.7.1 Unauthorized IP address`

**Penyebab:** IP server belum diotorisasi di Brevo untuk SMTP.

**Solusi (pilih salah satu):**
- Gunakan Brevo API: set `BREVO_API_KEY=xkeysib-...` di `.env` (tidak terikat IP)
- Atau: tambah IP server di [app.brevo.com/security/authorised_ips](https://app.brevo.com/security/authorised_ips)

---

## WhatsApp

### Notifikasi WA tidak terkirim

**Cek:**
1. `WHATSAPP_PROVIDER` sudah diset (`fonnte` atau `waha`)
2. Token/API key sudah dikonfigurasi
3. Jika pakai WAHA: `WAHA_SESSION` harus persis sama dengan nama session di dashboard WAHA (case-sensitive)
4. Nomor telepon karyawan diisi di Master Data

---

## Database

### Port `5434` sudah dipakai

```bash
# Linux
sudo ss -ltnp | grep :5434

# Windows PowerShell
Get-NetTCPConnection -LocalPort 5434

# Stop container yang konflik
docker stop <container_name>
```

### Migration gagal

```bash
# Cek status migration
cd app-karyawan
npx prisma migrate status

# Jika ada drift, gunakan migrate resolve (hati-hati di production)
npx prisma migrate resolve --applied <migration_name>
```

---

## Frontend

### Halaman tidak bisa akses API (CORS error)

**Cek:**
1. Backend aktif di port `4000`
2. `VITE_API_BASE_URL` di `.env` sudah benar
3. Domain frontend ada di `CORS_ALLOWED_ORIGINS`

### Perubahan kode tidak muncul di production

```bash
cd app-karyawan
npm run build:prod       # Rebuild frontend
pm2 restart hub-karyawan-api  # Restart Express
```

---

## Cloudflare Tunnel

### Origin DNS error (1016)

**Penyebab:** DNS record di Cloudflare tidak mengarah ke tunnel.

**Solusi:**
```bash
# Re-add DNS route
cloudflared tunnel route dns hub-karyawan aplikasi-hub.my.id
```

### Tunnel tidak berjalan

```bash
# Cek status service
sudo systemctl status hub-karyawan-cloudflared

# Lihat log
journalctl -u hub-karyawan-cloudflared -f

# Jalankan manual untuk debug
cloudflared tunnel --config /path/to/config.yml run
```

---

## PM2

### Backend tidak auto-start setelah reboot

```bash
pm2 startup      # Generate perintah startup
pm2 save         # Simpan proses saat ini
```

### Cek log error

```bash
pm2 logs hub-karyawan-api --lines 100
pm2 logs hub-karyawan-api --err
```

### Restart semua proses

```bash
pm2 restart all
# atau spesifik
pm2 restart hub-karyawan-api
```
