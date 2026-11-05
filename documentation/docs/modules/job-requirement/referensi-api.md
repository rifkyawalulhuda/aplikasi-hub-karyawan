---
id: referensi-api
title: Referensi API Job Requirement
sidebar_label: Referensi API
---

# Referensi API Job Requirement

Seluruh endpoint memerlukan header `Authorization: Bearer <token-admin>`. Tiga router terlibat:

| Router | Prefix | Middleware |
| --- | --- | --- |
| `server/routes/jobRequirements.js` | `/api/data-karyawan/job-requirement` | `requireAdminAuth`, `requireWriteRole`, `requireSiteIsolation({ per-site })` |
| `server/routes/masterSkills.js` | `/api/master/master-skills` | `requireAdminAuth`, `requireWriteRole`, `requireSiteIsolation({ shared })` |
| `server/routes/skillAssessmentPeriods.js` | `/api/master/skill-assessment-periods` | `requireAdminAuth`, `requireWriteRole`, `requireSiteIsolation({ shared })` |
| `server/routes/masterTrainings.js` | `/api/master/master-trainings` | `requireAdminAuth`, `requireWriteRole`, `requireSiteIsolation({ shared })` |

Mount point terdaftar di `app-karyawan/server/index.js:231-236`.

Legenda kolom **Dipakai UI**:

| Tanda | Arti |
| --- | --- |
| Ya | Dipanggil oleh frontend admin |
| Tidak | Ada dan berfungsi, tetapi belum dipakai UI mana pun |
| PWA | Dipanggil portal karyawan |

---

## Job Requirement

### `GET /api/data-karyawan/job-requirement/profiles`

Daftar seluruh profil grade beserta skill dan training wajibnya.

**Dipakai UI:** Ya (Rekap Gap, Asesmen, Master Training)

```json
[
  {
    "id": 3,
    "grade": "RANK_3",
    "minEducation": "SMA",
    "educationOther": null,
    "minExperienceYears": 5,
    "allowedEmploymentTypes": ["PERMANENT", "CONTRACT"],
    "allowedGenders": ["MALE", "FEMALE"],
    "sourceFormNo": "SII-QSHE-002-03",
    "sourceRev": "00",
    "effectiveDate": "2024-04-01T00:00:00.000Z",
    "skills": [
      { "id": 41, "category": "SOFT_SKILL", "name": "Berpikir Kritis",
        "masterSkillId": 2, "targetLevel": 3, "sortOrder": 0 }
    ],
    "trainings": [
      { "id": 12, "masterTrainingId": 6, "sortOrder": 0,
        "masterTraining": { "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training" } }
    ]
  }
]
```

Urutan `skills` = `category ASC, sortOrder ASC`; `trainings` = `sortOrder ASC`.

---

### `GET /api/data-karyawan/job-requirement/profiles/:grade`

Satu profil berdasarkan grade (`RANK_1` … `RANK_11`, case-insensitive).

**Dipakai UI:** Tidak

```json
{
  "id": 3, "grade": "RANK_3", "minEducation": "SMA",
  "skills": [ /* sama seperti di atas */ ],
  "trainings": [ /* sama seperti di atas */ ]
}
```

| Kode | Kondisi |
| --- | --- |
| 404 | `{ "message": "Profil job requirement tidak ditemukan." }` |

---

### `GET /api/data-karyawan/job-requirement/employees`

Daftar karyawan dengan hasil evaluasi syarat jabatan **dan** readiness.

**Dipakai UI:** Ya (Rekap Gap)

**Query:**

| Param | Tipe | Keterangan |
| --- | --- | --- |
| `grade` | string | Filter grade, mis. `RANK_3` |
| `status` | string | `MEMENUHI` / `BELUM_MEMENUHI` / `BELUM_DINILAI` / `TIDAK_ADA_PROFIL` |
| `departmentId` | int | Filter departemen |
| `search` | string | Cari nama / NIK / departemen |
| `includeItems` | `1`/`true` | Sertakan `categories` & `unmetItems` di setiap baris |

```json
{
  "total": 36,
  "rows": [
    {
      "employeeId": 88,
      "employeeNo": "2301001",
      "fullName": "ADE",
      "departmentId": 2,
      "departmentName": "OPERATION",
      "jobLevelId": 4,
      "jobLevelName": "Foreman / Junior Staff",
      "jobRoleName": "Operator",
      "employmentType": "PERMANENT",
      "educationLevel": "SMA",
      "grade": "RANK_3",
      "gradeLabel": "Rank 3",
      "status": "BELUM_MEMENUHI",
      "statusLabel": "Belum Memenuhi",
      "mandatoryMet": true,
      "percentOverall": 62,
      "unmetMandatoryCount": 0,
      "unmetTotalCount": 9,
      "readinessStatus": "BELUM_LENGKAP",
      "readinessStatusLabel": "Belum Lengkap",
      "readinessPercent": 29,
      "assessedSkillCount": 2
    }
  ]
}
```

