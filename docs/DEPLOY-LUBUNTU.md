# Deploy Aplikasi Hub Karyawan ke Lubuntu Server

Panduan lengkap step-by-step untuk fresh deployment dari awal.

---

## Catatan Penting

Beberapa file **tidak di-track oleh Git** (di-gitignore), sehingga tidak akan ikut saat `git clone`:

| File | Keterangan | Cara Mendapatkan |
|------|------------|------------------|
| `.env` | Environment variables & secrets | Copy dari Windows atau buat manual |
| `backups/*.sql` | Backup database | Transfer dari Windows via SCP |
| `node_modules/` | Dependencies | Install ulang dengan `npm install` |
| `dist/` | Build output | Build ulang dengan `npm run build` |
| `.cloudflared/*.json` | Tunnel credentials | Login cloudflared ulang |

---

## Arsitektur Deploy

```
Internet
   |
   v
Cloudflare Tunnel (cloudflared)
   |
   v
Express Backend (port 4000)
   |-- serves API routes (/api/*)
   |-- serves static frontend dari dist/
   |-- connects to PostgreSQL (port 5434 via Docker)
```

Domain:
- `https://aplikasi-hub.my.id` → Express (frontend + API)
- `https://www.aplikasi-hub.my.id` → Express
- `https://pwa.aplikasi-hub.my.id` → Express (employee PWA)
- `https://api.aplikasi-hub.my.id` → Express (API only)

---

## Persiapan: Mendapatkan Kode Project

Pilih **salah satu** metode berikut:

### Option A: Clone dari GitHub (Recommended)

Jika repo sudah di-push ke GitHub:

```bash
# Install git (jika belum ada)
sudo apt install -y git

# Clone project
cd /home/$USER/Public
git clone https://github.com/USERNAME/aplikasi-hub-karyawan.git

# Masuk ke folder project
cd aplikasi-hub-karyawan/app-karyawan
```

> **Catatan:** Ganti `USERNAME` dengan username GitHub kamu.

Jika repo private, login dulu:
```bash
git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"
git clone https://github.com/USERNAME/aplikasi-hub-karyawan.git
# Akan diminta input username & password/token GitHub
```

**Kelebihan:** Mudah update (`git pull`), tidak perlu transfer manual.

### Option B: Transfer via SCP dari Windows

Jika belum push ke GitHub, transfer manual dari Windows:

```powershell
# Buka PowerShell di Windows

# Set IP server (ganti dengan IP Lubuntu kamu)
set SERVER_IP=192.168.1.x
set SERVER_USER=rifky

# Transfer seluruh project
scp -r E:\Github\aplikasi-hub-karyawan %SERVER_USER%@%SERVER_IP%:/home/%SERVER_USER%/Public/
```

### Transfer Backup Database (Kedua Metode)

Tetap perlu transfer file backup SQL secara terpisah:

```powershell
scp E:\Github\aplikasi-hub-karyawan\app-karyawan\backups\hub_karyawan_20260828_202710.sql %SERVER_USER%@%SERVER_IP%:/home/%SERVER_USER%/Public/
```

Atau jika pakai metode **Clone dari GitHub**, backup SQL bisa di-skip jika ingin mulai dari database kosong (akan di-migrate oleh Prisma).

---

## FASE 1: Install Prerequisites di Lubuntu

Buka **Terminal** di Lubuntu server (Ctrl+Alt+T).

### Step 1.1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 1.2: Install Node.js 18

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node -v   # Should show v18.x.x
npm -v    # Should show 9.x.x atau lebih
```

### Step 1.3: Install Docker

```bash
# Install Docker
sudo apt install -y docker.io docker-compose-plugin

# Enable Docker agar auto-start
sudo systemctl enable --now docker

# Agar user bisa jalan tanpa sudo
sudo usermod -aG docker $USER

# Logout lalu login lagi agar group生效
# Atau langsung pakai sementara dengan newgrp
newgrp docker

# Verifikasi
docker --version
docker compose version
```

### Step 1.4: Install PM2

```bash
sudo npm install -g pm2

# Verifikasi
pm2 --version
```

### Step 1.5: Install Cloudflared

```bash
# Download cloudflared
ARCH=$(dpkg --print-architecture)
curl --location --output /tmp/cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"

# Install
sudo dpkg -i /tmp/cloudflared.deb

