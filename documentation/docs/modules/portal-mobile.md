---
id: portal-mobile
title: Portal Mobile Karyawan
sidebar_label: Portal Mobile
---

# Portal Mobile Karyawan

Portal mobile adalah **Progressive Web App (PWA)** yang dapat diinstal di smartphone, ditujukan untuk karyawan mengakses data pribadi, mengajukan cuti, dan menerima notifikasi.

## Akses

- **URL:** `https://pwa.aplikasi-hub.my.id` (atau `/karyawan` dari domain utama)
- **Login:** Menggunakan Employee No (NIK) + Password
- **Installable:** Bisa diinstal di Android/iOS sebagai app (PWA)

## Halaman-halaman

### Dashboard (`/karyawan`)

Halaman utama portal dengan:
- Ringkasan data diri (nama, departemen, jabatan, group shift)
- Kontak (nomor HP, email)
- **Quick Menu** — shortcut ke semua fitur

**Quick Menu items:**
| Menu | Route | Deskripsi |
|------|-------|-----------|
| Cuti Saya | `/karyawan/cuti` | Pengajuan dan saldo cuti |
| Profil | `/karyawan/profil` | Data diri dan keamanan akun |
| Bimbingan | `/karyawan/bimbingan-pengarahan` | Riwayat bimbingan |
| Pelatihan | `/karyawan/pelatihan` | Daftar pelatihan |
| Catatan | `/karyawan/surat-peringatan` | Riwayat surat peringatan |
| Cuti Departemen | `/karyawan/cuti-departemen` | Status cuti rekan sedepartemen |

### Cuti Saya (`/karyawan/cuti`)

Manajemen cuti karyawan:
- **Tab "Pengajuan":** Daftar semua pengajuan cuti dengan status
- **Tab "Saldo":** Saldo cuti tersisa per jenis cuti
- **Tombol "Ajukan Cuti":** Form pengajuan cuti baru
- **Detail pengajuan:** Lihat detail dan progress approval per tahap

**Form Pengajuan Cuti:**
- Jenis cuti (dari master_cuti_karyawan)
- Periode (tanggal mulai - selesai)
- Alamat selama cuti (wajib)
- Alasan cuti (wajib)
- Pengganti selama cuti (1-4 karyawan)

### Cuti Departemen (`/karyawan/cuti-departemen`)

Daftar karyawan sedepartemen yang sedang dalam proses pengajuan atau sedang cuti.

**Menampilkan:**
- Nama + NIK + jabatan karyawan
- Status (chip kuning=Proses Approval, hijau=Sedang Cuti)
- Periode cuti + jumlah hari + jenis cuti

**Filter:** Semua · Proses Approval · Sedang Cuti

### Approval Cuti (`/karyawan/cuti/approval/:id`)

Halaman untuk approver melakukan tindakan approval:
- Detail pengajuan cuti yang perlu disetujui
- Tombol **Setujui** dan **Tolak** (dengan kolom alasan)
- Hanya tampil jika karyawan adalah approver aktif di tahap tersebut

### Profil (`/karyawan/profil`)

Data diri karyawan:
- Informasi kepegawaian (departemen, jabatan, site, tanggal bergabung)
- Ubah nomor HP dan email (memerlukan verifikasi OTP)
- Ubah password akun portal

### Riwayat Bimbingan (`/karyawan/bimbingan-pengarahan`)

Daftar catatan bimbingan dan pengarahan yang pernah diterima.

### Riwayat Surat Peringatan (`/karyawan/surat-peringatan`)

Daftar SP, skorsing, dan teguran yang pernah diterima.

### Riwayat Pelatihan (`/karyawan/pelatihan`)

Daftar program pelatihan yang pernah diikuti.

## Notifikasi Push

Portal mobile mendukung push notification browser:
- Notifikasi saat ada approval cuti yang perlu ditindak
- Notifikasi perubahan status pengajuan cuti

**Setup:**
1. Buka portal → muncul prompt izin notifikasi → klik "Izinkan"
2. Notifikasi akan aktif di perangkat tersebut

## PWA — Cara Install

### Android (Chrome)
1. Buka portal di Chrome
2. Ketuk menu ⋮ → "Tambahkan ke Layar Utama"
3. Konfirmasi → app terpasang di home screen

### iOS (Safari)
1. Buka portal di Safari
2. Ketuk tombol Share (kotak + panah atas)
3. Pilih "Tambahkan ke Layar Utama"
4. Konfirmasi