:::note `assessedSkillCount` menyesatkan
Nilai ini adalah `readiness.assessedItems` — **jumlah skill wajib yang sudah dinilai**, bukan jumlah seluruh asesmen yang tersimpan. Asesmen di luar daftar requirement tidak ikut dihitung di sini.
:::

---

### `GET /api/data-karyawan/job-requirement/employees/:id`

Detail satu karyawan: profil, evaluasi, readiness, dan seluruh asesmen periode aktif.

**Dipakai UI:** Tidak (Detail Karyawan memakai `/api/master/employees/:id/summary`)

```json
{
  "employee": {
    "id": 88, "employeeNo": "2301001", "fullName": "ADE",
    "departmentName": "OPERATION", "jobLevelName": "Foreman / Junior Staff",
    "jobRoleName": "Operator", "employmentType": "PERMANENT",
    "educationLevel": "SMA", "joinDate": "2023-01-17T00:00:00.000Z",
    "grade": "RANK_3", "gradeLabel": "Rank 3"
  },
  "periodId": 1,
  "evaluation": {
    "status": "BELUM_MEMENUHI", "statusLabel": "Belum Memenuhi",
    "mandatoryMet": true, "percentOverall": 62,
    "categories": [ /* 7 kategori */ ],
    "unmetItems": [ /* item belum terpenuhi */ ],
    "readiness": { /* objek readiness penuh */ }
  },
  "readiness": { /* duplikat dari evaluation.readiness */ },
  "profile": { /* profil lengkap + skills + trainings */ },
  "assessments": [
    { "id": 91, "category": "SOFT_SKILL", "skillName": "Berpikir Kritis",
      "masterSkillId": 2, "level": 3,
      "assessedAt": "2026-11-04T07:12:00.000Z", "notes": null }
  ]
}
```

`periodId` bernilai `null` bila tidak ada periode aktif — pada kondisi itu `assessments` berisi asesmen **semua periode**.

---

### `PUT /api/data-karyawan/job-requirement/employees/:id/assessments`

Menyimpan (upsert) satu atau beberapa asesmen.

**Dipakai UI:** Ya (dialog Asesmen)

**Body:**

```json
{
  "periodId": 1,
  "assessments": [
    { "category": "SOFT_SKILL", "skillName": "Berpikir Kritis", "level": 3, "notes": "dinilai atasan langsung" },
    { "category": "HARD_SKILL", "skillName": "Excel", "level": 0 }
  ]
}
```

| Field | Wajib | Aturan |
| --- | --- | --- |
| `periodId` | Tidak | Bila kosong, dipakai periode aktif |
| `category` | Ya | `SOFT_SKILL` atau `HARD_SKILL` |
| `skillName` | Ya | Maks. 255 karakter, spasi dinormalisasi |
| `level` | Ya | Bilangan bulat `0`–`5` |
| `notes` | Tidak | Teks bebas, kosong → `null` |

Dijalankan dalam satu transaksi `upsert` dengan kunci `(employeeId, category, skillName, periodId)`. `assessedAt` diset ke waktu sekarang, `assessedByAdminId` diisi admin yang login, dan `masterSkillId` dicocokkan otomatis dari katalog (case-insensitive).

```json
{
  "updated": 2,
  "periodId": 1,
  "evaluation": { /* evaluasi terbaru */ },
  "readiness": {
    "status": "BELUM_LENGKAP", "statusLabel": "Belum Lengkap",
    "readinessPercent": 29, "isComplete": false,
    "completionPercent": 8, "totalItems": 26, "assessedItems": 2,
    "unassessedItems": 24, "metItems": 2,
    "totalTarget": 78, "achievedScore": 6
  }
}
```

| Kode | Kondisi | Pesan |
| --- | --- | --- |
| 400 | ID bukan bilangan positif | `ID tidak valid.` |
| 400 | `assessments` kosong | `Tidak ada asesmen yang dikirim.` |
| 400 | Kategori di luar dua enum | `Kategori skill tidak valid: X.` |
| 400 | `skillName` kosong | `Nama skill wajib diisi.` |
| 400 | `level` bukan 0–5 | `Level skill X harus 0 sampai 5.` |
| 404 | Karyawan tidak ada / beda site | pesan dari `siteNotFound` |
| 404 | `periodId` tidak ada | `Periode asesmen tidak ditemukan.` |
| 409 | Tidak ada periode aktif dan `periodId` tidak dikirim | `Belum ada periode asesmen aktif. Aktifkan periode terlebih dahulu sebelum menilai.` |

