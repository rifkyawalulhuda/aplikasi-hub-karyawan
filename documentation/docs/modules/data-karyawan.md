---
id: data-karyawan
title: Modul Data Karyawan
sidebar_label: Data Karyawan
---

# Modul Data Karyawan

Kumpulan modul untuk mencatat dan memonitor aktivitas administrasi karyawan.

---

## Bimbingan & Pengarahan

**Route:** `/data-karyawan/bimbingan-pengarahan`

Pencatatan formulir bimbingan dan pengarahan karyawan.

**Kategori:**
- `GUIDANCE` — Bimbingan
- `DIRECTION` — Pengarahan

**Fitur:** List, tambah, edit, hapus, detail, cetak A4 (overlay ke template form resmi), bulk print.

---

## Surat Peringatan & Skorsing

**Route:** `/data-karyawan/data-surat-peringatan`

**Kategori dokumen:**
- `WARNING_LETTER` — Surat Peringatan (SP1, SP2, SP3)
- `SUSPENSION` — Skorsing
- `REPRIMAND` — Surat Teguran

**Aturan eskalasi SP:**
- Tanpa SP aktif → boleh SP1, SP2, atau SP3
- Dengan SP1 aktif → hanya SP2 atau SP3
- Dengan SP2 aktif → hanya SP3
- Dengan SP3 aktif → pembuatan SP baru diblokir
- Skorsing dan Teguran tidak mengikuti aturan eskalasi

**Fitur:** List, tambah, edit, hapus, detail, cetak A4, bulk print.

---

## Detail Karyawan

**Route:** `/data-karyawan/detail-karyawan`

Halaman profil lengkap setiap karyawan, menampilkan:
- Data diri dan informasi kepegawaian
- Riwayat bimbingan
- Riwayat surat peringatan
- Lisensi & sertifikasi
- Riwayat pelatihan

---

## Lisensi & Sertifikasi Karyawan

**Route:** `/data-karyawan/lisensi-sertifikasi`

Manajemen dokumen lisensi dan sertifikasi karyawan (SIM, sertifikat K3, dll).

**Field utama:**
| Field | Keterangan |
|-------|-----------|
| Karyawan | Relasi ke employee |
| Jenis Dokumen | Relasi ke master_dok_karyawan |
| Nomor Dokumen | Nomor sertifikat/lisensi |
| Penerbit | Lembaga penerbit |
| Tanggal Kadaluarsa | Tanggal expired |

**Notifikasi Kadaluarsa:** Dikelola di [Pengaturan Email →](/modules/pengaturan-email).

---

## Pelatihan Karyawan

**Route:** `/data-karyawan/pelatihan-karyawan`

Pencatatan program pelatihan beserta daftar peserta.

**Field:** Jenis pelatihan, materi, trainer, institusi, tanggal mulai/selesai, jumlah hari, lokasi, peserta.

---

## Cuti Karyawan

**Route:** `/data-karyawan/cuti-karyawan`

Manajemen pengajuan cuti dari sisi admin. Menampilkan semua pengajuan dari seluruh karyawan dengan filter status, tanggal, dan departemen.

Lihat [Workflow Cuti →](/modules/cuti-workflow) untuk detail alur approval.

---

## Limbah B3

### Pencatatan Limbah B3

**Route:** `/limbah-b3/pencatatan`

Pencatatan pemasukan dan pengeluaran limbah B3.

### Neraca Limbah B3

**Route:** `/limbah-b3/neraca`

Laporan neraca (balance sheet) limbah B3 per jenis dan periode.
