---
id: model-data
title: Model Data, Migration & Seed
sidebar_label: Model Data & Seed
---

# Model Data, Migration & Seed

Halaman ini menjelaskan struktur database, relasi, migration, dan perilaku seed untuk modul Job Requirement. Definisi lengkap ada di `app-karyawan/prisma/schema.prisma` mulai baris 1061.

---

## Peta Relasi

```text
                  master_trainings
                  ├── id, name (unique), category
                  │
                  │ 1..n                      n..1
        job_requirement_trainings ──────────────┐
                  │  profileId, masterTrainingId │
                  │  sortOrder  (unique pair)    │
                  │                              │
  job_requirement_profiles  ◄─────────────────────┘
  ├── id, grade (unique, enum GradeRank)
  ├── minEducation, minExperienceYears
  ├── allowedEmploymentTypes[], allowedGenders[]
  ├── sourceFormNo, sourceRev, effectiveDate, notes
  │
  │ 1..n
  job_requirement_skills
  ├── id, profileId, category ('SOFT_SKILL'|'HARD_SKILL')
  ├── name, masterSkillId?, targetLevel (default 3), sortOrder
  └── unique (profileId, category, name)
              │
              │ n..1 (opsional)
              ▼
      master_skills                       skill_training_map
      ├── id, category, name              ├── masterSkillId
      ├── unique (category, name)         ├── masterTrainingId
      │                                   └── unique pair
      │ 1..n
      ▼
  employee_skill_assessments
  ├── employeeId, category, skillName, masterSkillId?
  ├── periodId ─────────────────► skill_assessment_periods
  ├── level 0..5                  ├── name (unique), startDate, endDate
  ├── assessedByAdminId?          └── isActive (hanya satu)
  ├── assessedAt, notes
  └── unique (employeeId, category, skillName, periodId)
```

Tiga hal yang perlu dicatat:

1. **`masterSkillId` boleh `null`.** Baris requirement tetap berfungsi tanpa katalog; hanya saja skill tersebut tidak bisa menghasilkan rekomendasi training (pemetaan butuh `masterSkillId`).
2. **Asesmen menyimpan `category` + `skillName` sebagai teks**, bukan hanya FK. Ini yang membuat riwayat tetap terbaca walau skill dihapus dari katalog.
3. **Tidak ada kolom bobot.** Bobot sudah dihapus total.

---

## Model Detail

### `JobRequirementProfile` → `job_requirement_profiles`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | `Int` PK autoincrement | |
| `grade` | `GradeRank` **unique** | Enum `RANK_1` … `RANK_11` |
| `minEducation` | `EducationLevel?` | `SMA` / `D3` / `S1` / `S2` |
| `minExperienceYears` | `Int?` | Dibandingkan dengan masa kerja dari `joinDate` |
| `allowedEmploymentTypes` | `EmploymentType[]` | `PERMANENT`, `CONTRACT` |
| `allowedGenders` | `Gender[]` | `MALE`, `FEMALE` |
| `sourceFormNo` | `String?` @100 | Default seed: `SII-QSHE-002-03` |
| `sourceRev` | `String?` @20 | Revisi form |
| `effectiveDate` | `DateTime?` @db.Date | |
| `notes` | `String?` | |
| `createdAt` / `updatedAt` | `DateTime` | |

Satu baris = satu grade. Tidak ada profil per departemen atau per site.

### `JobRequirementSkill` → `job_requirement_skills`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | `Int` PK | |
| `profileId` | `Int` FK → profile | `onDelete: Cascade` |
| `category` | `String` @30 | `SOFT_SKILL` / `HARD_SKILL` |
| `name` | `String` @255 | **Snapshot** nama skill |
| `masterSkillId` | `Int?` FK → `master_skills` | `onDelete: Restrict` |
| `targetLevel` | `Int?` default `3` | `0`–`5`; `0` = tidak disyaratkan |
| `sortOrder` | `Int` default `0` | Urutan tampil |