:::warning Karyawan harus berada di site admin
Pemeriksaan memakai `buildSiteWhere(req)`. Admin site lain akan menerima 404, bukan 403.
:::

---

### `DELETE /api/data-karyawan/job-requirement/employees/:id/assessments/:category/:skillName`

Menghapus satu asesmen pada periode tertentu.

**Dipakai UI:** Ya (tombol **Hapus** di dialog Asesmen)

**Query:** `periodId` (opsional; default periode aktif)

```json
{ "deleted": 1, "periodId": 1,
  "evaluation": { /* … */ },
  "readiness": { "status": "BELUM_LENGKAP", "readinessPercent": 14, "assessedItems": 1, "totalItems": 7 } }
```

| Kode | Kondisi |
| --- | --- |
| 400 | ID/kategori/nama tidak valid |
| 404 | Asesmen tidak ada pada periode itu → `Asesmen tidak ditemukan pada periode tersebut.` |
| 409 | Tidak ada periode aktif |

Aman dipanggil berulang: penghapusan memakai `deleteMany` sehingga tidak error bila baris sudah tidak ada — tetapi akan mengembalikan 404 karena `count === 0`.

---

### `GET /api/data-karyawan/job-requirement/assessment-sheet`

Data lengkap untuk tab **Asesmen Kompetensi**: karyawan + level & target per skill + ringkasan.

**Dipakai UI:** Ya

**Query:** `departmentId`, `grade`, `search`, `periodId`

```json
{
  "period": { "id": 1, "name": "2026-S1", "startDate": "2026-01-01T00:00:00.000Z",
              "endDate": "2026-06-30T00:00:00.000Z", "isActive": true, "notes": null },
  "rows": [
    {
      "employeeId": 88, "employeeNo": "2301001", "fullName": "ADE",
      "departmentId": 2, "departmentName": "OPERATION",
      "jobLevelName": "Foreman / Junior Staff",
      "grade": "RANK_3", "gradeLabel": "Rank 3",
      "readinessStatus": "BELUM_LENGKAP", "readinessStatusLabel": "Belum Lengkap",
      "readinessPercent": 29, "assessedItems": 2, "totalItems": 26,
      "isComplete": false, "completionPercent": 8,
      "items": [
        { "category": "SOFT_SKILL", "skillName": "Berpikir Kritis",
          "targetLevel": 3, "level": 3, "assessedAt": "2026-11-04T07:12:00.000Z", "notes": null },
        { "category": "HARD_SKILL", "skillName": "Excel",
          "targetLevel": 3, "level": null, "assessedAt": null, "notes": null }
      ]
    }
  ],
  "summary": {
    "employeeCount": 36, "assessedEmployees": 4, "completeEmployees": 0,
    "readyEmployees": 0, "averageReadiness": 18
  }
}
```

`averageReadiness` hanya menghitung karyawan yang `readinessPercent != null`; `null` bila tidak ada satu pun.

| Kode | Kondisi |
| --- | --- |
| 404 | `periodId` tidak ditemukan |
| 409 | Tidak ada periode aktif dan `periodId` tidak dikirim |

Pencarian (`search`) dilakukan di level aplikasi atas `fullName + employeeNo + departmentName`, karena melibatkan relasi.

---

### `GET /api/data-karyawan/job-requirement/matrix`

Matriks karyawan × skill untuk satu departemen.

**Dipakai UI:** Ya (tab Matriks, termasuk Export Excel)

**Query:**

| Param | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `departmentId` | **Ya** | — | Tanpa ini → 400 |
| `periodId` | Tidak | periode aktif | |
| `grade` | Tidak | semua | |
| `search` | Tidak | — | Cari nama/NIK |
| `page` | Tidak | 1 | |
| `limit` | Tidak | 200 | Maksimum dipaksa 200 (`MATRIX_MAX_EMPLOYEES`) |

