---
id: panduan-admin
title: Panduan Admin & HR
sidebar_label: Panduan Admin
---

# Panduan Admin & HR

Halaman ini adalah panduan operasional: menu mana yang dibuka, tombol mana yang ditekan, dan apa yang terjadi setelahnya. Tidak ada kode di sini. Untuk rumus lihat [Konsep & Rumus](/modules/job-requirement/konsep-readiness); untuk kontrak API lihat [Referensi API](/modules/job-requirement/referensi-api).

---

## Peta Menu

Modul ini tersebar di dua tempat:

| Menu | Route | Isi | Untuk siapa |
| --- | --- | --- | --- |
| **Data Master → Master Training** | `/data-master/master-data-karyawan/master-training` | Menyusun standar: katalog skill, target per grade, training wajib, pemetaan skill→training | Admin & Super Admin (sebagian aksi khusus Super Admin) |
| **Data Karyawan → Rekap Job Requirement** | `/data-karyawan/job-requirement` | Menilai karyawan dan membaca hasilnya | Admin site |

Hak akses rinci:

| Aksi | Admin | Super Admin | Role `user` |
| --- | --- | --- | --- |
| Melihat seluruh halaman | Ya | Ya | Ya (read-only) |
| CRUD katalog skill | Ya | Ya | Tidak |
| CRUD master training | Ya | Ya | Tidak |
| Centang **Pemetaan Grade** | Ya | Ya | Tidak |
| Menyimpan daftar skill wajib per grade | **Tidak** | Ya | Tidak |
| Menyimpan target level per grade | **Tidak** | Ya | Tidak |
| **Salin dari Rank N** | **Tidak** | Ya | Tidak |
| Menyimpan **Pemetaan Training** (skill→training) | **Tidak** | Ya | Tidak |
| Mengubah **Syarat Grade** (pendidikan, pengalaman, status, gender) | **Tidak** | Ya | Tidak |
| Pratinjau dampak syarat grade | **Tidak** | Ya | Tidak |
| Melihat dampak syarat yang tersimpan | Ya | Ya | Ya |
| CRUD periode asesmen | **Tidak** | Ya | Tidak |
| Mengisi/menghapus asesmen karyawan | Ya (site sendiri) | Ya | Tidak |
| Menghapus asesmen satu skill di **semua** periode | Ya | Ya | Tidak |

Yang khusus Super Admin akan ditolak **403** dengan pesan *"Akses ditolak. Hanya Super Admin yang dapat mengubah data referensi global."* (`server/middleware/requireSuperAdminWrite.js`).

```text
Master Training (menyusun standar)          Rekap Job Requirement (menilai & membaca)
+------------------------------+            +-----------------------------------------+
| 1. Daftar Training           |            | 1. Rekap Gap                            |
| 2. Syarat Grade              |  syarat    | 2. Asesmen Kompetensi   <-- input nilai |
| 3. Pemetaan Grade            |  wajib     | 3. Matriks Kompetensi                   |
| 4. Skill            <--------+--target--->| 4. Kebutuhan Training                   |
| 5. Pemetaan Training <-------+--gap------>|                                         |
+------------------------------+            +-----------------------------------------+
```

Urutan kerja yang disarankan untuk setup awal:

1. Lengkapi **Daftar Training**.
2. Atur **Syarat Grade** (pendidikan, pengalaman, status karyawan, jenis kelamin).
3. Centang **Pemetaan Grade** (training wajib per grade).
4. Susun **Skill** per grade (skill wajib + target level).
5. Isi **Pemetaan Training** (skill mana ditutup training mana).
6. Baru lakukan **Asesmen Kompetensi**.

Langkah 1–5 sekali saja (lalu direvisi berkala). Langkah 6 berulang setiap periode.

---

## Prasyarat: Periode Asesmen

Sebelum menilai apa pun, harus ada **satu periode aktif**. Tanpa periode aktif, tab Asesmen dan Matriks menampilkan peringatan dan tombol simpan dinonaktifkan.

**Cara membuat/mengaktifkan periode:**