`@@unique([profileId, category, name])` — satu skill tidak boleh dobel dalam satu grade & kategori.

:::info `name` diduplikasi, bukan hanya relasi
Baris ini menyimpan nama sendiri. Konsekuensinya: mengubah nama di katalog harus disinkronkan manual — yang justru sudah dilakukan endpoint `PUT /api/master/master-skills/:id` dalam satu transaksi.
:::

### `JobRequirementTraining` → `job_requirement_trainings`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `profileId` | `Int` FK | `onDelete: Cascade` |
| `masterTrainingId` | `Int` FK | `onDelete: Restrict` |
| `sortOrder` | `Int` | |

`@@unique([profileId, masterTrainingId])`.

### `MasterSkill` → `master_skills`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | `Int` PK | |
| `category` | `String` @30 | `SOFT_SKILL` / `HARD_SKILL` |
| `name` | `String` @255 | |
| `createdAt` / `updatedAt` | `DateTime` | |

`@@unique([category, name])` — nama unik **per kategori**, jadi `Excel` boleh ada di hard skill dan soft skill sekaligus (meski secara praktik tidak disarankan).

### `SkillAssessmentPeriod` → `skill_assessment_periods`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | `Int` PK | |
| `name` | `String` @100 **unique** | Konvensi `2026-S1` |
| `startDate` / `endDate` | `DateTime` @db.Date | |
| `isActive` | `Boolean` default `false` | Dijaga di layer aplikasi, bukan constraint DB |
| `notes` | `String?` | |

`@@index([isActive])`.

:::warning "Hanya satu aktif" bukan constraint database
Tidak ada unique partial index. Yang menjaga hanya transaksi di `server/routes/skillAssessmentPeriods.js:108` dan `:167`. Jika dua request aktifkan periode berjalan bersamaan, secara teori bisa lolos. Untuk data yang diubah lewat UI, risiko ini dapat diabaikan.
:::

### `EmployeeSkillAssessment` → `employee_skill_assessments`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | `Int` PK | |
| `employeeId` | `Int` FK → `employees` | `onDelete: Cascade` |
| `category` | `String` @30 | |
| `skillName` | `String` @255 | Teks, bukan hanya FK |
| `masterSkillId` | `Int?` FK | `onDelete: SetNull` |
| **`periodId`** | `Int` FK **NOT NULL** | `onDelete: Restrict` |
| `level` | `Int` | `0`–`5` |
| `assessedByAdminId` | `Int?` FK | `onDelete: SetNull` |
| `assessedAt` | `DateTime` default now | Diperbarui setiap upsert |
| `notes` | `String?` | |

`@@unique([employeeId, category, skillName, periodId])` — inilah kunci `upsert`.

### `SkillTrainingMap` → `skill_training_map`

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `masterSkillId` | `Int` FK | `onDelete: Cascade` |
| `masterTrainingId` | `Int` FK | `onDelete: Cascade` |

`@@unique([masterSkillId, masterTrainingId])`. Tabel ini mulai **kosong** dan diisi manual.

---

## Enum yang Terlibat

```prisma
enum GradeRank { RANK_1 RANK_2 RANK_3 RANK_4 RANK_5 RANK_6
                 RANK_7 RANK_8 RANK_9 RANK_10 RANK_11 }

enum EducationLevel { SMA D3 S1 S2 }

enum EmploymentType { PERMANENT CONTRACT }

enum Gender { MALE FEMALE }
```

Tidak ada enum `SkillWeight` — sudah dihapus pada migration `20261104160000_drop_skill_weight`.

---

## Migration

Tujuh migration membentuk modul ini. Dua yang terakhir bersifat destruktif:

| Migration | Isi | Catatan deploy |
| --- | --- | --- |
| `20261103100805_add_job_requirement` | `job_requirement_profiles`, `job_requirement_skills`, `job_requirement_trainings` + enum `GradeRank` | Additive |
| `20261103130957_add_master_skill` | `master_skills` | Additive |
| `20261104090000_add_skill_matrix_foundation` | `skill_assessment_periods`, `employee_skill_assessments`, kolom `targetLevel` | Additive |
| `20261104091000_require_assessment_period` | `employee_skill_assessments.periodId` → `NOT NULL` | **Butuh backfill** bila sudah ada data |
| `20261104140000_add_skill_training_map` | `skill_training_map` | Additive |
| `20261104160000_drop_skill_weight` | Hapus enum `SkillWeight` + kolom `weight` | **Destruktif** (data bobot hilang) |
| `20261105120000_drop_education_other` | Hapus kolom `educationOther` karena pendidikan kini hanya enum | **Destruktif**, tetapi aman: tidak ada baris yang memakai kolom itu |

:::info Mengubah komponen wajib hanya butuh migration saat menghapus kolom
Pendidikan, pengalaman, status karyawan, dan jenis kelamin sudah ada di `job_requirement_profiles` sejak `20261103100805_add_job_requirement`. Migration `20261105120000_drop_education_other` hanya menghapus kolom teks bebas yang tidak lagi dipakai.
:::

Verifikasi status tanpa mengubah apa pun:

```bash
cd app-karyawan
npx prisma migrate status
```

Output yang diharapkan berakhir dengan `Database schema is up to date!`.

Deploy production:

```bash
npx prisma migrate deploy
npx prisma generate
```

:::danger Jangan pakai `migrate dev` di production
`prisma migrate dev` dapat melakukan reset dan membuat migration baru. Di production selalu `migrate deploy`.
:::

---

## Peringatan Seed

Perintah:

```bash
cd app-karyawan
npm run prisma:seed:job-requirement
```

Skrip: `app-karyawan/prisma/seed-job-requirement.mjs`.

Perilaku seed **berbeda** per tabel — ini bagian paling penting:

| Tabel | Perilaku seed | Aman di data existing? |
| --- | --- | --- |
| `master_trainings` | `upsert` per nama; kategori diperbarui | **Aman** |
| `master_skills` | `upsert` per `(category, name)`; tidak menghapus | **Aman** |
| `job_requirement_profiles` | `upsert` per grade; field profil ditimpa nilai seed | Sebagian — perubahan manual pada `minEducation`, `minExperienceYears`, `notes` akan hilang |
| `job_requirement_skills` | `upsert`; **tidak pernah menghapus**; baris di luar seed dipertahankan dengan `console.warn` | **Aman** — `targetLevel` hasil edit HR tidak tersentuh |
| `job_requirement_trainings` | **`deleteMany` lalu `createMany`** per grade | **DESTRUKTIF** |
| `skill_assessment_periods` | Buat `2026-S1` hanya bila belum ada periode aktif | **Aman** |
| `skill_training_map` | Tidak disentuh | **Aman** |
| `employee_skill_assessments` | Tidak disentuh | **Aman** |

:::danger Seed menghapus pemetaan training per grade
`seedProfiles()` menjalankan:

```js
await prisma.jobRequirementTraining.deleteMany({ where: { profileId: savedProfile.id } });
```

sebelum menulis ulang dari daftar `PROFILES`. Artinya **seluruh centang pada tab Pemetaan Grade akan dikembalikan ke bawaan form `SII-QSHE-002-03`**, dan perubahan manual HR hilang tanpa peringatan.

Jangan menjalankan seed ini pada database development/production yang sedang dipakai. Gunakan hanya untuk database baru/kosong.
:::

Perilaku skill yang non-destruktif sengaja dirancang (komentar di `prisma/seed-job-requirement.mjs`):

> *"Skill rows are upserted, never wiped: HR-maintained targetLevel must survive a re-seed."*

---

## Data Contoh pada Database Development

Angka berikut berasal dari database development saat modul ini selesai dibangun. **Bukan angka produksi** dan akan berubah.