```json
{
  "period": { "id": 1, "name": "2026-S1" },
  "department": { "id": 2, "name": "OPERATION" },
  "page": 1, "limit": 200,
  "totalEmployees": 36, "totalPages": 1,
  "columns": [
    { "key": "SOFT_SKILL:berpikir kritis", "category": "SOFT_SKILL",
      "skillName": "Berpikir Kritis", "requiredGradeCount": 8,
      "requiredGrades": ["RANK_1","RANK_3","RANK_4"],
      "maxTarget": 4 }
  ],
  "rows": [
    {
      "employeeId": 88, "fullName": "ADE", "employeeNo": "2301001",
      "grade": "RANK_3", "gradeLabel": "Rank 3",
      "readinessStatus": "BELUM_LENGKAP", "readinessPercent": 29,
      "assessedItems": 2, "totalItems": 26, "isComplete": false,
      "cells": {
        "SOFT_SKILL:berpikir kritis": { "required": true, "level": 3, "targetLevel": 3, "met": true, "gap": 0 },
        "HARD_SKILL:excel": { "required": false }
      }
    }
  ],
  "summary": {
    "employeeCount": 36, "gradeCount": 3, "skillCount": 28,
    "requiredCells": 640, "assessedCells": 24, "unassessedCells": 616,
    "naCells": 368, "naPercent": 37,
    "assessedEmployees": 4, "completeEmployees": 0,
    "readyEmployees": 0, "averageReadiness": 18
  },
  "gaps": [
    { "key": "HARD_SKILL:excel", "skillName": "Excel", "category": "HARD_SKILL",
      "requiredCount": 20, "assessedCount": 3, "metCount": 1, "gapCount": 2,
      "averageGap": 1.5, "coveragePercent": 15, "metPercent": 33 }
  ],
  "skills": [ /* semua kolom dengan statistik, bukan hanya yang gap */ ]
}
```

Detail aturan:

| Aspek | Perilaku |
| --- | --- |
| Kunci kolom | `${category}:${normalizeText(name)}` — nama di-lowercase & spasinya dirapikan |
| Kolom | Gabungan skill dari **semua grade yang ada di departemen**, bukan hanya `grade` filter |
| Urutan kolom | Soft skill dulu; lalu `requiredGradeCount` menurun; lalu alfabetis |
| Sel tidak wajib | `{ "required": false }` saja — UI menampilkan `N/A` |
| `gap` | `null` bila belum dinilai; `max(target - level, 0)` bila sudah |
| `gaps` | Maksimal 15, hanya yang `gapCount > 0`, diurutkan `gapCount` menurun |
| `naPercent` | `naCells / (requiredCells + naCells) × 100` |

| Kode | Kondisi |
| --- | --- |
| 400 | `departmentId` kosong → `Pilih departemen terlebih dahulu.` |
| 404 | `periodId` tidak ditemukan |
| 409 | Tidak ada periode aktif |

---

### `GET /api/data-karyawan/job-requirement/training-needs`

Kebutuhan training berbasis **sistem lama**: training wajib grade yang belum diikuti.

**Dipakai UI:** Ya (tabel atas tab Kebutuhan Training)

**Query:** `grade`, `departmentId`

```json
{
  "total": 12,
  "rows": [
    {
      "trainingName": "Basic Management System",
      "employeeCount": 18,
      "employees": [
        { "employeeId": 88, "employeeNo": "2301001", "fullName": "ADE",
          "departmentName": "OPERATION", "grade": "RANK_3" }
      ]
    }
  ]
}
```

Item dianggap sudah terpenuhi bila nama training wajib cocok dengan `masterTraining.name` **atau** `employeeTraining.material` pada riwayat pelatihan karyawan (case-insensitive, spasi dinormalisasi).

---

### `GET /api/data-karyawan/job-requirement/skill-training-recommendations`

Rekomendasi training berbasis **gap skill** + `skill_training_map`.

**Dipakai UI:** Ya (panel Rekomendasi Training)

**Query:** `departmentId`, `grade`, `periodId`

```json
{
  "periodId": 1,
  "hasMapping": true,
  "total": 3,
  "employeesWithGap": 12,
  "unmappedGapCount": 27,
  "rows": [
    {
      "masterTrainingId": 6,
      "trainingName": "Basic Management System",
      "category": "Basic Leadership Training",
      "employeeCount": 9,
      "employeeIds": [88, 91, 102],
      "skills": [
        { "skillName": "Manajemen Waktu", "category": "SOFT_SKILL",
          "targetLevel": 3, "affectedEmployees": 7 }
      ],
      "maxGap": 2,
      "totalGap": 11,
      "employees": [
        { "employeeId": 88, "employeeNo": "2301001", "fullName": "ADE",
          "departmentName": "OPERATION", "grade": "RANK_3" }
      ]
    }
  ]
}
```

