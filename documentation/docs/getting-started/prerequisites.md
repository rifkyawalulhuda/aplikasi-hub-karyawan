---
id: prerequisites
title: Prasyarat
sidebar_label: Prasyarat
---

# Prasyarat

Pastikan semua tools berikut sudah terinstal sebelum menjalankan project.

## Tools Wajib

| Tool | Versi Minimal | Keterangan |
|------|--------------|------------|
| **Node.js** | 18.x LTS | Runtime JavaScript |
| **npm** | 9.x | Package manager (bundled dengan Node.js) |
| **Git** | 2.x | Version control |
| **Docker Desktop** | 4.x | Untuk menjalankan PostgreSQL lokal |

## Cara Cek Versi

```bash
node --version    # v18.x.x atau lebih tinggi
npm --version     # 9.x.x atau lebih tinggi
git --version     # git version 2.x.x
docker --version  # Docker version 24.x.x
```

## Instalasi Node.js

Unduh dari [nodejs.org](https://nodejs.org) atau gunakan **nvm** (Node Version Manager):

```bash
# Dengan nvm (Linux/Mac)
nvm install 18
nvm use 18

# Atau dengan nvm-windows
nvm install 18.0.0
nvm use 18.0.0
```

## Instalasi Docker Desktop

1. Unduh Docker Desktop dari [docker.com](https://www.docker.com/products/docker-desktop/)
2. Install dan jalankan Docker Desktop
3. Pastikan Docker Engine berjalan (ikon di system tray aktif)

## Editor (Opsional)

Direkomendasikan menggunakan **VS Code** dengan extensions:
- Prisma (untuk syntax highlighting schema.prisma)
- ESLint + Prettier
- JavaScript and TypeScript Nightly

## Port yang Dibutuhkan

Pastikan port berikut tidak dipakai proses lain:

| Port | Layanan |
|------|---------|
| `4000` | Backend Express API |
| `5173` | Vite dev server (frontend) |
| `5434` | PostgreSQL (Docker) |