| Item | Nilai |
| --- | --- |
| Karyawan | 134 |
| Departemen | 6 |
| Grade yang benar-benar dipakai karyawan | 8 dari 11 (`RANK_1`–`RANK_7`, `RANK_9`) |
| Profil grade tersedia | 11 (`RANK_1`–`RANK_11`) |
| Master skill | 28 (18 soft, 10 hard) |
| Baris requirement skill | 266 |
| Master training | 41 |
| Pemetaan skill→training | 1 |
| Periode aktif | `2026-S1` (id 1) |
| Karyawan yang punya asesmen | 5 |
| Total baris asesmen | 24 |
| Distribusi `targetLevel` | 266 baris bertarget **3** (belum ada variasi) |
| Sel `N/A` pada matriks | ±42% |

Distribusi skill wajib per grade:

| Grade | Jumlah skill wajib |
| --- | --- |
| `RANK_1` | 7 |
| `RANK_2` | 12 |
| `RANK_3` | 26 |
| `RANK_4` – `RANK_8` | 28 |
| `RANK_9` – `RANK_11` | 27 |

:::note Mengapa 42% sel N/A
Kolom matriks adalah gabungan skill seluruh grade dalam departemen (maksimal 28), sementara 113 dari 134 karyawan berada di grade rendah yang hanya mewajibkan 7–12 skill. Sel yang tidak wajib untuk grade karyawan tersebut ditandai `N/A`. Ini bukan data hilang.
:::

Karena semua target masih bernilai 3, readiness saat ini secara efektif setara dengan "proporsi skill yang level-nya ≥ 3". Begitu HR mulai membedakan target antar grade, kedua sistem akan benar-benar berbeda hasilnya.

---

## Menjalankan Test

```bash
cd app-karyawan
npx vitest run server/lib/skillMatrix.test.js server/lib/jobRequirementProfile.test.js
```

18 test `skillMatrix` mencakup:

- 4 status readiness dan transisinya
- target `0` dikecualikan dari penyebut
- skill belum dinilai dihitung 0 pada pembilang
- `null` bila tidak ada asesmen
- pemotongan nilai di atas target (`Math.min`)
- `isComplete`, `completionPercent`, `totalTarget`, `achievedScore`
- kasus 1 dari 7 dinilai → 14% `BELUM_LENGKAP`
- ambang 80% untuk `SIAP`

Test lain:

| Berkas | Jumlah | Cakupan |
| --- | --- | --- |
| `server/lib/jobRequirement.test.js` | 9 | Evaluasi 7 kategori sistem lama |
| `server/lib/jobRequirementProfile.test.js` | 27 | Validasi syarat grade & evaluasi komponen wajib |

Total: **54 test**.

:::info Catatan lint
`npm run lint` hanya mencakup `src/**`. Berkas di `server/` tidak masuk cakupan lint, sehingga error ESLint di sana bersifat pre-existing dan bukan indikator regresi modul ini.
:::

---

## Panduan Rujukan Cepat

| Kebutuhan | Berkas / perintah |
| --- | --- |
| Definisi model | `app-karyawan/prisma/schema.prisma:1061-1198` |
| Rumus readiness | `app-karyawan/server/lib/skillMatrix.js:66-158` |
| Rumus sistem lama | `app-karyawan/server/lib/jobRequirement.js:296-366` |
| Endpoint job requirement | `app-karyawan/server/routes/jobRequirements.js` |
| Endpoint master skill | `app-karyawan/server/routes/masterSkills.js` |
| Endpoint periode | `app-karyawan/server/routes/skillAssessmentPeriods.js` |
| Endpoint master training | `app-karyawan/server/routes/masterTrainings.js` |
| Seed | `app-karyawan/prisma/seed-job-requirement.mjs` |
| Unit test rumus | `app-karyawan/server/lib/skillMatrix.test.js` |
| Validasi syarat grade | `app-karyawan/server/lib/jobRequirementProfile.js` |
| Unit test syarat grade | `app-karyawan/server/lib/jobRequirementProfile.test.js` |
| Cek status DB | `npx prisma migrate status` |
| Jalankan seed | `npm run prisma:seed:job-requirement` |