| Field | Arti |
| --- | --- |
| `hasMapping` | `false` bila `skill_training_map` kosong total |
| `employeesWithGap` | Jumlah karyawan yang punya minimal satu skill di bawah target **dan sudah dinilai** |
| `unmappedGapCount` | Jumlah pasangan (karyawan, skill) yang gap tetapi skill-nya belum dipetakan ke training |
| `maxGap` / `totalGap` | Gap terbesar dan akumulasi gap untuk training tersebut |

Penting: **skill yang belum dinilai tidak menghasilkan gap** — hanya skill dengan asesmen dan `level < target` yang dihitung. Karena itu `employeesWithGap` bisa 0 meski banyak skill belum dinilai.

---

## Master Skill

### `GET /api/master/master-skills`

Katalog skill + jumlah pemakaian.

**Dipakai UI:** Ya

```json
[
  { "id": 2, "category": "SOFT_SKILL", "name": "Berpikir Kritis",
    "requirementCount": 8, "assessmentCount": 3 }
]
```

`requirementCount` = jumlah baris `job_requirement_skills` yang memakai skill ini. `assessmentCount` = jumlah asesmen karyawan dengan `category + skillName` yang sama (lintas periode, lintas site).

---

### `POST /api/master/master-skills`

```json
{ "category": "HARD_SKILL", "name": "Analisa Data" }
```

| Kode | Kondisi |
| --- | --- |
| 201 | Dibuat |
| 400 | Kategori tidak valid / nama kosong / nama > 255 karakter |
| 409 | `Skill dengan nama tersebut sudah ada di kategori ini.` (case-insensitive) |

Nama dinormalisasi: trim + spasi berlebih dirapikan menjadi satu.

---

### `PUT /api/master/master-skills/:id`

Mengubah **nama** (kategori tidak dapat diubah lewat endpoint ini).

```json
{ "name": "Analisis Data" }
```

Bila nama berubah, satu transaksi memperbarui tiga tempat sekaligus:

1. `master_skills.name`
2. `job_requirement_skills.name` untuk semua baris dengan `masterSkillId` tersebut
3. `employee_skill_assessments.skillName` untuk semua asesmen dengan `category` + nama lama

```json
{ "id": 12, "category": "HARD_SKILL", "name": "Analisis Data",
  "requirementCount": 4, "assessmentCount": 0 }
```

| Kode | Kondisi |
| --- | --- |
| 404 | Skill tidak ditemukan |
| 409 | Nama baru bentrok dengan skill lain di kategori sama |

---

### `DELETE /api/master/master-skills/:id`

**Dipakai UI:** Ya

| Kode | Kondisi |
| --- | --- |
| 204 | Terhapus |
| 404 | Tidak ditemukan |
| 409 | Masih dipakai requirement atau punya asesmen |

Pesan 409 menyebutkan kedua angka:

```text
Skill tidak bisa dihapus. Dipakai di 3 requirement grade dan memiliki 5 asesmen karyawan.
Hapus asesmen lebih dulu lewat menu baris "Hapus Asesmen".
```

---

### `DELETE /api/master/master-skills/:id/assessments`

Menghapus **seluruh asesmen** untuk satu skill, **di semua periode dan semua karyawan**.

**Dipakai UI:** Ya (klik kanan → Hapus Asesmen)

:::warning Tidak khusus Super Admin
Berbeda dengan aksi standar grade, endpoint ini **tidak** memakai `requireSuperAdminWrite`. Admin site mana pun dapat menghapus asesmen skill tersebut di seluruh site.
:::

:::danger Tidak dapat dibatalkan dan lintas periode
Endpoint ini tidak menerima `periodId`. Satu panggilan menghapus riwayat asesmen skill tersebut di seluruh semester.
:::

```json
{ "deleted": 5, "skillName": "Berpikir Kritis" }
```

Bila tidak ada asesmen, tetap mengembalikan `200` dengan `deleted: 0`.

---

### `GET /api/master/master-skills/mapping/:grade`

Peta katalog skill terhadap satu grade: mana yang wajib dan berapa targetnya.

**Dipakai UI:** Ya (tab Skill)

```json
{
  "grade": "RANK_3",
  "profileId": 3,
  "skills": [
    { "id": 2, "category": "SOFT_SKILL", "name": "Berpikir Kritis", "required": true, "targetLevel": 3 },
    { "id": 30, "category": "HARD_SKILL", "name": "Project Management", "required": false, "targetLevel": 3 }
  ]
}
```

`targetLevel` untuk skill yang **tidak** wajib tetap menampilkan nilai default `3` — bukan berarti sudah disyaratkan.

