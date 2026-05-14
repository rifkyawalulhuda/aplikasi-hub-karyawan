# Deploy Aplikasi Hub Karyawan di Xubuntu Server

Dokumen ini menjelaskan cara menjalankan aplikasi di server Xubuntu lokal dengan:

- PostgreSQL via Docker Compose
- Backend Express di port `4000`
- Frontend Vite build/preview di port `5173`
- Cloudflare Tunnel untuk akses publik

Domain yang dipakai:

- `https://aplikasi-hub.my.id` -> frontend
- `https://www.aplikasi-hub.my.id` -> frontend
- `https://pwa.aplikasi-hub.my.id` -> frontend/PWA karyawan
- `https://api.aplikasi-hub.my.id` -> backend API

## 1. Masuk ke Folder Project

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan/app-karyawan
```

## 2. Install Dependency Node.js

```bash
npm install
```

## 3. Jalankan Database PostgreSQL

Project ini sudah menyediakan `docker-compose.yml` untuk PostgreSQL.

```bash
npm run db:up
```

Cek container:

```bash
docker ps
```

Pastikan container `app-karyawan-postgres` aktif.

Konfigurasi database dari Docker Compose:

- database: `hub_karyawan`
- user: `postgres`
- password: `postgres`
- host port: `5434`

## 4. Periksa File `.env`

File environment ada di:

```bash
/home/rifky/Public/aplikasi-hub-karyawan/app-karyawan/.env
```

Di Linux/Xubuntu, file yang diawali titik seperti `.env` adalah hidden file. Di file manager tekan `Ctrl + H` untuk menampilkannya.

Nilai penting untuk deployment server ini:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
PORT=4000
VITE_API_BASE_URL="https://api.aplikasi-hub.my.id/api"
APP_BASE_URL="https://aplikasi-hub.my.id"
EMPLOYEE_PWA_BASE_URL="https://pwa.aplikasi-hub.my.id"
```

Amankan permission file `.env`:

```bash
chmod 600 .env
```

## 5. Setup Prisma dan Database Schema

Generate Prisma Client:

```bash
npx prisma generate
```

Jalankan migration untuk database production/lokal server:

```bash
npx prisma migrate deploy
```

Jika perlu membuat data login awal:

```bash
npm run prisma:seed:login
```

Tes koneksi backend ke database nanti bisa dilakukan lewat endpoint health:

```bash
curl http://127.0.0.1:4000/api/health
```

## 6. Build Frontend

```bash
npm run build
```

Output build akan dibuat di folder `dist`.

## 7. Install PM2

PM2 dipakai agar backend dan frontend tetap berjalan di background.

```bash
sudo npm install -g pm2
```

## 8. Jalankan Backend dengan PM2

```bash
pm2 start npm --name hub-karyawan-api -- run server
```

Backend berjalan di:

```text
http://127.0.0.1:4000
```

Cek status:

```bash
pm2 status
```

Cek health:

```bash
curl http://127.0.0.1:4000/api/health
```

Respons normal:

```json
{"status":"ok"}
```

## 9. Jalankan Frontend Build dengan PM2

Cloudflare Tunnel diarahkan ke port `5173`, jadi frontend preview dijalankan di port tersebut.

```bash
pm2 start npm --name hub-karyawan-web -- run preview -- --host 0.0.0.0 --port 5173
```

Cek frontend lokal:

```bash
curl http://127.0.0.1:5173
```

## 10. Simpan PM2 agar Auto Start Setelah Reboot

```bash
pm2 save
pm2 startup
```

Perintah `pm2 startup` akan menampilkan satu command `sudo ...`.
Jalankan command tersebut, lalu simpan ulang:

```bash
pm2 save
```

## 11. Install `cloudflared`

Cek apakah `cloudflared` sudah terpasang:

```bash
cloudflared --version
```

Jika belum ada, install:

```bash
curl --location --output cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$(dpkg --print-architecture).deb"
sudo dpkg -i cloudflared.deb
cloudflared --version
```

Referensi resmi Cloudflare:

```text
https://developers.cloudflare.com/tunnel/downloads/
```

## 12. Jalankan Cloudflare Tunnel Manual

File config Xubuntu:

```bash
/home/rifky/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml
```

