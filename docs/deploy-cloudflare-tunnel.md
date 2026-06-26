# Deploy Full Lokal via Cloudflare Tunnel (Tanpa Cloudflare Pages)

Domain utama: `https://aplikasi-hub.my.id`  
Semua aplikasi tetap jalan di server lokal kamu, Cloudflare hanya sebagai reverse proxy publik.

## Arsitektur

- Frontend admin/PWA disajikan dari **folder build statis `dist/`** melalui Express backend
- Backend API berjalan dari mesin lokal
- Akses publik lewat Cloudflare Tunnel:
  - `https://aplikasi-hub.my.id` → Express backend (melayani static `dist/` + API)
  - `https://www.aplikasi-hub.my.id` → Express backend
  - `https://api.aplikasi-hub.my.id` → Express backend (untuk akses API langsung)

> **Catatan penting:** Tunnel sekarang mengarah ke Express (port `4000`), bukan ke Vite dev server (port `5173`).
> Frontend disajikan dari folder `dist/` yang di-build terlebih dahulu, sehingga jauh lebih ringan dan tidak bergantung pada Vite.

## 1. Build Frontend & Jalankan Backend

Build frontend ke folder `dist/`:

```bash
cd app-karyawan
npm run build:prod
```

Jalankan backend (yang sekarang juga melayani static files dari `dist/`):

```bash
npm run start:prod
```

Atau gunakan satu perintah gabungan (build + start):

```bash
npm run deploy:local
```

Untuk production dengan PM2:

```bash
pm2 start ecosystem.config.cjs
```

## 2. Env yang Dipakai

Frontend production/public API (di `.env.production`, digunakan saat build):

```env
VITE_API_BASE_URL=https://api.aplikasi-hub.my.id/api
```

Backend (`.env` di server):

```env
APP_BASE_URL=https://aplikasi-hub.my.id
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id,https://admin.aplikasi-hub.my.id,https://app.aplikasi-hub.my.id
```

## 3. Buat Tunnel Cloudflare

```bash
cloudflared tunnel login
cloudflared tunnel create hub-karyawan
```

Tambahkan DNS route tunnel:

```bash
cloudflared tunnel route dns hub-karyawan aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan www.aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan api.aplikasi-hub.my.id
```

## 4. Konfigurasi Tunnel

Contoh file: `D:\Github\aplikasi-hub-karyawan\cloudflared-hub-karyawan.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<USER>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: www.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: api.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - service: http_status:404
```

> Sekarang semua hostname mengarah ke **port `4000`** (Express), bukan port `5173` (Vite dev server).

Jalankan tunnel:

```bash
cloudflared tunnel --config D:\Github\aplikasi-hub-karyawan\cloudflared-hub-karyawan.yml run
```

## 5. DNS Cloudflare (Penting)

Karena tidak pakai Pages, jangan arahkan DNS ke `*.pages.dev`.

Yang benar:
- `aplikasi-hub.my.id` diarahkan ke tunnel (`<tunnel-id>.cfargotunnel.com`) lewat `tunnel route dns`
- `www.aplikasi-hub.my.id` diarahkan ke tunnel
- `api.aplikasi-hub.my.id` diarahkan ke tunnel

Jika muncul `Origin DNS error (1016)`:
- biasanya record masih menunjuk origin lama (mis. `pages.dev` atau hostname yang tidak resolve)
- hapus record lama `@`/`www` yang salah
- route ulang dengan `cloudflared tunnel route dns ...`

## 6. Verifikasi

1. `https://api.aplikasi-hub.my.id/api/health` → `{"status":"ok"}`
2. `https://aplikasi-hub.my.id` → frontend tampil (dari static build)
3. `https://www.aplikasi-hub.my.id` → frontend tampil
4. `https://aplikasi-hub.my.id/karyawan` → PWA login tampil
5. Tidak ada error CORS pada browser console

## Catatan Operasional

- Akses publik hanya hidup saat:
  - backend lokal menyala (`npm run start:prod` atau `pm2 start`)
  - `cloudflared tunnel` berjalan
  - **Vite dev server tidak perlu jalan** (frontend sudah statis dari `dist/`)
- Gunakan process manager (PM2/NSSM/Task Scheduler) agar backend dan tunnel auto-restart.
- Jika ada perubahan kode frontend, jalankan ulang `npm run build:prod` sebelum restart backend.
- Perbedaan dengan arsitektur lama (Vite dev server):
  - **Lama:** tunnel → Vite `:5173` (berat, HMR, development mode)
  - **Baru:** tunnel → Express `:4000` serving `dist/` (ringan, static files, production build)

## Alur Update Frontend

Setiap kali ada perubahan kode frontend:

```bash
cd app-karyawan
npm run build:prod        # rebuild dist/
pm2 restart hub-karyawan  # atau: npm run start:prod
```

Backend tidak perlu di-restart jika hanya frontend yang berubah (Express membaca `dist/` langsung dari disk).