# Verifikasi
cloudflared --version
```

---

## FASE 2: Setup Project

### Step 2.1: Masuk ke Folder Project

```bash
cd /home/$USER/Public/aplikasi-hub-karyawan/app-karyawan
```

### Step 2.2: Install Dependencies

```bash
npm install
```

Jika error karena permission:
```bash
sudo chown -R $USER:$USER /home/$USER/Public/aplikasi-hub-karyawan
npm install
```

### Step 2.3: Setup File Environment

```bash
# Copy .env.example sebagai dasar
cp .env.example .env

# Edit .env
nano .env
```

Isi file `.env` dengan konfigurasi berikut:

```env
# Database - PostgreSQL via Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public&connection_limit=10"

# Backend Express
PORT=4000

# Auth Secrets (GANTI dengan secret yang aman!)
ADMIN_AUTH_SECRET="ganti-dengan-secret-yang-buat-sendiri"
EMPLOYEE_AUTH_SECRET="ganti-dengan-secret-yang-buat-sendiri"

# Frontend API URL (production)
VITE_API_BASE_URL="https://api.aplikasi-hub.my.id/api"

# URL publik
APP_BASE_URL="https://aplikasi-hub.my.id"
EMPLOYEE_PWA_BASE_URL="https://pwa.aplikasi-hub.my.id"

# CORS
CORS_ALLOWED_ORIGINS="https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id,https://admin.aplikasi-hub.my.id,https://app.aplikasi-hub.my.id"

# Email (opsional - sesuaikan)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=email@gmail.com
SMTP_PASS=app-password-disini
SMTP_FROM=email@gmail.com
SMTP_FROM_NAME=Workflow Pengajuan Cuti

# Push Notification (opsional)
PUSH_VAPID_PUBLIC_KEY=""
PUSH_VAPID_PRIVATE_KEY=""
PUSH_VAPID_SUBJECT="mailto:admin@domain.com"

# WhatsApp Fonnte (opsional)
FONNTE_TOKEN=""
```

Simpan file (Ctrl+O, Enter, Ctrl+X).

> **Tips:** Jika ingin copy `.env` dari Windows, bisa pakai SCP:
> ```powershell
> scp E:\Github\aplikasi-hub-karyawan\app-karyawan\.env %SERVER_USER%@%SERVER_IP%:/home/%SERVER_USER%/Public/aplikasi-hub-karyawan/app-karyawan/.env
> ```

### Step 2.4: Amankan File .env

```bash
chmod 600 .env
```

### Step 2.5: Jalankan Database PostgreSQL

```bash
npm run db:up
```

### Step 2.6: Verifikasi Container Running

```bash
docker ps
```

Pastikan container `app-karyawan-postgres` status **Up**.

---

## FASE 3: Restore Database

> **Catatan:** File backup SQL tidak di-track oleh Git (di-gitignore). Jadi jika kamu clone dari GitHub, file backup harus ditransfer secara terpisah dari Windows ke server.

### Step 3.1: Transfer Backup dari Windows (Jika Clone dari GitHub)

```powershell
# Dari PowerShell di Windows
scp E:\Github\aplikasi-hub-karyawan\app-karyawan\backups\hub_karyawan_20260828_202710.sql %SERVER_USER%@%SERVER_IP%:/home/%SERVER_USER%/Public/
```

Lalu di server Lubuntu:
```bash
mkdir -p ~/Public/aplikasi-hub-karyawan/app-karyawan/backups
mv ~/Public/hub_karyawan_20260828_202710.sql ~/Public/aplikasi-hub-karyawan/app-karyawan/backups/
```

### Step 3.2: Cek File Backup

```bash
ls -la ~/Public/aplikasi-hub-karyawan/app-karyawan/backups/
```

### Step 3.3: Restore Database

```bash
docker exec -i app-karyawan-postgres psql -U postgres -d hub_karyawan < /home/$USER/Public/aplikasi-hub-karyawan/app-karyawan/backups/hub_karyawan_20260828_202710.sql
```

### Step 3.4: Verifikasi Data

```bash
docker exec app-karyawan-postgres psql -U postgres -d hub_karyawan -c "
SELECT schemaname, relname, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC 
LIMIT 10;
"
```

### Step 3.5: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3.6: Jalankan Migrations (Pastikan Schema Up-to-date)

```bash
npx prisma migrate deploy
```

### Step 3.7 (Alternatif): Fresh Database Tanpa Restore

Jika **tidak ingin restore backup** dan ingin mulai dari database kosong:

```bash
# Generate Prisma client
npx prisma generate