| Kode | Kondisi |
| --- | --- |
| 404 | Profil grade tidak ada |

---

### `PUT /api/master/master-skills/mapping/:grade/targets`

Menyimpan target level untuk skill yang sudah wajib.

**Super Admin saja.**

**Body:**

```json
{ "items": [ { "masterSkillId": 2, "targetLevel": 4 }, { "id": 41, "targetLevel": 2 } ] }
```

Setiap item boleh memakai `id` (baris requirement) atau `masterSkillId`.

| Field | Aturan |
| --- | --- |
| `targetLevel` | Bilangan bulat `0`–`5`. Kosong/`null` → pertahankan nilai lama |
| Minimal satu item | Wajib; kosong → 400 |

```json
{ "updated": 2, "grade": "RANK_3", "profileId": 3, "skills": [ /* mapping terbaru */ ] }
```

| Kode | Kondisi |
| --- | --- |
| 400 | `Tidak ada target yang dikirim.` |
| 400 | `Sebagian skill tidak termasuk requirement grade ini.` |
| 400 | Target di luar 0–5 |
| 403 | Bukan Super Admin |
| 404 | Profil grade tidak ada |

---

### `POST /api/master/master-skills/mapping/:grade/copy-from-above`

Menyalin **union** skill dari grade satu tingkat di atas.

**Super Admin saja.**

Tanpa body.

```json
{
  "copiedFrom": "RANK_4",
  "copiedFromLabel": "Rank 4",
  "added": 2,
  "skipped": 26,
  "grade": "RANK_3",
  "profileId": 3,
  "skills": [ /* mapping terbaru */ ]
}
```

| Aturan | Detail |
| --- | --- |
| Sumber | `RANK_(n+1)` |
| Sifat | Hanya menambah; **tidak menghapus** dan **tidak menimpa** target yang sudah ada |
| `targetLevel` skill baru | Mengikuti nilai dari grade sumber |
| `added: 0` | Bukan error — berarti semua skill sudah ada |

| Kode | Kondisi |
| --- | --- |
| 400 | Grade bukan format `RANK_n` → `Grade tidak valid.` |
| 400 | `RANK_11` → `Rank 11 adalah grade tertinggi.` |
| 403 | Bukan Super Admin |
| 404 | Profil grade tujuan tidak ada |
| 404 | Profil grade sumber belum dibuat → `Profil Rank 12 belum tersedia.` |

---

### `PUT /api/master/master-skills/mapping/:grade`

Menyimpan **daftar skill wajib** untuk satu grade + satu kategori.

**Super Admin saja.**

**Body:**

```json
{ "category": "SOFT_SKILL", "masterSkillIds": [2, 5, 9] }
```

Perilaku:

| Langkah | Detail |
| --- | --- |
| Validasi katalog | Semua ID harus ada di `master_skills` |
| Validasi kategori | Semua skill harus se-kategori dengan `category` |
| Penghapusan | Baris yang tidak dipilih akan dihapus — **kecuali** skill yang punya asesmen |
| Penambahan | Baris baru mendapat `sortOrder` lanjutan dan `targetLevel` default 3 |

```json
{ "grade": "RANK_3", "profileId": 3, "skills": [ /* mapping terbaru */ ] }
```

| Kode | Kondisi |
| --- | --- |
| 400 | `Sebagian skill tidak ditemukan di katalog.` |
| 400 | `Skill "X" bukan kategori Y.` |
| 400 | `category` tidak valid |
| 403 | Bukan Super Admin |
| 404 | Profil grade tidak ada |
| 409 | `Skill "X" tidak bisa dilepas dari grade ini karena sudah memiliki N asesmen karyawan.` |

:::warning Mengosongkan `masterSkillIds`
Mengirim array kosong **menghapus semua skill** pada kategori itu untuk grade tersebut — kecuali yang punya asesmen (maka 409). Untuk "menonaktifkan" skill tanpa menghapus, setel target ke `0` lewat endpoint targets.
:::

---

### `GET /api/master/master-skills/training-map`

Seluruh relasi skill → training.

**Dipakai UI:** Ya (tab Pemetaan Training)

```json
{
  "skills": [
    { "id": 2, "category": "SOFT_SKILL", "name": "Berpikir Kritis",
      "trainings": [ { "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training" } ] }
  ],
  "trainings": [ { "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training" } ],
  "totalMappings": 1
}
```

---

### `PUT /api/master/master-skills/training-map/:masterSkillId`

Mengganti **seluruh** pemetaan untuk satu skill.

**Super Admin saja.**

