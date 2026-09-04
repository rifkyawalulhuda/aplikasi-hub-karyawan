---
id: endpoints
title: Daftar API Endpoint
sidebar_label: Endpoint API
---

# Daftar API Endpoint

Semua endpoint menggunakan prefix `/api`. Request yang membutuhkan autentikasi harus menyertakan header:

```
Authorization: Bearer <token>
```

## Autentikasi Admin

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login admin (NIK + password) |
| `POST` | `/api/auth/logout` | Logout admin |
| `POST` | `/api/auth/refresh` | Refresh access token |

## Autentikasi Karyawan

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/employee-auth/login` | Login karyawan (NIK + password) |
| `POST` | `/api/employee-auth/logout` | Logout karyawan |
| `POST` | `/api/employee-auth/refresh` | Refresh token karyawan |

## Health Check

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/health` | Status server, uptime, memory |

## Master Data (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/master/employees` | List karyawan |
| `POST` | `/api/master/employees` | Tambah karyawan |
| `PUT` | `/api/master/employees/:id` | Update karyawan |
| `DELETE` | `/api/master/employees/:id` | Hapus karyawan |
| `POST` | `/api/master/employees/import` | Import Excel |
| `GET` | `/api/master/employees/export` | Export Excel |
| `GET` | `/api/master/admins` | List admin |
| `POST` | `/api/master/admins` | Tambah admin |
| `PUT` | `/api/master/admins/:id` | Update admin |
| `DELETE` | `/api/master/admins/:id` | Hapus admin |
| `GET/POST/PUT/DELETE` | `/api/master/master-units` | CRUD Master Unit |
| `GET/POST/PUT/DELETE` | `/api/master/master-vendors` | CRUD Master Vendor |
| `GET/POST/PUT/DELETE` | `/api/master/site-approval-configs` | Konfigurasi approval |
| `GET` | `/api/master/:resource` | Generic master data (departments, job-levels, dll) |

## Data Karyawan (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET/POST/PUT/DELETE` | `/api/data-karyawan/guidance-records` | Bimbingan & pengarahan |
| `GET/POST/PUT/DELETE` | `/api/data-karyawan/warning-letters` | Surat peringatan |
| `GET/POST/PUT/DELETE` | `/api/data-karyawan/license-certifications` | Lisensi karyawan |
| `GET/POST/PUT/DELETE` | `/api/data-karyawan/employee-leaves` | Cuti (view admin) |
| `GET/POST/PUT/DELETE` | `/api/data-karyawan/employee-leave-database` | Database saldo cuti |

## Data Unit (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET/POST/PUT/DELETE` | `/api/data-unit/license-certifications` | Lisensi & sertifikasi unit |

## Portal Karyawan

Semua endpoint di bawah ini membutuhkan token karyawan.

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/employee-me/profile` | Profil karyawan |
| `PUT` | `/api/employee-me/profile` | Update kontak/email |
| `PUT` | `/api/employee-me/password` | Ubah password |
| `GET` | `/api/employee-me/leave-requests` | Daftar pengajuan cuti |
| `POST` | `/api/employee-me/leave-requests` | Ajukan cuti baru |
| `POST` | `/api/employee-me/leave-requests/:id/resubmit` | Resubmit cuti |
| `POST` | `/api/employee-me/leave-requests/:id/cancel` | Cancel cuti |
| `GET` | `/api/employee-me/leave-approvals` | Daftar approval yang perlu ditindak |
| `POST` | `/api/employee-me/leave-approvals/:id/approve` | Setujui cuti |
| `POST` | `/api/employee-me/leave-approvals/:id/reject` | Tolak cuti |
| `GET` | `/api/employee-me/department-leaves` | Cuti karyawan sedepartemen |
| `GET` | `/api/employee-me/guidance-records` | Riwayat bimbingan |
| `GET` | `/api/employee-me/warning-letters` | Riwayat SP |
| `GET` | `/api/employee-me/trainings` | Riwayat pelatihan |
| `POST` | `/api/employee-me/push-subscriptions` | Daftar push notification |
| `DELETE` | `/api/employee-me/push-subscriptions` | Hapus push subscription |

## Pengaturan Email (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/admin/email-notification-settings` | Load konfigurasi notifikasi |
| `PUT` | `/api/admin/email-notification-settings` | Simpan konfigurasi |
| `POST` | `/api/admin/email-notification-settings/test` | Kirim test email |

## Notifikasi (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/notifications` | Daftar notifikasi admin |
| `PUT` | `/api/notifications/:id/read` | Tandai dibaca |
| `PUT` | `/api/notifications/read-all` | Tandai semua dibaca |

## Dashboard (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/dashboard` | Data ringkasan dashboard |