# Jalankan migration (membuat tabel baru)
npx prisma migrate deploy

# Seed data login awal
npm run prisma:seed:login
```

> **Catatan:** Dengan fresh database, data akan kosong kecuali data login default (CLC000, CLC001, CLC002).

---

## FASE 4: Build Frontend

### Step 4.1: Build

```bash
npm run build
```

Output akan ada di folder `dist/`.

### Step 4.2: Verifikasi Build

```bash
ls -la dist/
```

Pastikan ada file `index.html` di dalam `dist/`.

---

## FASE 5: Jalankan Backend dengan PM2

### Step 5.1: Buat Folder Logs

```bash
mkdir -p logs
```

### Step 5.2: Start Backend

```bash
pm2 start ecosystem.config.cjs
```

Atau manual:
```bash
pm2 start npm --name hub-karyawan-api -- run server
```

### Step 5.3: Cek Status

```bash
pm2 status
```

Pastikan status **online**.

### Step 5.4: Test Backend

```bash
curl http://127.0.0.1:4000/api/health
```

Respons normal:
```json
{"status":"ok","uptime":...,"memory":...}
```

### Step 5.5: Cek Log Jika Error

```bash
pm2 logs hub-karyawan-api
```

### Step 5.6: Simpan PM2 Process List

```bash
pm2 save
```

### Step 5.7: Setup Auto-Start setelah Reboot

```bash
pm2 startup
```

Output akan menampilkan command `sudo env PATH=...`. **Jalankan command tersebut**, lalu:

```bash
pm2 save
```

---

## FASE 6: Setup Cloudflare Tunnel

### Step 6.1: Login Cloudflare

```bash
cloudflared tunnel login
```

Browser akan terbuka. Login ke Cloudflare dan pilih domain `aplikasi-hub.my.id`.

### Step 6.2: Buat Tunnel (Jika Belum)

Jika sudah punya tunnel `hub-karyawan-api`, skip ke Step 6.3.

```bash
cloudflared tunnel create hub-karyawan-api
```

Output akan menampilkan Tunnel ID. Catat ID tersebut.

### Step 6.3: Setup DNS

```bash
cloudflared tunnel route dns hub-karyawan-api aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan-api www.aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan-api pwa.aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan-api api.aplikasi-hub.my.id
```

### Step 6.4: Buat Config File

Buat folder cloudflared:
```bash
mkdir -p /home/$USER/Public/aplikasi-hub-karyawan/.cloudflared
```

Buat file config:
```bash
nano /home/$USER/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml
```

Isi dengan (ganti TUNNEL_ID dan CREDENTIALS-FILE):

```yaml
tunnel: TAMBAHKAN_TUNNEL_ID_DISINI
credentials-file: /home/rifky/Public/aplikasi-hub-karyawan/.cloudflared/TAMBAHKAN_TUNNEL_ID.json

ingress:
  - hostname: aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: www.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: pwa.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: api.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - service: http_status:404
```

Simpan (Ctrl+O, Enter, Ctrl+X).

### Step 6.5: Test Tunnel Manual

```bash
cloudflared tunnel --config /home/$USER/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml run
```

Test di terminal lain:
```bash
curl https://api.aplikasi-hub.my.id/api/health
```

Jika sudah works, tekan Ctrl+C untuk stop.

### Step 6.6: Buat Systemd Service

```bash
sudo nano /etc/systemd/system/hub-karyawan-cloudflared.service
```

Isi file:

```ini
[Unit]
Description=Cloudflare Tunnel - Hub Karyawan
After=network-online.target
Wants=network-online.target

[Service]
User=rifky
Restart=always
RestartSec=5
ExecStart=/usr/bin/cloudflared tunnel --config /home/rifky/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml run

[Install]
WantedBy=multi-user.target
```

**Catatan:** Ganti `rifky` dengan username kamu jika berbeda.

Simpan (Ctrl+O, Enter, Ctrl+X).

### Step 6.7: Aktifkan Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hub-karyawan-cloudflared
```

### Step 6.8: Cek Status Tunnel

```bash
sudo systemctl status hub-karyawan-cloudflared
```

---

## FASE 7: Verifikasi Akhir

