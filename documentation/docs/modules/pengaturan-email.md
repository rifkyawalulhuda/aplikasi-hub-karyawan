---
id: pengaturan-email
title: Pengaturan Email Notifikasi
sidebar_label: Pengaturan Email
---

# Pengaturan Email Notifikasi

Modul pengaturan untuk mengkonfigurasi email notifikasi otomatis kadaluarsa lisensi dan sertifikasi.

## Akses

**Route:** `/pengaturan/email-notifikasi`  
**Tersedia untuk:** Semua admin (per site)

## Fitur

### Status & Jadwal

- **Toggle aktif/nonaktif** — aktifkan atau matikan notifikasi otomatis
- **Jam pengiriman** — pilih jam pengiriman email (00:00 – 23:00 WIB)

### Threshold Notifikasi

Tentukan kapan email dikirim sebelum tanggal kadaluarsa. Tersedia terpisah untuk:

- **Lisensi & Sertifikasi Unit**
- **Lisensi & Sertifikasi Karyawan**

**Cara kerja:**
- Threshold disimpan sebagai array hari (contoh: `[90, 60, 30, 0]`)
- `0` berarti notifikasi dikirim pada hari H (hari kadaluarsa)
- Bisa menambahkan angka custom selain preset standar

**Preset default:** 90 hari, 60 hari, 30 hari, Hari-H

**Tambah threshold custom:**
1. Ketik angka hari di kolom input (contoh: `45`)
2. Klik "Tambah" atau tekan Enter
3. Chip baru muncul di daftar threshold

### Penerima Email

Daftar email yang akan menerima notifikasi. Setiap penerima dapat:
- Diaktifkan/dinonaktifkan via checkbox
- Dihapus via tombol hapus
- Ditambahkan via form (email + nama)

:::tip
Hanya penerima yang **checkbox-nya aktif** (✓) yang akan menerima email.
:::

### Tombol Aksi

| Tombol | Fungsi |
|--------|--------|
| **Kirim Test Email** | Kirim email test dengan data contoh ke semua penerima aktif |
| **Simpan Pengaturan** | Simpan semua perubahan ke database |

## Konfigurasi per Site

Setiap site memiliki konfigurasi email terpisah. Admin hanya bisa mengakses konfigurasi site mereka sendiri (`admin.siteId`).

## Cron Job

Di backend, notifikasi dijalankan oleh `server/jobs/expiryNotificationJob.js`:

- **Jadwal:** Setiap jam tepat (`0 * * * *`)
- **Logic:** Cek `isEnabled && sendHour == currentHour` untuk setiap site
- **Query:** Cari lisensi/sertifikasi dengan `expiryDate == today + threshold`
- **PM2:** Hanya berjalan pada instance 0 (cluster guard via `NODE_APP_INSTANCE`)

## Contoh Alur

```
Setiap jam, cron job berjalan:

1. Cek semua site dengan isEnabled=true && sendHour == jam sekarang
2. Untuk setiap site:
   a. Query unit_license_certifications WHERE expiryDate IN [today+90, today+60, today+30, today]
   b. Query employee_license_certifications WHERE expiryDate IN [...]
   c. Jika ada data → kirim email summary ke semua penerima aktif
   d. Email berisi tabel unit dan karyawan dengan urgency badge:
      - Merah = hari H
      - Kuning = ≤ 30 hari
      - Biru = > 30 hari
```
