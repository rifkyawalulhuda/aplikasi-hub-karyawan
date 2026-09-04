---
id: cloudflare-tunnel
title: Cloudflare Tunnel
sidebar_label: Cloudflare Tunnel
---

# Cloudflare Tunnel

Cloudflare Tunnel menghubungkan server lokal ke internet melalui infrastruktur Cloudflare tanpa membuka port di firewall.

## Arsitektur

```
Internet → Cloudflare CDN → Cloudflare Tunnel → Express :4000 (lokal)
```

Express melayani:
- `GET /api/*` → REST API handlers
- `GET /*` → Static files dari `dist/` (frontend build)

## Domain yang Dipakai

| Domain | Tujuan |
|--------|--------|
| `https://aplikasi-hub.my.id` | Aplikasi utama (admin + static) |
| `https://www.aplikasi-hub.my.id` | Alias domain utama |
| `https://api.aplikasi-hub.my.id` | Akses API langsung |
| `https://pwa.aplikasi-hub.my.id` | Portal mobile karyawan |

## Setup Awal

### 1. Install cloudflared

```bash
# Ubuntu/Debian
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

### 2. Login & Buat Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create hub-karyawan
```

### 3. Tambah DNS Route

```bash
cloudflared tunnel route dns hub-karyawan aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan www.aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan api.aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan pwa.aplikasi-hub.my.id
```

## File Konfigurasi Tunnel

Simpan di `.cloudflared/cloudflared-hub-karyawan.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/rifky/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: www.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: api.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - hostname: pwa.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - service: http_status:404
```

## Jalankan Tunnel

### Manual (untuk test)

```bash
cloudflared tunnel --config /path/to/cloudflared-hub-karyawan.yml run
```

### Sebagai Systemd Service (production)

```bash
# Install sebagai service
sudo cloudflared service install

# Atau buat unit file manual
sudo nano /etc/systemd/system/hub-karyawan-cloudflared.service
```

Contoh unit file:

```ini
[Unit]
Description=Cloudflare Tunnel for Hub Karyawan
After=network.target

[Service]
Type=simple
User=rifky
ExecStart=/usr/bin/cloudflared tunnel --config /home/rifky/Public/aplikasi-hub-karyawan/.cloudflared/cloudflared-hub-karyawan.yml run
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable hub-karyawan-cloudflared
sudo systemctl start hub-karyawan-cloudflared
```

## Alur Update Frontend

```bash
cd app-karyawan
npm run build:prod        # Rebuild dist/
pm2 restart hub-karyawan-api  # Restart Express (baca dist/ dari disk)
# Tunnel tidak perlu di-restart
```

## Catatan

- Tunnel harus aktif agar aplikasi bisa diakses dari internet
- Cloudflare Pages **tidak digunakan** — semua disajikan dari Express lokal
- Jika muncul `Origin DNS error 1016`, periksa DNS record di dashboard Cloudflare
