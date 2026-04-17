# Troubleshooting Prisma Migrate Dev

Dokumen ini menjelaskan cara menangani kasus saat `npx prisma migrate dev` gagal karena histori migrasi Prisma tidak sinkron dengan kondisi database.

## Kasus Yang Pernah Terjadi

Saat menjalankan:

```powershell
npx prisma migrate dev
```

muncul indikasi seperti berikut:

```text
- The migration `20260326153000_add_master_holidays` failed.
- Drift detected: Your database schema is not in sync with your migration history.

[+] Added tables
  - master_holidays

We need to reset the "public" schema at "localhost:5434"
```

Pada kasus ini, database `hub_karyawan` di `localhost:5434` sudah memiliki tabel `master_holidays`, tetapi Prisma masih menganggap migrasi `20260326153000_add_master_holidays` gagal.

## Akar Masalah

Masalah ini biasanya terjadi ketika:

1. SQL migrasi sempat membuat tabel di database.
2. Proses Prisma terhenti atau gagal sebelum status migrasi ditandai sukses di tabel `_prisma_migrations`.
3. Saat `prisma migrate dev` dijalankan lagi, Prisma mencoba membuat tabel yang sama.
4. Database menolak karena tabel tersebut sudah ada.

Hasilnya:

- schema database sebenarnya sudah berubah
- histori migrasi Prisma belum sinkron
- Prisma mendeteksi `drift`

## Cara Cek Kondisinya

### 1. Cek status migrasi

```powershell
npx prisma migrate status
```

### 2. Cek isi file migrasi yang bermasalah

Contoh:

```powershell
Get-Content prisma\migrations\20260326153000_add_master_holidays\migration.sql
```

Pastikan file migrasi memang berisi pembuatan objek yang sekarang sudah ada di database.

### 3. Cek histori tabel `_prisma_migrations`

Jika `psql` belum tersedia di local environment, bisa memakai Prisma Client:

```powershell
@'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const rows = await prisma.$queryRawUnsafe(`
  SELECT migration_name, started_at, finished_at, rolled_back_at, logs
  FROM _prisma_migrations
  ORDER BY started_at
`);
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
'@ | node --input-type=module -
```

Perhatikan migrasi yang:

- `finished_at` masih `null`
- `rolled_back_at` masih `null`
- `logs` berisi error seperti `relation "master_holidays" already exists`

### 4. Cek apakah objek database memang sudah ada

Contoh cek tabel:

```powershell
@'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const rows = await prisma.$queryRawUnsafe(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'master_holidays'
`);
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
'@ | node --input-type=module -
```

Jika tabel memang sudah ada dan sesuai dengan migrasi, biasanya kita tidak perlu reset database.

## Solusi Aman

Jika objek database sudah ada dan sesuai isi migrasi, tandai migrasi tersebut sebagai `applied`:

```powershell
npx prisma migrate resolve --applied 20260326153000_add_master_holidays
```

Perintah ini akan:

- menandai entry gagal lama sebagai rolled back
- menambahkan entry baru sebagai applied
- menyinkronkan histori Prisma tanpa menghapus data

Setelah itu lanjutkan migrasi:

```powershell
npx prisma migrate dev --skip-seed
```

Lalu regenerate Prisma Client:

```powershell
npx prisma generate
```

## Verifikasi Setelah Perbaikan

Jalankan:

```powershell
npx prisma migrate status
```

Jika normal, hasilnya akan menunjukkan:

```text
Database schema is up to date!
```

Opsional, verifikasi juga bahwa semua migrasi sudah `finished_at` dan tidak ada yang pending.

## Kapan Jangan Pakai `migrate resolve`

Jangan langsung pakai `migrate resolve --applied` jika:

- tabel atau kolom yang diharapkan belum benar-benar ada di database
- struktur tabel di database berbeda dari isi file migrasi
- Anda tidak yakin perubahan SQL sebelumnya sudah lengkap

Dalam kondisi itu, `resolve --applied` bisa membuat histori Prisma terlihat sehat padahal schema database masih salah.

## Kapan Reset Database Boleh Dilakukan

Reset boleh dipilih jika:

- database hanya untuk local development
- data aman untuk dihapus
- Anda memang ingin membangun ulang schema dari nol

Contoh:

```powershell
npx prisma migrate reset
```

Perhatian:

- perintah ini menghapus schema database
- seluruh data di schema target akan hilang
- perlu seed ulang bila aplikasi membutuhkannya

## Ringkasan Keputusan Untuk Kasus Ini

Untuk kasus `20260326153000_add_master_holidays`, langkah yang benar adalah:

1. Tidak reset database.
2. Tandai migrasi sebagai applied dengan `prisma migrate resolve`.
3. Jalankan kembali `prisma migrate dev`.
4. Jalankan `prisma generate`.
5. Verifikasi dengan `prisma migrate status`.

## Checklist Cepat

Gunakan checklist ini saat error serupa muncul lagi:

1. Jalankan `npx prisma migrate status`.
2. Identifikasi nama migrasi yang gagal.
3. Cek isi file `migration.sql`.
4. Cek apakah objek schema target sudah benar-benar ada di database.
5. Cek isi `_prisma_migrations`.
6. Jika objek sudah ada dan sesuai, jalankan `npx prisma migrate resolve --applied <migration_name>`.
7. Jalankan `npx prisma migrate dev --skip-seed`.
8. Jalankan `npx prisma generate`.
9. Pastikan `Database schema is up to date!`.
