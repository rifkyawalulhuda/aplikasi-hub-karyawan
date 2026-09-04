---
id: contributing
title: Panduan Kontribusi
sidebar_label: Kontribusi
---

# Panduan Kontribusi

Panduan untuk developer yang bekerja di project Hub Karyawan.

## Workflow Development Harian

```bash
cd app-karyawan
npm run dev:full:host
```

Frontend berjalan di `http://localhost:5173`, backend di `http://localhost:4000`.

## Branching

Gunakan branch yang deskriptif:

```
feat/nama-fitur
fix/nama-bug
refactor/nama-area
docs/nama-docs
```

## Alur Perubahan

### 1. Perubahan Schema Database

```bash
# Edit prisma/schema.prisma
# Buat migration
npx prisma migrate dev --name nama_perubahan
# Migration otomatis di-apply ke database lokal
```

### 2. Regenerate Prisma Client (tanpa matikan semua node)

```bash
npm run prisma:generate:safe
```

### 3. Build & Test

```bash
# Jalankan unit test
npm run test

# Build frontend (verifikasi tidak ada error)
npm run build

# Lint semua file
npm run lint
```

## Konvensi Kode

### Backend

- Semua route handler menggunakan `withAsync` untuk error handling
- Validasi input dilakukan di awal handler sebelum query database
- Error bisnis dilempar dengan `Object.assign(new Error('...'), { statusCode: 4xx })`
- Prisma query dengan `include` harus menggunakan `select` untuk membatasi field yang diambil

### Frontend

- Komponen baru di `src/components/` jika dipakai di lebih dari satu halaman
- `apiRequest()` untuk request admin, `employeeMeRequest()` untuk request karyawan
- Halaman portal mobile di `src/pages/employeeMobile/`
- Semua import menggunakan alias `@/` (bukan path relatif `../../`)

### Penamaan

| Jenis | Konvensi | Contoh |
|-------|----------|--------|
| Komponen React | PascalCase | `EmployeeFormDialog` |
| Hook | camelCase + `use` | `useEmployeeAuth` |
| Fungsi biasa | camelCase | `formatLongDate` |
| File komponen | PascalCase | `EmployeeFormDialog.jsx` |
| File non-komponen | camelCase | `employeePortal.js` |

## Menambah Halaman Baru (Admin)

1. Buat folder `src/pages/namaHalaman/`
2. Buat `index.jsx` dengan default export komponen halaman
3. Tambah lazy import di `src/utils/routes/index.jsx`
4. Tambah `<Route>` di blok `<MainLayout>`
5. Tambah entry di `src/components/layouts/mainLayout/navItems.js`

## Menambah Halaman Baru (Portal Mobile)

1. Buat folder `src/pages/employeeMobile/namaHalaman/`
2. Buat `index.jsx`
3. Tambah lazy import di `src/utils/routes/index.jsx`
4. Tambah `<Route>` di blok `/karyawan` di `EmployeeMobileLayout`
5. Tambah shortcut di `QUICK_MENU_ITEMS` di `dashboard/index.jsx` (jika relevan)

## Menambah API Endpoint Baru

1. Tambah handler di route yang relevan (`server/routes/`)
2. Handler baru menggunakan `withAsync`
3. Jika endpoint baru butuh auth, pastikan route sudah di belakang middleware `requireAdminAuth` atau `requireEmployeeAuth`
4. Update dokumentasi API di `documentation/docs/api/endpoints.md`

## Deploy ke Production

Setelah merge ke `master`:

```bash
# Di server production
git pull
cd app-karyawan
npm install

# Jika ada perubahan schema
npx prisma migrate deploy
npx prisma generate

# Rebuild jika ada perubahan frontend
npm run build:prod

# Restart
pm2 restart hub-karyawan-api
pm2 save
```

## Memperbarui Dokumentasi

Dokumentasi ada di folder `documentation/`. Setelah push ke `master`, GitHub Actions otomatis build dan deploy ke GitHub Pages.

Untuk preview lokal:

```bash
cd documentation
npm install
npm start
# Buka http://localhost:3000/aplikasi-hub-karyawan/
```
