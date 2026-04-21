# Dev Workflow

Panduan singkat workflow development untuk `app-karyawan` di Windows.

## Start Harian

Jalankan:

```bash
npm run dev:full:host
```

Ini menyalakan frontend dan backend dev seperti biasa.

## Saat Prisma Perlu Di-generate Ulang

Jangan hentikan semua `node.exe`.

Gunakan:

```bash
npm run prisma:generate:safe
```

Script ini akan:

1. mendeteksi proses backend dev yang relevan saja
2. menghentikan backend tersebut
3. menjalankan `prisma generate`
4. menyalakan backend kembali bila sebelumnya memang aktif

## Kalau Ingin Mengecek Status Backend

Gunakan:

```bash
npm run dev:server:status
```

## Kalau Ingin Mematikan Backend Saja

Gunakan:

```bash
npm run dev:server:stop
```

## Rule Aman

- Jangan pakai `Stop-Process -Force` ke semua `node.exe`.
- Jangan mematikan backend lewat taskkill global tanpa filter proses.
- Kalau Prisma error karena lock, stop backend saja dulu lalu generate ulang.