1. Buka **Rekap Job Requirement**.
2. Pada peringatan *"Belum ada periode asesmen aktif"*, tekan **Atur Periode**.
3. Isi **Nama Periode** (konvensi: `2026-S1`, `2026-S2`), **Tanggal Mulai**, **Tanggal Selesai**.
4. Aktifkan **Jadikan Periode Aktif**.
5. Simpan.

Perilaku yang perlu diketahui:

| Aksi | Efek |
| --- | --- |
| Mengaktifkan periode baru | Periode lain otomatis nonaktif (hanya satu yang aktif) |
| Mengubah nama periode | Ditolak bila nama sudah dipakai periode lain |
| Tanggal selesai < tanggal mulai | Ditolak |
| Menghapus periode berisi asesmen | Ditolak; nonaktifkan saja untuk mengarsipkan |
| Menghapus periode kosong | Diizinkan |

:::tip Mengganti semester
Jangan menilai ulang di periode lama. Buat periode baru dan aktifkan. Nilai semester lama tetap tersimpan sebagai riwayat dan tidak lagi memengaruhi angka.
:::

---

## Tab 1 — Rekap Gap

Menampilkan seluruh karyawan dengan status kelayakan terhadap syarat jabatannya.

**Kolom:**

| Kolom | Arti |
| --- | --- |
| NAMA / NIK | Identitas karyawan |
| DEPARTEMEN / JOB LEVEL | Konteks organisasi |
| GRADE | Rank karyawan (mis. `Rank 3`) |
| STATUS | `Memenuhi` / `Belum Memenuhi` / `Belum Dinilai` / `Tanpa Profil` |
| % ITEM | Rata-rata persen antar kategori syarat |
| WAJIB KURANG | Jumlah item wajib (pendidikan, pengalaman, status kerja, gender) yang belum terpenuhi |
| TOTAL KURANG | Jumlah seluruh item belum terpenuhi, termasuk skill & training |

**Filter:** cari karyawan (nama/NIK/job level/departemen), Grade, Status, Departemen.

**Aksi:** klik kanan baris → **Buka Detail Karyawan**.

