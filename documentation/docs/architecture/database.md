---
id: database
title: Arsitektur Database
sidebar_label: Database
---

# Arsitektur Database

Database menggunakan **PostgreSQL** dengan **Prisma ORM** sebagai query builder dan migration tool.

## Koneksi

```
PostgreSQL
  ← port 5434 (development via Docker)
  ← port 5432 (production)
  ← Prisma Client (generated dari schema.prisma)
```

## Model Utama

### Karyawan & Organisasi

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `Employee` | `employees` | Data karyawan: NIK, nama, jabatan, departemen, dll |
| `MasterAdmin` | `master_admins` | Akun admin dengan role |
| `Department` | `departments` | Departemen |
| `JobLevel` | `job_levels` | Tingkat jabatan (Foreman, Section Chief, dll) |
| `JobRole` | `job_roles` | Jabatan/posisi |
| `WorkLocation` | `work_locations` | Lokasi kerja |
| `MasterSite` | `master_sites` | Site/lokasi utama |
| `MasterGroupShift` | `master_group_shifts` | Group shift |

### Cuti

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `EmployeeLeave` | `employee_leaves` | Pengajuan cuti utama |
| `EmployeeLeaveApproval` | `employee_leave_approvals` | Approval per tahap |
| `EmployeeLeaveDatabase` | `employee_leave_database` | Saldo cuti per karyawan per tahun |
| `MasterCutiKaryawan` | `master_cuti_karyawan` | Jenis cuti |
| `SiteApprovalConfig` | `site_approval_configs` | Konfigurasi approval per site & jabatan |

### Lisensi & Sertifikasi

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `EmployeeLicenseCertification` | `employee_license_certifications` | Lisensi karyawan |
| `UnitLicenseCertification` | `unit_license_certifications` | Lisensi unit/alat |
| `MasterUnit` | `master_units` | Data unit/alat berat |
| `MasterVendor` | `master_vendors` | Data vendor |
| `MasterDokKaryawan` | `master_dok_karyawan` | Jenis dokumen karyawan |

### Notifikasi & Email

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `EmailOutbox` | `email_outbox` | Antrian & log pengiriman email |
| `EmailWorkflowFailureLog` | `email_workflow_failure_logs` | Log kegagalan email workflow |
| `EmailNotificationSettings` | `email_notification_settings` | Pengaturan notifikasi expiry per site |
| `EmployeePushSubscription` | `employee_push_subscriptions` | Subscription push notification |

### Job Requirement & Kompetensi

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `JobRequirementProfile` | `job_requirement_profiles` | Syarat jabatan per grade (`RANK_1`–`RANK_11`), unik per grade |
| `JobRequirementSkill` | `job_requirement_skills` | Skill wajib per grade + `targetLevel` 0–5 |
| `JobRequirementTraining` | `job_requirement_trainings` | Training wajib per grade |
| `MasterSkill` | `master_skills` | Katalog skill, unik per `(category, name)` |
| `SkillTrainingMap` | `skill_training_map` | Pemetaan skill → training untuk rekomendasi gap |
| `SkillAssessmentPeriod` | `skill_assessment_periods` | Periode asesmen semester, hanya satu `isActive` |
| `EmployeeSkillAssessment` | `employee_skill_assessments` | Level skill karyawan per periode, unik per `(employee, category, skill, period)` |

Relasi inti:

```text
job_requirement_profiles ─┬─1..n─ job_requirement_skills ──n..1── master_skills
                          └─1..n─ job_requirement_trainings ──n..1── master_trainings

master_skills ──1..n── skill_training_map ──n..1── master_trainings

employees ──1..n── employee_skill_assessments ──n..1── skill_assessment_periods
                              └──n..1── master_skills (opsional, onDelete: SetNull)
```

Catatan penting:

- `employee_skill_assessments.periodId` bersifat **NOT NULL**; asesmen tanpa periode tidak dapat disimpan.
- Asesmen menyimpan `category` + `skillName` sebagai teks agar riwayat tetap terbaca walau katalog berubah.
- **Tidak ada kolom bobot** — bobot dihapus total; readiness dihitung dari target per skill.
- "Hanya satu periode aktif" dijaga di layer aplikasi, bukan unique partial index.

Rincian lengkap: [Model Data & Seed](/modules/job-requirement/model-data).

## Enum Penting

```prisma
enum LeaveRequestStatus {
  SUBMITTED IN_APPROVAL APPROVED REJECTED CANCELLED
}

enum LeaveStageType {
  FOREMAN_GROUP_SHIFT FOREMAN GENERAL_FOREMAN SECTION_CHIEF
  DY_DEPT_MANAGER DEPT_MANAGER SITE_DIV_MANAGER
}

enum LeaveApprovalStatus {
  WAITING PENDING APPROVED REJECTED LOCKED CANCELLED
}

enum GradeRank {
  RANK_1 RANK_2 RANK_3 RANK_4 RANK_5 RANK_6
  RANK_7 RANK_8 RANK_9 RANK_10 RANK_11
}

enum EducationLevel {
  SMA D3 S1 S2
}
```

## Workflow Migration

### Development

```bash
# Buat migration baru setelah mengubah schema.prisma
npx prisma migrate dev --name nama_migration

# Regenerate Prisma Client setelah migration
npx prisma generate
```

### Production

```bash
# Hanya apply migration yang sudah ada (tidak buat baru)
npx prisma migrate deploy

# Regenerate client
npx prisma generate
```

:::danger
Jangan jalankan `prisma migrate dev` di server production. Gunakan `prisma migrate deploy`.
:::

## Tips Prisma

```bash
# Buka Prisma Studio (GUI database)
npx prisma studio

# Reset database (HAPUS SEMUA DATA - development only)
npx prisma migrate reset

# Cek status migration
npx prisma migrate status
```
