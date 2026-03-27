# Deploy Full Lokal via Cloudflare Tunnel (Tanpa Cloudflare Pages)

Domain utama: `https://aplikasi-hub.my.id`  
Semua aplikasi tetap jalan di server lokal kamu, Cloudflare hanya sebagai reverse proxy publik.

## Arsitektur

- Frontend admin/PWA berjalan dari mesin lokal
- Backend API berjalan dari mesin lokal
- Akses publik lewat Cloudflare Tunnel:
  - `https://aplikasi-hub.my.id` -> frontend lokal
  - `https://www.aplikasi-hub.my.id` -> frontend lokal
  - `https://api.aplikasi-hub.my.id` -> backend lokal

## 1. Jalankan Service Lokal

Contoh port:
- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:4000`

Jalankan app:

```bash
cd app-karyawan
npm run dev:full:host
```

## 2. Env yang Dipakai

Frontend production/public API:

```env
VITE_API_BASE_URL=https://api.aplikasi-hub.my.id/api
```

Backend:

```env
APP_BASE_URL=https://aplikasi-hub.my.id
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.3:5173,https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id,https://admin.aplikasi-hub.my.id,https://app.aplikasi-hub.my.id
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
    service: http://127.0.0.1:5173
  - hostname: www.aplikasi-hub.my.id
    service: http://127.0.0.1:5173
  - hostname: api.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - service: http_status:404
```

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

1. `https://api.aplikasi-hub.my.id/api/health` -> `{"status":"ok"}`
2. `https://aplikasi-hub.my.id` -> frontend tampil
3. `https://www.aplikasi-hub.my.id` -> frontend tampil
4. `https://aplikasi-hub.my.id/karyawan` -> PWA login tampil
5. Tidak ada error CORS pada browser console

## Catatan Operasional

- Akses publik hanya hidup saat:
  - server lokal menyala
  - backend lokal menyala
  - `cloudflared tunnel` berjalan
- Gunakan process manager (PM2/NSSM/Task Scheduler) agar backend dan tunnel auto-restart.