:::warning `STATUS` di tab ini memakai sistem lama
Status di tab ini menilai skill dengan ambang **level ≥ 3** dan **mengabaikan target per grade**. Untuk menilai kecukupan kompetensi skill, gunakan tab **Asesmen Kompetensi** atau **Matriks Kompetensi**. Penjelasan lengkap ada di [Dua perhitungan paralel](/modules/job-requirement/konsep-readiness#dua-perhitungan-yang-berjalan-paralel).
:::

**Export Excel** menghasilkan file `rekap-job-requirement-YYYY-MM-DD.xlsx`, sheet `Rekap Gap`, berisi data yang sedang terfilter.

Karyawan dengan grade yang belum punya profil akan berstatus **Tanpa Profil** dan `% ITEM` = 0. Ini bukan kegagalan karyawan, melainkan profil grade yang belum disusun.

---

## Tab 2 — Asesmen Kompetensi

Tempat mengisi level skill karyawan pada periode aktif.

**Kolom:**

| Kolom | Arti |
| --- | --- |
| KARYAWAN | Nama, NIK, departemen |
| GRADE | Rank |
| READINESS | Bilah progres + persen + chip `Asesmen x/y` |
| STATUS | `Siap` / `Dalam Pengembangan` / `Belum Lengkap` / `Belum Dinilai` |
| LEVEL / TARGET PER SKILL | Cuplikan 8 skill pertama dalam bentuk chip |

**Langkah menilai satu karyawan:**

1. Klik kanan baris → **Asesmen** (atau tombol **Asesmen** pada baris).
2. Dialog terbuka dengan dua tab: **Soft Skill** dan **Hard Skill**.
3. Untuk setiap skill, pilih level `0`–`5` dari dropdown. Label level ditampilkan lengkap, mis. `3 - Mandiri`.
4. Perhatikan banner kelengkapan di atas: *"x dari y skill wajib dinilai"*.
5. Tekan **Simpan**.

**Menghapus satu nilai:**

- Di dalam dialog, tekan **Hapus** pada baris skill tersebut. Nilai dihapus untuk **periode aktif** dan skill kembali berstatus *belum dinilai* — bukan menjadi 0.
- Untuk menghapus asesmen satu skill di **semua periode sekaligus**, gunakan **Master Training → Skill → klik kanan → Hapus Asesmen**. Aksi ini tidak bisa dibatalkan.

**Hal penting:**

| Situasi | Perilaku |
| --- | --- |
| Memilih level `0` | Tersimpan sebagai nilai sah dan dihitung 0 poin |
| Mengosongkan dropdown | Nilai kosong **tidak ikut dikirim**; skill tetap seperti sebelumnya |
| Skill bertarget 0 | Tidak muncul di dialog — bukan syarat |
| Semua dropdown kosong lalu Simpan | Ditolak: *"Tidak ada nilai yang diisi."* |
| Menyimpan sebagian | Diizinkan; status menjadi `Belum Lengkap` |
| Mengubah nilai yang sudah ada | Menimpa nilai pada periode yang sama; `assessedAt` diperbarui |

**Ringkasan di atas tabel** (dihitung backend, bukan di browser):

| Kartu | Arti |
| --- | --- |
| Karyawan | Jumlah baris setelah filter |
| Sudah dinilai | Karyawan yang punya minimal satu asesmen |
| Asesmen lengkap | Karyawan yang seluruh skill wajibnya sudah dinilai |
| Siap | Karyawan berstatus `SIAP` (lengkap dan readiness ≥ 80%) |
| Rata-rata readiness | Rata-rata hanya atas karyawan yang punya nilai (`-` bila belum ada) |

Aksi baris: klik kanan → **Isi Asesmen**.

---

## Tab 3 — Matriks Kompetensi

Tampilan silang **karyawan × skill** untuk satu departemen. Bersifat **read-only**.

**Wajib memilih Departemen** — tanpa itu matriks tidak dimuat. Alasannya teknis: kolom adalah gabungan skill semua grade di departemen tersebut, sehingga lingkup harus dibatasi agar tetap terbaca.

**Kontrol:**

| Kontrol | Fungsi |
| --- | --- |
| Departemen | Wajib. Menentukan kolom & baris |
| Grade | Membatasi baris ke satu grade |
| Sembunyikan kolom tidak relevan | Menyembunyikan kolom `N/A` untuk grade yang difilter |
| Paginasi | Maksimal 200 karyawan per halaman |

**Legenda warna sel:**

| Warna | Arti |
| --- | --- |
| Hijau tua | Memenuhi, dan level ≥ 4 (melatih orang lain / rujukan) |
| Hijau muda | Memenuhi target |
| Oranye | Di bawah target |
| Merah | Level 0 |
| Garis putus-putus | Belum dinilai (skill wajib, tapi belum ada nilai) |
| Abu `N/A` | Skill tidak wajib untuk grade karyawan tersebut |

**Baris ringkasan per skill** menampilkan: berapa karyawan yang wajib punya skill itu, berapa yang sudah dinilai (coverage), berapa yang memenuhi, berapa yang gap, dan rata-rata besar gap.

**Ringkasan atas** menampilkan jumlah karyawan, grade, skill (kolom), sel wajib, sel sudah dinilai, sel belum dinilai, sel `N/A` beserta persennya, serta rata-rata readiness.

:::info Kenapa banyak sel `N/A`
Kolom memakai gabungan skill seluruh grade di departemen. Karyawan Rank 1 hanya wajib 7 skill, sementara katalog bisa berisi 28 skill — sisanya `N/A` untuk dia. Ini normal, bukan data hilang.
:::

**Export Excel** menghasilkan file `matriks-kompetensi-<departemen>-YYYY-MM-DD.xlsx` dengan tiga sheet:

| Sheet | Isi |
| --- | --- |
| `Matriks` | Header: Nama, NIK, Grade, Readiness, **Skill Dinilai**, Status, lalu satu kolom per skill. Sel berwarna sesuai legenda; sel `N/A` bertuliskan `N/A` |
| `Ringkasan` | Statistik atas: jumlah karyawan, grade, skill, sel wajib/dinilai/belum dinilai, sel `N/A` + persen |
| `Gap` | Hanya skill yang punya gap: jumlah wajib, dinilai, gap, rata-rata gap, coverage %, met % |

---

## Tab 4 — Kebutuhan Training

Menampilkan **dua** daftar terpisah. Jangan tertukar.

### 4a. Kebutuhan Training (tabel atas)

Training wajib grade yang belum pernah diikuti karyawan.

| Kolom | Arti |
| --- | --- |
| TRAINING | Nama training |
| JUMLAH KARYAWAN | Berapa karyawan yang belum mengikuti |
| KARYAWAN | Daftar nama (hover untuk melihat semua) |

**Export Excel** menghasilkan `kebutuhan-training-YYYY-MM-DD.xlsx`.

Sumbernya kategori `TRAINING` pada sistem penilaian lama: nama training wajib grade dicocokkan dengan riwayat pelatihan karyawan (nama master training **atau** materi training).

### 4b. Rekomendasi Training dari Gap Skill (panel bawah)

Training yang bisa menutup kekurangan level skill, dihitung dari `skill_training_map`.

| Kolom | Arti |
| --- | --- |
| TRAINING | Nama training + kategori |
| karyawan | Jumlah karyawan yang butuh training ini |
| skills | Skill yang memicu rekomendasi |
| maxGap / totalGap | Gap terbesar dan akumulasi gap |

Panel ini menampilkan peringatan bila:

| Kondisi | Pesan |
| --- | --- |
| Belum ada pemetaan sama sekali | Rekomendasi kosong — isi **Pemetaan Training** lebih dulu |
| Ada gap tapi skill-nya belum dipetakan | Jumlah gap tanpa pemetaan ditampilkan agar tidak dikira "tidak ada masalah" |

:::caution Tab ini tidak akan berisi rekomendasi bila Pemetaan Training masih kosong
Pemetaan skill → training sengaja dimulai kosong. Selama belum diisi, hanya tabel 4a yang berisi data.
:::

---

## Master Training — Tab Syarat Grade

Mengatur **empat komponen wajib non-skill** per grade: Pendidikan, Pengalaman, Status Karyawan, dan Jenis Kelamin.

:::caution Komponen ini tidak memengaruhi readiness
Keempat komponen hanya mengisi kolom **STATUS** di Rekap Gap. Persentase readiness tetap murni dari target skill.
:::

Pilih **Grade** di atas, ubah field, lalu **Simpan Syarat**. Tersedia juga **Batalkan Perubahan** dan **Pratinjau Dampak**.

### Field yang bisa diubah

| Field | Aturan |
| --- | --- |
| Pendidikan Minimal | **Wajib dipilih** dari daftar jenjang: SLTA (Sederajat), D3, S1, S2 |
| Pengalaman Minimal | Bilangan bulat `0`–`50` tahun. Kosong = tidak ada syarat |
| Status Karyawan | Pilih satu atau kedua opsi: Permanen, Kontrak. **Minimal satu** |
| Jenis Kelamin | Pilih satu atau kedua opsi: Laki-laki, Perempuan. **Minimal satu** |
| No. Form / Revisi / Tanggal Berlaku | Metadata sumber, maks. 100 / 20 karakter |
| Catatan Internal | Teks bebas |

Aturan penting:

- Pendidikan **wajib dipilih** dan hanya boleh dari daftar jenjang. Dulu ada opsi teks bebas, tetapi sudah dihapus agar semua grade memakai skala yang sama.
- Mengosongkan Status Karyawan atau Jenis Kelamin **ditolak**, karena array kosong akan membuat komponen itu hilang dari penilaian secara diam-diam.

### Indikator penyaring

Di bawah tiap pilihan muncul keterangan otomatis:

| Keadaan | Keterangan |
| --- | --- |
| Semua opsi terpilih | *"Semua status diterima — komponen ini tidak menyaring siapa pun."* |
| Sebagian dipilih | *"Hanya status terpilih yang memenuhi syarat."* |
| Tidak ada dipilih | *"Minimal satu status harus dipilih."* (merah) |

:::note Bawaan seed tidak menyaring
Seed menulis `PERMANENT + CONTRACT` dan `MALE + FEMALE` untuk kesebelas grade. Artinya secara bawaan kedua komponen ini **tidak pernah menggagalkan siapa pun**. Barulah menyaring setelah Anda membatasinya.
:::

### Dialog konfirmasi dampak

Menekan **Simpan Syarat** selalu memunculkan dialog pratinjau lebih dulu, berisi:

| Bagian | Isi |
| --- | --- |
| Peringatan kuning | Jumlah karyawan yang akan berubah dari **Memenuhi → Belum Memenuhi**, beserta nama, nilai aktual, dan nilai yang dibutuhkan |
| Peringatan hijau | Jumlah karyawan yang berubah sebaliknya (**Belum Memenuhi → Memenuhi**) |
| Chip per komponen | Jumlah pelanggar tiap komponen setelah perubahan |
| Total | `sebelum → sesudah` |

Bila tidak ada yang berubah, dialog menyatakan *"Perubahan ini tidak mengubah status kelayakan karyawan mana pun."* Tombol **Batalkan** menutup dialog tanpa menyimpan.

**Pratinjau Dampak** membuka dialog yang sama tanpa menyimpan — berguna untuk menguji skenario.

### Panel "Dampak Syarat Saat Ini"

Menampilkan kondisi tersimpan:

- empat kartu berisi jumlah pelanggar per komponen
- daftar karyawan yang tidak memenuhi, dikelompokkan per komponen, format `Nama (aktual → butuh syarat)`
- peringatan kuning bila pendidikan memakai keterangan bebas (tidak dinilai otomatis)
- pesan hijau bila seluruh karyawan grade tersebut memenuhi syarat

### Contoh perhitungan dampak

Pada data development, Rank 5 berisi 8 karyawan dengan syarat awal `D3` / `5 tahun`:

| Perubahan | Akibat |
| --- | --- |
| Naikkan pengalaman 5 → 20 tahun | 5 karyawan tambahan gagal (masa kerja 8–11 tahun) |
| Naikkan pendidikan D3 → S1 | 1 karyawan tambahan gagal |
| Batasi gender ke Laki-laki | 2 karyawan gagal |

Karyawan yang semua syarat wajibnya lolos tetapi belum punya asesmen skill akan berstatus **Belum Dinilai** — bukan **Memenuhi**, karena readiness-nya belum terukur.

---

## Master Training — Tab Skill

Ini tempat menyusun **standar**: skill apa yang wajib untuk tiap grade, dan target levelnya. Aksi yang mengubah **standar grade** (daftar wajib, target level, salin dari rank, pemetaan training) hanya dapat dilakukan **Super Admin**; katalog skill dan master training sendiri boleh dikelola Admin.

Pilih **Grade** dan **kategori** (`Soft Skill` / `Hard Skill`) di bagian atas.

### Aksi yang tersedia

| Aksi | Tombol | Perilaku |
| --- | --- | --- |
| Menandai skill wajib | Centang pada tabel | Draf lokal, belum tersimpan |
| Menyimpan daftar wajib | **Simpan Daftar Wajib** | Menyimpan skill mana yang wajib untuk grade + kategori ini |
| Mengatur target | Dropdown **Target Level** per baris | Draf lokal |
| Menyimpan target | **Simpan Target Level** | Menyimpan target seluruh skill wajib terpilih |
| Menambah skill ke katalog | **Tambah Skill Baru** | Skill masuk katalog; otomatis tercentang dengan target 3 |
| Mengubah nama skill | Klik kanan → **Edit Nama** | Berlaku untuk katalog **dan** semua grade yang memakainya |
| Menghapus skill | Klik kanan → **Hapus dari Katalog** | Ditolak bila skill dipakai requirement atau punya asesmen |
| Menyalin dari grade di atas | **Salin dari Rank N** | Menambah skill yang belum ada (union), tidak menghapus |
| Menghapus asesmen satu skill | Klik kanan → **Hapus Asesmen (n)** | Muncul hanya bila `n > 0`. Menghapus asesmen skill itu di **semua periode** |

### Indikator perubahan belum disimpan

Panel aksi menampilkan chip konteks (`Rank 3 · Soft Skill`) dan penanda **kuning** (border + titik) saat ada perubahan yang belum disimpan. Baseline diperbarui setelah penyimpanan berhasil.

:::warning Dua tombol simpan menyimpan hal berbeda
- **Simpan Daftar Wajib** → *skill mana* yang wajib.
- **Simpan Target Level** → *seberapa tinggi* target tiap skill.

Mengubah dropdown target lalu menekan **Simpan Daftar Wajib** tidak akan menyimpan target. Gunakan tombol yang sesuai.
:::

### Tombol "Salin dari Rank N"

Menyalin **gabungan** skill dari grade satu tingkat di atas grade yang sedang dibuka.

| Grade dibuka | Sumber salinan | Catatan |
| --- | --- | --- |
| Rank 1 | Rank 2 | |
| Rank 3 | Rank 4 | |
| Rank 10 | Rank 11 | |
| Rank 11 | — | Tombol nonaktif; tooltip menjelaskan bahwa Rank 11 adalah grade tertinggi |

Sifat salinan:

- **Union**, bukan pengganti: skill yang sudah ada tidak disentuh, target level yang sudah diatur **tidak ditimpa**.
- Hasil dilaporkan: berapa skill **ditambahkan**, berapa **dilewati** karena sudah ada.
- Bila tidak ada yang baru, muncul pesan informasi — bukan pesan sukses yang menyesatkan.

### Mengapa skill tidak bisa dilepas

Melepas centang skill yang **sudah punya asesmen karyawan** akan ditolak dengan pesan berapa asesmen yang menghalangi.

Alasannya: menghapus requirement akan membuat nilai asesmen itu menggantung tanpa konteks target. Urutan yang benar:

1. Hapus asesmen skill tersebut lebih dulu (klik kanan → **Hapus Asesmen**), **atau**
2. Biarkan skill tetap wajib dan setel targetnya ke `0` bila memang tidak lagi disyaratkan.

:::tip Target 0 vs melepas skill
Menyetel target ke `0` lebih aman daripada melepas skill: riwayat asesmen tetap utuh, skill tidak lagi masuk perhitungan readiness, dan tidak ada risiko kehilangan data.
:::

---

## Master Training — Tab Pemetaan Grade

Menentukan **training wajib** untuk sebuah grade.

1. Pilih **Grade**.
2. Cari training bila perlu.
3. Centang training yang wajib.
4. Tekan **Simpan Pemetaan**.

Chip `n training wajib` menunjukkan jumlah terpilih. Perubahan pada tab ini **belum tersimpan** sampai tombol ditekan.

:::danger Tab ini akan tertimpa bila seed dijalankan ulang
Seed `prisma/seed-job-requirement.mjs` menghapus lalu menulis ulang seluruh pemetaan training per grade. Centang yang Anda susun akan kembali ke bawaan form `SII-QSHE-002-03`. Lihat [Data & Seed](/modules/job-requirement/model-data#peringatan-seed).
:::

---

## Master Training — Tab Pemetaan Training

Menghubungkan **skill** dengan **training** yang bisa menutup gap-nya. Inilah yang mengisi panel **Rekomendasi Training**.

1. Buka tab **Pemetaan Training**.
2. Cari skill (bisa difilter kategori).
3. Klik chip training pada baris skill → dialog pemetaan terbuka.
4. Pilih satu atau beberapa training.
5. Simpan.

Kolom **DIPAKAI DI SKILL** pada tab Daftar Training menunjukkan berapa skill memakai training tersebut.

**Nilai `totalMappings`** di atas halaman adalah jumlah total relasi skill→training yang tersimpan. Bila `0`, rekomendasi belum bisa muncul.

---

## Master Training — Daftar Training

CRUD katalog training.

| Aksi | Catatan |
| --- | --- |
| Tambah Training | Nama unik |
| Edit | Klik kanan → **Edit** |
| Hapus | Klik kanan → **Hapus**. Diblokir bila masih dipakai |
| Lihat pemakaian | Buka tab **Pemetaan Training**, lalu klik chip nama training pada baris skill. Dialog pemakaian terbuka |

Dialog pemakaian (**Pemakaian**) hanya dapat dibuka dari tab Pemetaan Training — tidak ada aksi khusus untuk itu di context menu tab Daftar Training.

Guard hapus menyebutkan **tiga** sumber pemakaian sekaligus:

| Sumber | Contoh pesan |
| --- | --- |
| Syarat grade | `3 syarat grade` |
| Pemetaan skill | `2 pemetaan skill` |
| Riwayat pelatihan karyawan | `15 riwayat pelatihan karyawan` |

Pesan lengkap: *"Training "X" tidak bisa dihapus karena masih dipakai di …, …. Lepaskan pemakaian tersebut terlebih dahulu."*

Dialog **Pemakaian** menampilkan daftar grade yang mensyaratkan, skill yang memetakan, jumlah riwayat pelatihan, dan jumlah peserta.

---

## Detail Karyawan & PWA

### Detail Karyawan — Readiness Ledger

Panel ini menggabungkan dua tampilan:

1. **Kartu readiness** di atas: persen besar (`—` bila belum dinilai), chip status, bilah progres, dan catatan *"Asesmen belum lengkap — x dari y skill. Skill yang belum dinilai dihitung 0."*
2. **Daftar kategori** di bawah: pendidikan, pengalaman, status kerja, gender, soft skill, hard skill, training beserta persen masing-masing.

Tombol **Asesmen** membuka dialog yang sama dengan tab Asesmen Kompetensi — jadi penilaian bisa dilakukan langsung dari profil karyawan.

:::note Karyawan tanpa periode aktif
Bila tidak ada periode aktif, `Detail Karyawan` menampilkan readiness `—` dengan status `Belum Dinilai` (asesmen periode lama tidak dicampur), dan tombol **Asesmen** dinonaktifkan dengan tooltip yang menjelaskan sebabnya. Tab Rekap pada kondisi yang sama menolak menghitung (409). Saat periode aktif ada, keduanya identik karena memakai mesin `evaluateSkillReadiness` yang sama.
:::

### PWA Karyawan

Kartu status job requirement di halaman profil karyawan memakai `GET /api/employee-me/job-requirement`. Sumbernya **sistem lama** (`evaluateJobRequirement`): menampilkan `status`, `percentOverall`, daftar kategori, dan item yang belum terpenuhi, dengan periode aktif sebagai filter asesmen.

Karyawan **tidak** dapat menilai dirinya sendiri; semua level diisi admin.

---

## Alur Kerja Satu Periode (Ringkas)

```text
Awal semester
  ├─ Super Admin: cek/revisi target skill per grade      (Master Training → Skill)
  ├─ Super Admin: cek training wajib per grade           (Master Training → Pemetaan Grade)
  └─ Super Admin: aktifkan periode baru                  (Rekap → Atur Periode)
        │
        ▼
Selama semester
  ├─ Admin: buka Rekap → Asesmen Kompetensi
  ├─ Admin: nilai level 0–5 per karyawan (per departemen)
  └─ Admin: pantau chip "Asesmen x/y" sampai lengkap
        │
        ▼
Akhir semester
  ├─ Baca Rekap Gap (kelayakan administratif)
  ├─ Baca Matriks (peta kompetensi departemen) → Export Excel
  ├─ Baca Kebutuhan Training (4a) → rencana pelatihan
  ├─ Isi Pemetaan Training bila masih kosong → baca Rekomendasi (4b)
  └─ Simpan hasil sebagai lampiran rapat SDM
```

---

## Pertanyaan yang Sering Muncul

| Pertanyaan | Jawaban singkat |
| --- | --- |
| Kenapa tombol simpan asesmen tidak aktif? | Belum ada periode aktif, atau tidak ada perubahan yang dikirim. |
| Kenapa matriks kosong? | Departemen belum dipilih. |
| Kenapa persen terlihat rendah padahal beberapa skill bagus? | Skill yang belum dinilai tetap masuk penyebut dan dihitung 0. |
| Kenapa karyawan berstatus "Tanpa Profil"? | Grade-nya belum punya baris `job_requirement_profiles`. |
| Kenapa tidak bisa melepas centang skill? | Skill sudah punya asesmen. Hapus asesmen dulu, atau setel target ke 0. |
| Kenapa tidak bisa menghapus training? | Masih dipakai syarat grade / pemetaan skill / riwayat pelatihan. |
| Kenapa rekomendasi training kosong? | Pemetaan skill → training belum diisi. |
| Kenapa tidak bisa menghapus periode? | Periode masih menyimpan asesmen. Nonaktifkan saja. |
| Apakah menghapus skill menghapus asesmen? | Tidak. Penghapusan justru diblokir bila asesmen ada. |
| Apakah "Hapus Asesmen" hanya untuk periode aktif? | Tidak — aksi itu menghapus **semua periode** untuk skill tersebut. |
