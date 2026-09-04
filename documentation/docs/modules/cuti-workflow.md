---
id: cuti-workflow
title: Workflow Pengajuan Cuti
sidebar_label: Workflow Cuti
---

# Workflow Pengajuan Cuti

Sistem cuti menggunakan alur persetujuan **berjenjang** berdasarkan tingkat jabatan.

## Status Pengajuan

```
SUBMITTED → IN_APPROVAL → APPROVED
                       → REJECTED → (bisa RESUBMIT)
           → CANCELLED (oleh pengaju)
```

| Status | Deskripsi |
|--------|-----------|
| `SUBMITTED` | Baru diajukan, belum masuk proses |
| `IN_APPROVAL` | Sedang dalam proses approval berjenjang |
| `APPROVED` | Disetujui semua tahap |
| `REJECTED` | Ditolak salah satu approver |
| `CANCELLED` | Dibatalkan oleh karyawan |

## Tahapan Approval

| Urutan | Stage Type | Jabatan |
|--------|-----------|---------|
| 0 (opsional) | `FOREMAN_GROUP_SHIFT` | Foreman Group Shift |
| 1 | `FOREMAN` | Foreman |
| 2 | `GENERAL_FOREMAN` | General Foreman |
| 3 | `SECTION_CHIEF` | Section Chief |
| 4 | `DY_DEPT_MANAGER` | Deputy Department Manager |
| 5 | `DEPT_MANAGER` | Department Manager |
| 6 | `SITE_DIV_MANAGER` | Division Manager |

**Catatan:** Tahap `FOREMAN_GROUP_SHIFT` hanya ditambahkan jika karyawan memiliki Group Shift.

## Status per Tahap Approval

| Status | Deskripsi |
|--------|-----------|
| `WAITING` | Belum giliran tahap ini |
| `PENDING` | Menunggu tindakan approver |
| `APPROVED` | Disetujui di tahap ini |
| `REJECTED` | Ditolak di tahap ini |
| `LOCKED` | Tidak aktif (karena tahap sebelumnya ditolak) |

## Logic Resolve Approval

Alur approval ditentukan otomatis saat pengajuan dibuat:

1. **Titik Mulai**: Satu level di atas jabatan pengaju
2. **Lingkup**: Hanya approver dari departemen yang sama
3. **Skip**: Jika tidak ada karyawan di level tertentu, tahap dilewati
4. **Gagal**: Jika tidak ada approver sama sekali → error 400

Contoh: Karyawan dengan jabatan **Foreman**:
```
General Foreman → Section Chief → Dy. Dept. Manager → Dept. Manager → Division Manager
```

## Aturan Validasi Pengajuan

| Aturan | Keterangan |
|--------|-----------|
| Saldo cuti | Harus ada saldo cukup di database cuti tahun bersangkutan |
| Pengganti | Minimal 1, maksimal 4 karyawan pengganti |
| Overlap | Tidak boleh bentrok dengan cuti lain yang aktif/approved |
| Alamat & Alasan | Wajib diisi |

## Notifikasi per Event

| Event | Email | WhatsApp | Push |
|-------|-------|----------|------|
| Pengajuan dikirim | Ke karyawan | Ke karyawan | Ke karyawan |
| Stage aktif | Ke approver | Ke approver | Ke approver |
| Ditolak | Ke karyawan | Ke karyawan | Ke karyawan |
| Disetujui penuh | Ke karyawan | Ke karyawan | Ke karyawan |

## Resubmit

Jika ditolak, karyawan dapat melakukan **Resubmit** yang:
- Membuat revision baru (revisionNo bertambah)
- Memulai alur approval dari awal
- Menyimpan history semua revisi sebelumnya

## Konfigurasi Approval per Site

Setiap site memiliki konfigurasi `SiteApprovalConfig` yang menentukan `approvalRank` dan `maxApprovalRank` per job level. Ini memungkinkan setiap site punya aturan approval yang berbeda.
