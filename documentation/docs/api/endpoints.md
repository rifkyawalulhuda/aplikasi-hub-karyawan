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

## Job Requirement (Admin)

Rincian payload, aturan validasi, dan kode error: [Referensi API Job Requirement](/modules/job-requirement/referensi-api).

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/data-karyawan/job-requirement/profiles` | Daftar profil grade + skill + training |
| `GET` | `/api/data-karyawan/job-requirement/profiles/options` | Opsi sah untuk komponen wajib |
| `GET` | `/api/data-karyawan/job-requirement/profiles/:grade` | Profil satu grade |
| `GET` | `/api/data-karyawan/job-requirement/profiles/:grade/impact` | Dampak syarat wajib yang tersimpan |
| `POST` | `/api/data-karyawan/job-requirement/profiles/:grade/impact` | Pratinjau dampak sebelum simpan (Super Admin) |
| `PUT` | `/api/data-karyawan/job-requirement/profiles/:grade` | Ubah syarat wajib + metadata (Super Admin) |
| `GET` | `/api/data-karyawan/job-requirement/employees` | Daftar karyawan + evaluasi + readiness |
| `GET` | `/api/data-karyawan/job-requirement/employees/:id` | Detail evaluasi satu karyawan |
| `PUT` | `/api/data-karyawan/job-requirement/employees/:id/assessments` | Simpan asesmen (upsert) |
| `DELETE` | `/api/data-karyawan/job-requirement/employees/:id/assessments/:category/:skillName` | Hapus asesmen satu skill |
| `GET` | `/api/data-karyawan/job-requirement/assessment-sheet` | Data tab Asesmen Kompetensi |
| `GET` | `/api/data-karyawan/job-requirement/matrix` | Matriks karyawan × skill per departemen |
| `GET` | `/api/data-karyawan/job-requirement/training-needs` | Training wajib yang belum diikuti |
| `GET` | `/api/data-karyawan/job-requirement/skill-training-recommendations` | Rekomendasi training dari gap skill |

## Master Skill & Periode Asesmen (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/master/master-skills` | Katalog skill + jumlah pemakaian |
| `POST` | `/api/master/master-skills` | Tambah skill ke katalog |
| `PUT` | `/api/master/master-skills/:id` | Ubah nama skill (sinkron ke requirement & asesmen) |
| `DELETE` | `/api/master/master-skills/:id` | Hapus skill (409 bila masih dipakai) |
| `DELETE` | `/api/master/master-skills/:id/assessments` | Hapus semua asesmen skill tsb (semua periode) |
| `GET` | `/api/master/master-skills/mapping/:grade` | Peta katalog skill vs satu grade |
| `PUT` | `/api/master/master-skills/mapping/:grade` | Simpan daftar skill wajib (Super Admin) |
| `PUT` | `/api/master/master-skills/mapping/:grade/targets` | Simpan target level (Super Admin) |
| `POST` | `/api/master/master-skills/mapping/:grade/copy-from-above` | Salin union skill dari rank di atas (Super Admin) |
| `GET` | `/api/master/master-skills/training-map` | Seluruh relasi skill → training |
| `PUT` | `/api/master/master-skills/training-map/:masterSkillId` | Ganti pemetaan training satu skill (Super Admin) |
| `GET` | `/api/master/skill-assessment-periods` | Daftar periode asesmen |
| `GET` | `/api/master/skill-assessment-periods/active` | Periode aktif (404 bila tidak ada) |
| `POST` | `/api/master/skill-assessment-periods` | Buat periode (Super Admin) |
| `PUT` | `/api/master/skill-assessment-periods/:id` | Ubah/aktifkan periode (Super Admin) |
| `DELETE` | `/api/master/skill-assessment-periods/:id` | Hapus periode kosong (Super Admin) |

## Master Training (Admin)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/master/master-trainings` | Daftar training + jumlah pemakaian |
| `POST` | `/api/master/master-trainings` | Tambah training |
| `PUT` | `/api/master/master-trainings/:id` | Ubah training |
| `DELETE` | `/api/master/master-trainings/:id` | Hapus training (409 bila masih dipakai) |
| `GET` | `/api/master/master-trainings/:id/usage` | Rincian pemakaian training |
| `GET` | `/api/master/master-trainings/requirement-map/:grade` | Training wajib satu grade |
| `PUT` | `/api/master/master-trainings/requirement-map/:grade` | Simpan training wajib grade |

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
| `GET` | `/api/employee-me/training-records` | Riwayat pelatihan |
| `GET` | `/api/employee-me/job-requirement` | Status job requirement milik karyawan login |
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