```json
{ "masterTrainingIds": [6, 8] }
```

```json
{ "masterSkillId": 2, "skillName": "Berpikir Kritis",
  "trainings": [ { "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training" } ] }
```

| Perilaku | Detail |
| --- | --- |
| Penggantian penuh | `deleteMany` lalu `createMany`; array kosong = hapus semua pemetaan |
| Duplikat | ID unik; duplikat dibuang |
| Validasi | Semua ID training harus ada |

| Kode | Kondisi |
| --- | --- |
| 400 | `ID skill tidak valid.` / `Sebagian master training tidak ditemukan.` |
| 403 | Bukan Super Admin |
| 404 | Skill tidak ditemukan |

---

## Periode Asesmen

### `GET /api/master/skill-assessment-periods`

**Dipakai UI:** Ya (dialog periode)

```json
[ { "id": 1, "name": "2026-S1", "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-06-30T00:00:00.000Z", "isActive": true,
    "notes": "Periode awal hasil migrasi asesmen yang sudah ada.",
    "assessmentCount": 24 } ]
```

Urutan: `startDate DESC, id DESC`. `assessmentCount` hanya ada pada endpoint list.

---

### `GET /api/master/skill-assessment-periods/active`

**Dipakai UI:** Ya

| Kode | Kondisi |
| --- | --- |
| 200 | Objek periode aktif |
| 404 | `Belum ada periode asesmen yang aktif.` |

:::tip Perbedaan 404 di sini vs 409 di endpoint lain
Endpoint periode mengembalikan **404** bila tidak ada yang aktif. Endpoint asesmen/matriks mengembalikan **409** untuk kondisi yang sama.
:::

---

### `POST /api/master/skill-assessment-periods`

**Super Admin saja.**

```json
{ "name": "2026-S2", "startDate": "2026-07-01", "endDate": "2026-12-31",
  "isActive": true, "notes": "Semester kedua" }
```

| Kode | Kondisi |
| --- | --- |
| 201 | Dibuat |
| 400 | Nama kosong / tanggal kosong / `endDate < startDate` |
| 403 | Bukan Super Admin |
| 409 | `Nama periode sudah dipakai.` |

Mengaktifkan periode baru menonaktifkan semua periode lain dalam transaksi yang sama.

---

### `PUT /api/master/skill-assessment-periods/:id`

**Super Admin saja.** Field yang tidak dikirim dipertahankan.

```json
{ "isActive": true }
```

| Kode | Kondisi |
| --- | --- |
| 400 | Validasi sama seperti POST |
| 403 | Bukan Super Admin |
| 404 | Periode tidak ditemukan |
| 409 | Nama bentrok |

---

### `DELETE /api/master/skill-assessment-periods/:id`

**Super Admin saja.**

| Kode | Kondisi |
| --- | --- |
| 204 | Terhapus |
| 403 | Bukan Super Admin |
| 404 | Tidak ditemukan |
| 409 | `Periode tidak bisa dihapus karena menyimpan N asesmen. Arsipkan dengan menonaktifkan periode.` |

---

## Master Training (bagian yang terkait modul ini)

### `GET /api/master/master-trainings`

**Dipakai UI:** Ya

```json
[ { "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training",
    "requirementCount": 3, "trainingCount": 15, "skillMapCount": 1 } ]
```

---

### `GET /api/master/master-trainings/:id/usage`

Rincian pemakaian satu training.

**Dipakai UI:** Ya (dialog Pemakaian)

```json
{
  "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training",
  "requirementGrades": [ { "grade": "RANK_3", "gradeLabel": "Rank 3" } ],
  "skillMaps": [ { "id": 2, "category": "SOFT_SKILL", "name": "Berpikir Kritis" } ],
  "employeeTrainingCount": 15,
  "participantCount": 42
}
```

| Kode | Kondisi |
| --- | --- |
| 404 | Training tidak ditemukan |

---

### `DELETE /api/master/master-trainings/:id`

**Dipakai UI:** Ya

| Kode | Kondisi |
| --- | --- |
| 204 | Terhapus |
| 404 | Tidak ditemukan |
| 409 | Masih dipakai |

Pesan 409 merangkai tiga sumber pemakaian:

```text
Training "Basic Management System" tidak bisa dihapus karena masih dipakai di
3 syarat grade, 1 pemetaan skill, 15 riwayat pelatihan karyawan.
Lepaskan pemakaian tersebut terlebih dahulu.
```

---

### `GET /api/master/master-trainings/requirement-map/:grade`

Training wajib satu grade.

