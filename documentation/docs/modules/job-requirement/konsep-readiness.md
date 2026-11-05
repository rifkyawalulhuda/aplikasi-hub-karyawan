---
id: konsep-readiness
title: Konsep & Rumus Readiness
sidebar_label: Konsep & Rumus
---

# Konsep & Rumus Readiness

Modul **Job Requirement** membandingkan kompetensi aktual seorang karyawan dengan syarat jabatan yang melekat pada **grade**-nya, lalu menurunkan selisihnya menjadi daftar kebutuhan training.

Halaman ini menjelaskan **model konseptual**: sumber syarat, skala penilaian, rumus, status, dan arti periode. Untuk langkah operasional lihat [Panduan Admin](/modules/job-requirement/panduan-admin), untuk kontrak HTTP lihat [Referensi API](/modules/job-requirement/referensi-api).

---

## Sumber Syarat Jabatan

Syarat jabatan berasal dari form **`SII-QSHE-002-03`**. Isinya diterjemahkan menjadi tabel `job_requirement_profiles` (satu baris per grade) dengan turunan:

| Kelompok syarat | Disimpan di | Dipakai untuk |
| --- | --- | --- |
| Pendidikan minimal | `minEducation` / `educationOther` | Status kelayakan (wajib) |
| Masa kerja minimal | `minExperienceYears` | Status kelayakan (wajib) |
| Status kepegawaian | `allowedEmploymentTypes[]` | Status kelayakan (wajib) |
| Jenis kelamin | `allowedGenders[]` | Status kelayakan (wajib) |
| Soft skill | `job_requirement_skills` (`SOFT_SKILL`) | Readiness + gap |
| Hard skill | `job_requirement_skills` (`HARD_SKILL`) | Readiness + gap |
| Training wajib | `job_requirement_trainings` | Status kelayakan |

Setiap baris skill juga menyimpan **target level** (`targetLevel`, 0–5). Inilah yang membuat satu skill bisa punya standar berbeda antar grade: `Microsoft Excel` boleh bertarget 2 untuk Rank 1 dan 4 untuk Rank 7.

---

## Skala Level 0–5

Asesmen memakai skala ordinal 0–5 dengan anchor tetap. Anchor ini yang membuat angka punya arti seragam antar departemen.

| Level | Label | Makna operasional |
| --- | --- | --- |
| 0 | Tidak terpapar | Belum pernah mengenal tools/konsepnya |
| 1 | Memahami konsep | Tahu teorinya, belum bisa mempraktikkan |
| 2 | Dapat dengan supervisi | Bisa mengerjakan bila diarahkan/diawasi |
| 3 | Mandiri | Bisa menyelesaikan pekerjaan sendiri tanpa pengawasan |
| **4** | Melatih orang lain | Bisa mengajarkan dan mengoreksi rekan kerja |
| **5** | Rujukan / penyusun standar | Jadi acuan, menyusun SOP/standar kerja |

Konstanta ini didefinisikan di `app-karyawan/server/lib/skillMatrix.js:22` (`SKILL_LEVEL_LABELS`) dan dipakai ulang oleh dialog asesmen agar label UI dan backend tidak pernah berbeda.

