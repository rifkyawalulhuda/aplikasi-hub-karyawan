---
id: intro
title: Pengenalan
sidebar_label: Pengenalan
slug: /
---

# Hub Karyawan — Dokumentasi

**Hub Karyawan** adalah aplikasi internal berbasis web untuk mengelola data karyawan, administrasi SDM, dokumen, cuti, notifikasi, dan portal mobile karyawan perusahaan.

## Gambaran Umum

Aplikasi ini terdiri dari tiga area utama:

| Area | Deskripsi | Akses |
|---|---|---|
| **Admin Desktop** | Panel web untuk admin/HR mengelola seluruh data | `https://aplikasi-hub.my.id` |
| **Portal Mobile Karyawan** | PWA untuk karyawan: cuti, profil, notifikasi | `https://pwa.aplikasi-hub.my.id` |
| **Backend API** | REST API Express yang melayani kedua frontend | Port `4000` |

## Tech Stack

### Frontend
- **React 18** + **Vite** — build tool cepat dengan HMR
- **Material UI 5** — komponen UI utama
- **MUI X Data Grid** — tabel data dengan filter dan sorting
- **React Router 6** — client-side routing
- **React Hook Form** — manajemen form dan validasi
- **Vite PWA** — installable Progressive Web App

### Backend
- **Node.js** + **Express** — REST API server
- **Prisma ORM** — query builder dengan type-safety ke PostgreSQL
- **PostgreSQL** — database utama
- **node-cron** — penjadwalan tugas otomatis
- **Nodemailer** + **Brevo API** — pengiriman email
- **Web Push** — push notification browser
- **ExcelJS** + **Multer** — import/export Excel

### Infrastruktur
- **Docker Compose** — PostgreSQL lokal untuk development
- **PM2** — process manager di server production
- **Cloudflare Tunnel** — publikasi domain lokal ke internet
- **GitHub Actions** — CI/CD deployment

## Modul Utama

```
aplikasi-hub-karyawan/
├── Data Master          → Karyawan, Admin, Unit, Vendor, Dokumen
├── Data Karyawan        → Bimbingan, Surat Peringatan, Lisensi, Pelatihan, Cuti
├── Data Unit            → Lisensi & Sertifikasi Unit
├── Portal Mobile        → Dashboard karyawan, Cuti, Profil, Notifikasi
├── Notifikasi           → Email, WhatsApp, Push Notification
└── Pengaturan           → Email Notifikasi Otomatis
```

## Navigasi Dokumentasi

- **[Memulai →](/getting-started/prerequisites)** — prasyarat, setup dev, konfigurasi `.env`
- **[Arsitektur →](/architecture/overview)** — gambaran sistem, frontend, backend, database
- **[Modul →](/modules/data-master)** — dokumentasi per fitur/modul
- **[API →](/api/endpoints)** — daftar endpoint REST API
- **[Deployment →](/deployment/production-server)** — panduan deploy ke production