### Cek Semua Service

```bash
# Docker
docker ps

# PM2
pm2 status

# Tunnel
sudo systemctl status hub-karyawan-cloudflared
```

### Test Backend Lokal

```bash
curl http://127.0.0.1:4000/api/health
```

### Test Backend Publik

```bash
curl https://api.aplikasi-hub.my.id/api/health
```

### Test Frontend di Browser

Buka browser, akses:
- `https://aplikasi-hub.my.id`
- `https://pwa.aplikasi-hub.my.id`

---

## Data Login Default

| NIK | Password | Role |
|-----|----------|------|
| `CLC000` | `masteradmin123` | super_admin |
| `CLC001` | `admin123` | admin |
| `CLC002` | `user123` | employee |

**Ganti password setelah login pertama kali!**

---

## Setelah Server Restart

Jika server mati lalu menyala lagi:

```bash
# 1. Cek Docker
docker ps
# Jika container mati:
cd /home/$USER/Public/aplikasi-hub-karyawan/app-karyawan
npm run db:up

# 2. Cek PM2
pm2 status
# Jika belum jalan:
pm2 resurrect
# Atau manual:
pm2 start ecosystem.config.cjs
pm2 save

# 3. Cek Tunnel
sudo systemctl status hub-karyawan-cloudflared
# Jika belum jalan:
sudo systemctl start hub-karyawan-cloudflared
```

---

## Update Aplikasi

Jika ada update kode baru (project sudah clone dari GitHub):

```bash
cd /home/$USER/Public/aplikasi-hub-karyawan/app-karyawan

# Pull kode terbaru
git pull

# Install dependencies baru
npm install

# Generate Prisma (jika ada perubahan schema)
npx prisma generate

# Jalankan migration (jika ada migration baru)
npx prisma migrate deploy

# Build ulang frontend
npm run build

# Restart backend
pm2 restart hub-karyawan-api

# Verifikasi
pm2 status
curl http://127.0.0.1:4000/api/health
curl https://api.aplikasi-hub.my.id/api/health
```

> **Catatan:** File `.env` tidak di-track oleh Git, jadi tidak akan terpengaruh oleh `git pull`. Jika ada variabel environment baru di `.env.example`, kamu perlu update `.env` secara manual.

---

## Troubleshooting

### Backend Tidak Jalan

```bash
# Cek log
pm2 logs hub-karyawan-api

# Restart
pm2 restart hub-karyawan-api
```

### Database Error

```bash
# Cek container
docker ps

# Jika mati, start ulang
cd /home/$USER/Public/aplikasi-hub-karyawan/app-karyawan
npm run db:up

# Cek koneksi
docker exec app-karyawan-postgres psql -U postgres -d hub_karyawan -c "SELECT 1;"
```

### Port Sudah Dipakai

```bash
# Cek proses di port 4000
sudo ss -ltnp | grep :4000

# Kill proses yang mengganggu
sudo kill -9 <PID>
```

### Tunnel Error

```bash
# Cek log
journalctl -u hub-karyawan-cloudflared -f

# Restart service
sudo systemctl restart hub-karyawan-cloudflared

# Test manual
cloudflared tunnel --config /home/$USER/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml run
```

### Frontend Tidak Bisa Akses API

Pastikan:
1. Backend aktif di port 4000
2. Tunnel API aktif
3. `.env` memakai `VITE_API_BASE_URL="https://api.aplikasi-hub.my.id/api"`
4. Domain ada di `CORS_ALLOWED_ORIGINS`

---

## Command Cheat Sheet

| Kegunaan | Command |
|----------|---------|
| Cek semua service | `docker ps && pm2 status && sudo systemctl status hub-karyawan-cloudflared` |
| Restart backend | `pm2 restart hub-karyawan-api` |
| Restart tunnel | `sudo systemctl restart hub-karyawan-cloudflared` |
| Cek log backend | `pm2 logs hub-karyawan-api` |
| Cek log tunnel | `journalctl -u hub-karyawan-cloudflared -f` |
| Test health | `curl http://127.0.0.1:4000/api/health` |
| Test publik | `curl https://api.aplikasi-hub.my.id/api/health` |
| Stop backend | `pm2 stop hub-karyawan-api` |
| Start backend | `pm2 start hub-karyawan-api` |
| Hapus backend | `pm2 delete hub-karyawan-api` |