Jalankan tunnel:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan
cloudflared tunnel --config /home/rifky/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml run
```

Tes API publik:

```bash
curl https://api.aplikasi-hub.my.id/api/health
```

Respons normal:

```json
{"status":"ok"}
```

## 13. Jadikan Cloudflare Tunnel Service Systemd

Buat service:

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

Jika lokasi binary `cloudflared` berbeda, cek:

```bash
which cloudflared
```

Lalu sesuaikan bagian `ExecStart`.

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hub-karyawan-cloudflared
```

Cek status:

```bash
sudo systemctl status hub-karyawan-cloudflared
```

Melihat log tunnel:

```bash
journalctl -u hub-karyawan-cloudflared -f
```

## 14. Checklist Verifikasi Akhir

Pastikan semua service hidup:

```bash
docker ps
pm2 status
sudo systemctl status hub-karyawan-cloudflared
```

Tes backend lokal:

```bash
curl http://127.0.0.1:4000/api/health
```

Tes backend publik:

```bash
curl https://api.aplikasi-hub.my.id/api/health
```

Tes frontend publik di browser:

```text
https://aplikasi-hub.my.id
https://www.aplikasi-hub.my.id
https://pwa.aplikasi-hub.my.id
```

## 15. Setelah Mesin Restart

Jika server tiba-tiba mati lalu menyala lagi, cek dulu apakah service auto-start sudah hidup.

```bash
docker ps
pm2 status
sudo systemctl status hub-karyawan-cloudflared
```

Kondisi normal setelah restart:

- Docker menyala dan container PostgreSQL aktif
- PM2 memulihkan backend dan frontend
- service `hub-karyawan-cloudflared` aktif

Jika ada yang belum hidup, jalankan manual:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan/app-karyawan
npm run db:up
pm2 resurrect
sudo systemctl start hub-karyawan-cloudflared
```

Jika `pm2 resurrect` belum pernah disiapkan atau daftar prosesnya kosong, jalankan ulang backend dan frontend:

```bash
pm2 start npm --name hub-karyawan-api -- run server
pm2 start npm --name hub-karyawan-web -- run preview -- --host 0.0.0.0 --port 5173
pm2 save
```

Tes ulang setelah semua aktif:

```bash
curl http://127.0.0.1:4000/api/health
curl https://api.aplikasi-hub.my.id/api/health
```

Jika backend masih error, cek log:

```bash
pm2 logs hub-karyawan-api
```

Jika tunnel masih error, cek log:

```bash
journalctl -u hub-karyawan-cloudflared -f
```

## 16. Cara Update Aplikasi

Jika ada update kode baru:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan/app-karyawan
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart hub-karyawan-api
pm2 restart hub-karyawan-web
```

Cek ulang:

```bash
pm2 status
curl https://api.aplikasi-hub.my.id/api/health
```

## 17. Mode Development Lokal

Untuk development biasa, jalankan dari root project:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan
./run-dev.sh
```

Atau langsung:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan/app-karyawan
npm run dev:full:host
```

Catatan:

- Mode development memakai Vite dev server.
- Mode production di dokumen ini memakai `npm run build` dan `npm run preview`.
- Jika ingin development lokal tanpa Cloudflare Tunnel, `VITE_API_BASE_URL` bisa dikembalikan sementara ke `/api`.

## 18. Troubleshooting Singkat

### API Health Error

Cek database:

```bash
docker ps
```

Cek log backend:

```bash
pm2 logs hub-karyawan-api
```

### Frontend Tidak Bisa Akses API

Pastikan:

- backend aktif di port `4000`
- tunnel API aktif
- `.env` memakai `VITE_API_BASE_URL="https://api.aplikasi-hub.my.id/api"`
- domain frontend ada di `CORS_ALLOWED_ORIGINS`

### Tunnel Tidak Jalan

Cek status:

```bash
sudo systemctl status hub-karyawan-cloudflared
```

Cek log:

```bash
journalctl -u hub-karyawan-cloudflared -f
```

Jalankan manual untuk melihat error lebih jelas:

```bash
cloudflared tunnel --config /home/rifky/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan-api.xubuntu.yml run
```

### Port Sudah Dipakai

Cek proses yang memakai port:

```bash
sudo ss -ltnp | grep -E ':4000|:5173|:5434'
```

Restart PM2:

```bash
pm2 restart hub-karyawan-api
pm2 restart hub-karyawan-web
```