**Dipakai UI:** Ya (tab Pemetaan Grade)

```json
{ "grade": "RANK_3", "profileId": 3,
  "trainings": [ { "id": 6, "name": "Basic Management System", "category": "Basic Leadership Training" } ],
  "selectedIds": [6, 8] }
```

---

### `PUT /api/master/master-trainings/requirement-map/:grade`

Mengganti seluruh training wajib satu grade.

**Dipakai UI:** Ya

**Body:** `{ "masterTrainingIds": [6, 8] }`

:::info Boleh dilakukan Admin, bukan hanya Super Admin
Endpoint ini **tidak** memakai `requireSuperAdminWrite` — berbeda dengan endpoint mapping skill. Admin biasa dapat mengubah training wajib grade.
:::

| Kode | Kondisi |
| --- | --- |
| 400 | `Sebagian master training tidak ditemukan.` |
| 404 | Profil grade tidak ada |

Perilaku: `deleteMany` lalu `createMany`; array kosong menghapus semua training wajib grade tersebut.

---

## Endpoint Terkait di Router Lain

### `GET /api/master/employees/:id/summary`

Dipakai **Detail Karyawan**. Mengirim evaluasi sistem lama **dan** readiness.

**Dipakai UI:** Ya

Field baru yang relevan:

```json
"jobRequirement": {
  "grade": "RANK_3", "gradeLabel": "Rank 3",
  "status": "BELUM_MEMENUHI", "statusLabel": "Belum Memenuhi",
  "mandatoryMet": true, "percentOverall": 62,
  "periodName": "2026-S1",
  "readiness": {
    "status": "BELUM_LENGKAP", "statusLabel": "Belum Lengkap",
    "readinessPercent": 29, "isComplete": false, "completionPercent": 8,
    "assessedItems": 2, "totalItems": 26, "metItems": 2
  },
  "categories": [ /* 7 kategori */ ],
  "unmetItems": [ /* … */ ],
  "assessments": [ /* asesmen periode aktif */ ],
  "profile": { /* … */ }
}
```

:::caution `periodName` bukan field readiness
Di `Detail Karyawan`, `periodName` berada di level `jobRequirement`, sedangkan UI menampilkannya bersama readiness. Di endpoint lain (mis. `/skill-training-recommendations`) tidak ada `periodName` sama sekali.
:::

Bila tidak ada periode aktif, endpoint ini **tidak** mengembalikan 409 — ia menghitung dari seluruh periode (`server/routes/employees.js:1065-1068`).

---

### `GET /api/employee-me/job-requirement`

Kartu status di **PWA karyawan**.

**Dipakai UI:** PWA

```json
{
  "gradeLabel": "Rank 3",
  "periodName": "2026-S1",
  "status": "BELUM_MEMENUHI",
  "statusLabel": "Belum Memenuhi",
  "mandatoryMet": true,
  "percentOverall": 62,
  "categories": [
    { "key": "SOFT_SKILL", "label": "Soft Skill", "mandatory": true,
      "total": 18, "met": 2, "percent": 11 }
  ],
  "unmetItems": [
    { "categoryLabel": "Soft Skill", "label": "Negosiasi",
      "required": "Level >= 3", "actual": "Belum dinilai",
      "result": "BELUM_DINILAI", "mandatory": true }
  ],
  "sourceFormNo": "SII-QSHE-002-03",
  "sourceRev": "00",
  "effectiveDate": "2024-04-01T00:00:00.000Z"
}
```

:::note PWA belum memakai readiness
Endpoint ini hanya mengirim sistem lama (`status`, `percentOverall`, kategori). Field `readiness` **belum** disertakan, sehingga skor di PWA dan di admin bisa berbeda makna. Lihat [Dua perhitungan paralel](/modules/job-requirement/konsep-readiness#dua-perhitungan-yang-berjalan-paralel).
:::

---

## Ringkasan Kode Error

| Kode | Muncul pada | Penyebab umum |
| --- | --- | --- |
| 400 | hampir semua tulis | Validasi input (kategori, level 0–5, nama kosong, ID invalid) |
| 403 | endpoint Super Admin | Role bukan `super_admin` |
| 403 | semua endpoint tulis | Role `user` (read-only) |
| 404 | endpoint per-ID | Data tidak ada **atau** berada di site lain |
| 404 | `/periods/active` | Tidak ada periode aktif |
| 409 | asesmen / matriks / sheet | Tidak ada periode aktif |
| 409 | hapus skill / training / periode | Masih dipakai data turunan |
| 409 | simpan mapping skill | Melepas skill yang sudah punya asesmen |
