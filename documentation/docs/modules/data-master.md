---
id: data-master
title: Modul Data Master
sidebar_label: Data Master
---

# Modul Data Master

Data Master adalah kumpulan halaman pengelolaan data referensi yang digunakan oleh seluruh modul aplikasi.

## Akses

Menu **Data Master** di navbar admin, tersedia untuk semua role admin.

---

## Master Karyawan

Halaman utama pengelolaan data karyawan perusahaan.

**Route:** `/data-master/master-data-karyawan/employees`

**Fitur:**
- Daftar karyawan dengan filter, sorting, dan pencarian
- Tambah / Edit / Hapus karyawan
- Import Excel (bulk import)
- Export Excel

**Field utama:**
| Field | Keterangan |
|-------|-----------|
| NIK / Employee No | Nomor induk karyawan (unik) |
| Nama Lengkap | Nama karyawan |
| Tipe Kepegawaian | PKWT / PKWTT |
| Departemen | Relasi ke tabel departments |
| Jabatan (Job Level) | Foreman, Section Chief, dll |
| Posisi (Job Role) | Posisi spesifik |
| Group Shift | Opsional, untuk karyawan shift |
| Site | Lokasi site karyawan |
| Tanggal Bergabung | Join date |
| Password | Hash scrypt, untuk login portal karyawan |

**Template Excel Import:** Tersedia via tombol "Unduh Template"

---

## Master Admin

Pengelolaan akun admin yang dapat login ke panel desktop.

**Route:** `/data-master/master-data-karyawan/admins`

**Role yang tersedia:**
- `admin` — akses standar ke semua fitur
- `super_admin` — akses tambahan ke Site Approval Config dan Sites

---

## Site Approval Config

Konfigurasi aturan approval cuti per site. Hanya bisa diakses oleh `super_admin`.

**Route:** `/data-master/master-data-karyawan/site-approval-config`

Menentukan `approvalRank` (urutan dalam alur approval) dan `maxApprovalRank` (batas tertinggi approver) untuk setiap kombinasi Site + Job Level.

---

## Master Data Unit

### Master Unit

**Route:** `/data-master/master-data-unit/master-unit`

Data unit/alat berat yang dimiliki perusahaan.

| Field | Keterangan |
|-------|-----------|
| Nama Unit | Nama alat |
| Jenis Unit | Tipe/kategori alat |
| Kapasitas | Kapasitas alat |
| Serial Number | Nomor seri unit |
| Detail Lainnya | Catatan tambahan |

### Master Vendor

**Route:** `/data-master/master-data-unit/master-vendor`

Data vendor/supplier untuk keperluan sertifikasi unit.

---

## Master Data Dokumen

Halaman-halaman konfigurasi jenis dokumen dan referensi.

| Halaman | Route | Deskripsi |
|---------|-------|-----------|
| Jenis Cuti | `/master-data-dokumen/master-cuti-karyawan` | Jenis-jenis cuti (tahunan, sakit, dll) |
| Dokumen Karyawan | `/master-data-dokumen/master-dok-karyawan` | Jenis lisensi/sertifikat karyawan |
| Dokumen PKB | `/master-data-dokumen/master-dok-pkb` | Pasal-pasal PKB untuk SP |
| Hari Libur | `/master-data-dokumen/master-hari-libur` | Kalender hari libur nasional |
| Jenis Limbah B3 | `/master-data-dokumen/jenis-limbah-b3` | Kode dan nama limbah B3 |

---

## Master Data Lainnya

| Data | Deskripsi |
|------|-----------|
| Department | Departemen perusahaan |
| Work Location | Lokasi kerja (office, workshop, dll) |
| Job Role | Jabatan/posisi karyawan |
| Job Level | Tingkat jabatan (Foreman → Division Manager) |
| Group Shift | Grup shift karyawan |
| Site | Lokasi site perusahaan |