:::info Level 0 tetap nilai yang sah
`0` **bukan** "belum dinilai". Menyimpan level `0` berarti asesor sudah memutuskan karyawan tersebut tidak terpapar. Nilai `0` masuk hitungan sebagai nol poin, sedangkan "belum dinilai" mengeluarkan skill dari penghitung kelengkapan. Lihat [Belum dinilai ≠ 0](#belum-dinilai--0).
:::

---

## Rumus Readiness

Readiness dihitung **tanpa bobot**. Semua skill wajib dianggap setara. Implementasi inti: `app-karyawan/server/lib/skillMatrix.js:66`.

```js
// app-karyawan/server/lib/skillMatrix.js:73-127 (disederhanakan)
const requiredSkills = requirements.filter((r) => (r.targetLevel ?? 3) > 0);

const totalTarget   = items.reduce((sum, i) => sum + i.targetLevel, 0);
const achievedScore = items.reduce(
  (sum, i) => sum + (i.assessed ? Math.min(i.level, i.targetLevel) : 0),
  0,
);

const readinessPercent =
  !hasAnyAssessment || totalTarget === 0
    ? null                                             // belum diukur
    : Math.round((achievedScore / totalTarget) * 100);
```

Dalam notasi matematis:

```text
                        Σ min(level_i , target_i)          untuk seluruh skill wajib (target_i > 0)
readinessPercent =  ─────────────────────────────────────── × 100
                              Σ target_i
```

Aturan yang mengikat rumus ini:

1. **Penyebut = seluruh skill wajib bertarget > 0.** Skill dengan `targetLevel = 0` dikecualikan total, karena target 0 berarti "tidak disyaratkan", bukan "disyaratkan nol".
2. **Skill belum dinilai menyumbang 0 pada pembilang**, tetapi **tetap masuk penyebut**. Konsekuensinya, karyawan yang baru dinilai 1 dari 7 skill tidak akan pernah tampil 100%.
3. **Nilai di atas target dipotong ke target.** Level 5 pada skill bertarget 3 hanya menyumbang 3. Kelebihan kompetensi tidak menutupi kekurangan skill lain.
4. **Tanpa asesmen sama sekali → `null`**, bukan `0`.

### Contoh perhitungan

Karyawan Rank 2 dengan 12 skill wajib, seluruhnya bertarget 3 (`Σ target = 36`):

| Skenario | Yang dinilai | Pembilang | Readiness |
| --- | --- | --- | --- |
| Belum ada asesmen | — | 0 | `null` → UI menampilkan `—` |
| 1 skill level 3 | 1 dari 12 | 3 | `8%` |
| 6 skill level 3 | 6 dari 12 | 18 | `50%` |
| 11 skill level 3 | 11 dari 12 | 33 | `92%` |
| 12 skill level 3 | semua | 36 | `100%` |

Contoh nyata pada data development: karyawan grade Rank 1 punya 7 skill, satu skill dinilai level 3 → `3/21 = 14%`, status `BELUM_LENGKAP`.

:::note Mengapa tanpa bobot
Versi awal modul ini memakai bobot per skill (`SkillWeight`). Bobot dihapus total karena menyulitkan HR menjelaskan angka ke manajemen: "kenapa naik 3% padahal satu skill penuh terpenuhi?". Migration `20261104160000_drop_skill_weight` menghapus enum dan kolomnya. Angka readiness sebelum dan sesudah penghapusan bobot diverifikasi identik untuk seluruh 134 karyawan development, karena semua bobot saat itu bernilai 1.
:::

---

## Empat Status Readiness

Ambang "siap" adalah **80%** (`READY_MIN_PERCENT`, `app-karyawan/server/lib/skillMatrix.js:20`).

| Status | Label UI | Kondisi | Arti bagi HR |
| --- | --- | --- | --- |
| `BELUM_DINILAI` | Belum Dinilai | 0 asesmen pada periode aktif | Belum ada data; jangan dibaca sebagai "gagal" |
| `BELUM_LENGKAP` | Belum Lengkap | Ada asesmen, tetapi belum semua skill wajib dinilai | Angka persen belum bisa dipakai untuk keputusan |
| `DALAM_PENGEMBANGAN` | Dalam Pengembangan | Semua skill wajib dinilai **dan** readiness < 80% | Data lengkap, kompetensi masih kurang |
| `SIAP` | Siap | Semua skill wajib dinilai **dan** readiness ≥ 80% | Kandidat untuk promosi/rotasi |

Urutan evaluasi di `app-karyawan/server/lib/skillMatrix.js:132-142`:

```text
tanpa asesmen?                    → BELUM_DINILAI
ada asesmen tapi belum lengkap?   → BELUM_LENGKAP
lengkap & readiness >= 80?        → SIAP
selain itu                        → DALAM_PENGEMBANGAN
```

:::warning Hanya `SIAP` yang boleh dipakai untuk keputusan
Status `BELUM_LENGKAP` sengaja tidak disebut "gagal". Persennya bisa terlihat tinggi hanya karena skill yang dinilai kebetulan yang mudah. Gunakan kolom `Asesmen x/y` sebagai syarat tambahan sebelum membaca persen.
:::

### Belum dinilai ≠ 0

Perbedaan ini disengaja dan berdampak pada UI:

| Keadaan | `level` | Masuk penyebut | Efek pada persen | Tampilan |
| --- | --- | --- | --- | --- |
| Belum dinilai | `null` | Ya (targetnya) | Menekan persen seolah 0 | Sel bergaris putus-putus |
| Dinilai rendah | `0` | Ya | Menekan persen sebagai 0 | Sel merah |
| Tidak disyaratkan | — | Tidak | Tidak berpengaruh | Sel abu `N/A` |

Karyawan tanpa asesmen sama sekali menghasilkan `null` agar tidak terbaca "gagal total" — berbeda dengan karyawan yang sudah dinilai dan memang memperoleh 0.

---

## Dua Perhitungan yang Berjalan Paralel

Kode saat ini menghasilkan **dua** skor dari data yang sama. Keduanya harus dipahami agar tidak salah membaca angka.

| Aspek | `status` (sistem lama) | `readiness` (sistem baru) |
| --- | --- | --- |
| Implementasi | `server/lib/jobRequirement.js:296` | `server/lib/skillMatrix.js:66` |
| Cakupan | 7 kategori: pendidikan, pengalaman, status kerja, gender, soft skill, hard skill, training | Hanya soft & hard skill |
| Ambang lulus skill | Selalu **level ≥ 3** (`SKILL_PASS_LEVEL`) | `level ≥ targetLevel` milik grade |
| Menghormati target per grade | Tidak | Ya |
| Bobot | Tidak ada | Tidak ada |
| Nilai keluaran | `MEMENUHI` / `BELUM_MEMENUHI` / `BELUM_DINILAI` / `TIDAK_ADA_PROFIL` | `SIAP` / `DALAM_PENGEMBANGAN` / `BELUM_LENGKAP` / `BELUM_DINILAI` |
| Persen | `percentOverall` (rata-rata persen antar kategori) | `readinessPercent` (skor/target) |
| Dipakai di | Kolom `STATUS` & `% ITEM` pada **Rekap Gap**; kategori pada **Detail Karyawan** | Kolom `READINESS` pada **Asesmen** & **Matriks**; `Readiness Ledger` di **Detail Karyawan**; PWA |

**Yang otoritatif untuk kompetensi skill adalah `readiness`.** Alasan: hanya `readiness` yang tahu bahwa target `Excel` untuk Rank 1 adalah 2 dan untuk Rank 7 adalah 4. Sistem lama akan menyebut level 2 "belum memenuhi" untuk kedua grade, padahal untuk Rank 1 itu sudah memenuhi.

`status` lama tetap dipertahankan karena ia mencakup syarat non-skill (pendidikan, masa kerja, status kerja, gender, training) yang tidak bisa dinyatakan sebagai level 0–5.

:::tip Cara membacanya
Pakai `status` untuk menjawab *"apakah orang ini layak memangku jabatannya secara administratif?"*, dan `readiness` untuk menjawab *"seberapa jauh kompetensi skill-nya dari standar grade?"*.
:::

Peta pemakaian keduanya:

```text
                     ┌─────────────────────────────────────────┐
   form SII-QSHE-     │ job_requirement_profiles                │
   002-03        ───► │  minEducation, minExperienceYears,      │
                     │  allowedEmploymentTypes, allowedGenders │
                     │  + job_requirement_skills (targetLevel) │
                     └───────────────┬─────────────────────────┘
                                     │
              ┌──────────────────────┴───────────────────────┐
              ▼                                              ▼
   evaluateJobRequirement()                        evaluateSkillReadiness()
   7 kategori, ambang level 3                      target per skill, tanpa bobot
              │                                              │
              ▼                                              ▼
   status + percentOverall                        readiness + readinessPercent
              │                                              │
   ┌──────────┴──────────┐              ┌────────────────────┴─────────────────┐
   ▼                     ▼              ▼                    ▼                 ▼
 Rekap Gap          Detail Karyawan   Asesmen           Matriks          PWA & Detail
 (STATUS, % ITEM)   (kategori)        (READINESS)       (READINESS)      (Readiness Ledger)
                                         │
                                         ▼
                              selisih level vs target
                                         │
                                         ▼
                              SkillTrainingMap → rekomendasi training
```

---

## Periode Asesmen (Snapshot Semester)

Asesmen **tidak** bersifat "nilai terbaru menimpa nilai lama". Setiap penilaian disimpan pada satu periode, sehingga riwayat antar semester tetap utuh dan bisa dibandingkan.

- Model: `skill_assessment_periods` dengan `name` unik (contoh `2026-S1`), `startDate`, `endDate`, `isActive`.
- Hanya **satu** periode boleh aktif. Mengaktifkan periode baru otomatis menonaktifkan yang lain dalam satu transaksi (`server/routes/skillAssessmentPeriods.js:108-113` dan `:167-172`).
- `employee_skill_assessments.periodId` bersifat **wajib** (`NOT NULL`), dengan unique `(employeeId, category, skillName, periodId)`.
- Semua pembacaan untuk keputusan memakai **periode aktif saja**:
  - `server/routes/jobRequirements.js:158` (`resolveActivePeriodId`)
  - `server/routes/employees.js:1065-1068` (komentar: *"Only the active period counts; older periods are history"*)
  - `server/routes/employeeMe.js:1179-1181` (PWA)

:::caution Tanpa periode aktif
Tanpa periode aktif, endpoint baca mengembalikan **409** dengan pesan *"Belum ada periode asesmen aktif"*, dan dialog asesmen tidak bisa menyimpan. `Detail Karyawan` (`/api/master/employees/:id/summary`) **tidak** melempar 409, tetapi juga tidak menghitung dari periode lama: asesmen diperlakukan kosong sehingga readiness menjadi `null` dan status `BELUM_DINILAI` (`server/routes/employees.js:1071-1079`).
:::

### Konsekuensi praktis

| Situasi | Perilaku |
| --- | --- |
| Ganti periode aktif | Semua angka Rekap/Matriks/PWA langsung menampilkan periode baru; periode lama tidak terhapus |
| Menghapus periode | Ditolak **409** bila periode masih menyimpan asesmen; arsipkan dengan menonaktifkan |
| Menilai ulang di periode yang sama | `upsert` — level & `assessedAt` diperbarui, bukan membuat baris baru |
| Menilai skill yang sudah tidak wajib | Tetap tersimpan, tetapi tidak dihitung readiness karena tidak ada di daftar requirement |

---

## Bagaimana Gap Menjadi Rekomendasi Training

```text
level  <  target            → ada gap (gap = target - level)
        │
        ├─ skill punya pemetaan di skill_training_map
        │        → training tersebut muncul di "Rekomendasi Training"
        │          (dikelompokkan, dihitung jumlah karyawan & total gap)
        │
        └─ belum ada pemetaan
                 → dihitung sebagai unmappedGapCount
                   (muncul sebagai peringatan, bukan rekomendasi)
```

Dua hal yang mudah tertukar:

| Tabel | Sumber logika | Isi |
| --- | --- | --- |
| **Kebutuhan Training** (tabel atas) | Sistem lama: kategori `TRAINING` pada `evaluateJobRequirement` | Training wajib grade yang **belum pernah diikuti** karyawan |
| **Rekomendasi Training** (tabel bawah) | Gap skill + `skill_training_map` | Training yang bisa menutup **kekurangan level skill** |

Keduanya bisa menampilkan training yang sama, tetapi berasal dari data berbeda. Jika **belum ada pemetaan skill → training sama sekali**, rekomendasi kosong meskipun gap berlimpah. Pemetaan sengaja dimulai kosong dan diisi manual.

---

## Ringkasan Aturan yang Sering Ditanya

| Pertanyaan | Jawaban |
| --- | --- |
| Apakah karyawan tanpa asesmen mendapat 0%? | Tidak. `readinessPercent = null`, UI menampilkan `—`, status `BELUM_DINILAI`. |
| Apakah skill target 0 dihitung? | Tidak. Dikecualikan dari penyebut dan dari penghitung kelengkapan. |
| Apakah level 5 menutupi skill lain yang kurang? | Tidak. Dipotong ke target masing-masing (`Math.min`). |
| Apakah readiness bisa 100% padahal asesmen belum lengkap? | Tidak bisa. Skill yang belum dinilai selalu menekan pembilang. |
| Apakah target default bila kosong? | 3 (`DEFAULT_TARGET_LEVEL`). Nilai `null` diperlakukan sebagai 3. |
| Apakah satu skill boleh beda target antar grade? | Ya, dan itu tujuan utama fitur ini. |
| Apakah readiness mencakup pendidikan & masa kerja? | Tidak. Itu domain `status` lama. |
| Apakah asesmen lama hilang saat ganti periode? | Tidak. Disimpan per periode; hanya periode aktif yang dibaca. |

---

## Rujukan Kode

| Berkas | Baris | Isi |
| --- | --- | --- |
| `server/lib/skillMatrix.js` | 1–4 | Batas level & target default |
| `server/lib/skillMatrix.js` | 6–20 | Enum status, label, ambang 80% |
| `server/lib/skillMatrix.js` | 22–29 | Anchor skala 0–5 |
| `server/lib/skillMatrix.js` | 66–158 | Fungsi `evaluateSkillReadiness` |
| `server/lib/skillMatrix.js` | 119 | `Math.min(level, target)` |
| `server/lib/skillMatrix.js` | 124–127 | Aturan `null` |
| `server/lib/jobRequirement.js` | 1 | `SKILL_PASS_LEVEL = 3` |
| `server/lib/jobRequirement.js` | 23–28 | Kategori wajib (non-skill) |
| `server/lib/jobRequirement.js` | 296–366 | `evaluateJobRequirement` (sistem lama) |
| `server/lib/skillMatrix.test.js` | — | 15 unit test rumus & status |
