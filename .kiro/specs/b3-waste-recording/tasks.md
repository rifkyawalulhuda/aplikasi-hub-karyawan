# Implementation Plan: Pencatatan Limbah B3

## Overview

Implementasi modul Pencatatan Limbah B3 untuk Aplikasi Hub Karyawan, mencakup database schema, backend REST API, frontend service layer, halaman pencatatan dengan DataGrid, form dialog CRUD, master data jenis limbah B3, monitoring batas penyimpanan, dan ekspor Excel. Implementasi mengikuti pola arsitektur domain-based pages di frontend dan resource-based routes di backend yang sudah ada.

## Tasks

- [x] 1. Database schema dan migrasi
  - [x] 1.1 Tambahkan model B3WasteType, B3WasteRecord, dan B3WasteOutRecord ke prisma/schema.prisma
    - Tambahkan model `B3WasteType` dengan field id, siteId, kode (VarChar 20), nama (VarChar 200), createdAt, updatedAt, relasi ke B3WasteRecord, unique constraint [siteId, kode], map ke "b3_waste_types"
    - Tambahkan model `B3WasteRecord` dengan field id, siteId, jenisLimbahId, tanggalMasuk (Date), sumberLimbah (VarChar 200), jumlahMasuk (Decimal 10,2), maksimalPenyimpanan (Int), tanggalBatas (Date), petugasPenanggungJawab (VarChar 100), createdAt, updatedAt, relasi ke B3WasteType dan B3WasteOutRecord[], map ke "b3_waste_records"
    - Tambahkan model `B3WasteOutRecord` dengan field id, siteId, wasteRecordId, tanggalKeluar (Date), jumlahKeluar (Decimal 10,2), tujuanPenyerahan (VarChar 200), nomorDokumen (VarChar 100), petugasPenanggungJawab (VarChar 100), createdAt, updatedAt, relasi ke B3WasteRecord, map ke "b3_waste_out_records"
    - Jalankan `npm run prisma:migrate` untuk membuat migrasi
    - _Requirements: 1.1, 1.8, 2.1, 2.7, 7.1, 10.1_

- [x] 2. Backend route: Master Data Jenis Limbah B3
  - [x] 2.1 Buat file server/routes/b3WasteTypes.js dengan CRUD endpoints
    - Implementasi GET `/api/b3-waste/types` — daftar jenis limbah B3 dengan pagination, filtered by siteId
    - Implementasi POST `/api/b3-waste/types` — tambah jenis limbah baru dengan validasi Yup (kode required max 20, nama required max 200), set siteId otomatis
    - Implementasi PUT `/api/b3-waste/types/:id` — edit jenis limbah, kode tidak dapat diubah (immutable), validasi site ownership
    - Implementasi DELETE `/api/b3-waste/types/:id` — hapus jenis limbah, tolak jika masih digunakan oleh B3WasteRecord (P2003 / pre-check)
    - Gunakan middleware chain: `requireAdminAuth`, `requireSiteIsolation`
    - Handle error: 409 untuk duplicate kode, 409 untuk foreign key constraint, 404 untuk not found
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.1, 10.2, 10.3, 10.4_

  - [x] 2.2 Write property test: Unique Waste Type Code Per Site
    - **Property 11: Unique Waste Type Code Per Site**
    - **Validates: Requirements 7.5**

  - [x] 2.3 Write property test: Field Immutability After Save (kode)
    - **Property 9: Field Immutability After Save**
    - **Validates: Requirements 7.4, 8.2**

- [x] 3. Backend route: Pencatatan Limbah B3 (Records + Out Records)
  - [x] 3.1 Buat file server/routes/b3WasteRecords.js dengan CRUD endpoints limbah masuk
    - Implementasi GET `/api/b3-waste/records` — daftar pencatatan dengan pagination, sorting (tanggalMasuk, tanggalBatas), include outRecords, computed fields (sisaLimbah, sisaHari, statusPenyimpanan), filtered by siteId
    - Implementasi POST `/api/b3-waste/records` — tambah limbah masuk, validasi Yup (jenisLimbahId required, tanggalMasuk required date min 2020-01-01 max today, sumberLimbah required max 200, jumlahMasuk required min 0.01 max 999999.99 precision 2, maksimalPenyimpanan required enum [90, 180], petugasPenanggungJawab required max 100), hitung tanggalBatas = tanggalMasuk + maksimalPenyimpanan hari, set siteId otomatis
    - Implementasi PUT `/api/b3-waste/records/:id` — edit limbah masuk, petugasPenanggungJawab immutable, validasi site ownership
    - Implementasi DELETE `/api/b3-waste/records/:id` — hapus limbah masuk, tolak jika memiliki outRecords terkait
    - Gunakan middleware chain: `requireAdminAuth`, `requireSiteIsolation`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 8.2, 10.1, 10.2, 10.4_

  - [x] 3.2 Tambahkan endpoints pencatatan limbah keluar pada b3WasteRecords.js
    - Implementasi POST `/api/b3-waste/records/:id/out` — tambah limbah keluar, validasi Yup (tanggalKeluar required date min tanggalMasuk parent max today, jumlahKeluar required min 0.01 max sisaLimbah precision 2, tujuanPenyerahan required max 200, nomorDokumen required max 100, petugasPenanggungJawab required max 100), validasi jumlah keluar tidak melebihi sisa limbah
    - Implementasi PUT `/api/b3-waste/out-records/:id` — edit limbah keluar, petugasPenanggungJawab immutable, validasi site ownership, validasi jumlah keluar baru tidak melebihi sisa
    - Implementasi DELETE `/api/b3-waste/out-records/:id` — hapus limbah keluar, validasi site ownership
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.4, 6.5, 8.2, 10.1, 10.4_

  - [x] 3.3 Write property test: Waste Record Creation Round-Trip
    - **Property 1: Waste Record Creation Round-Trip**
    - **Validates: Requirements 1.1, 1.8**

  - [x] 3.4 Write property test: Validation Rejects Invalid Inputs
    - **Property 2: Validation Rejects Invalid or Incomplete Inputs**
    - **Validates: Requirements 1.7, 1.9, 2.8**

  - [x] 3.5 Write property test: Cannot Exceed Remaining Waste
    - **Property 4: Cannot Exceed Remaining Waste**
    - **Validates: Requirements 2.6**

  - [x] 3.6 Write property test: Referential Integrity Prevents Deletion
    - **Property 8: Referential Integrity Prevents Deletion**
    - **Validates: Requirements 6.6, 7.7**

- [x] 4. Backend: Computed fields dan business logic
  - [x] 4.1 Implementasi logic perhitungan sisaLimbah, sisaHari, dan statusPenyimpanan pada GET records
    - `sisaLimbah` = jumlahMasuk - SUM(outRecords.jumlahKeluar), presisi 2 desimal
    - `sisaHari` = tanggalBatas - today (dalam hari)
    - `statusPenyimpanan`: jika sisaLimbah <= 0 → "normal"; jika sisaHari > 14 → "normal"; jika 1 <= sisaHari <= 14 → "warning"; jika sisaHari <= 0 → "overdue"
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 4.2 Write property test: Remaining Waste Accounting Invariant
    - **Property 3: Remaining Waste Accounting Invariant**
    - **Validates: Requirements 2.7, 3.1**

  - [x] 4.3 Write property test: Storage Status Classification
    - **Property 5: Storage Status Classification**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**

  - [x] 4.4 Write property test: Site Isolation Invariant
    - **Property 7: Site Isolation Invariant**
    - **Validates: Requirements 5.4, 10.1, 10.2, 10.3, 10.4**

  - [x] 4.5 Write property test: Sorting Correctness
    - **Property 10: Sorting Correctness**
    - **Validates: Requirements 5.3**

- [x] 5. Checkpoint - Backend selesai
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Backend: Ekspor Excel
  - [x] 6.1 Buat file server/lib/b3WasteExport.js untuk generate file Excel
    - Gunakan ExcelJS untuk membuat workbook
    - Baris pertama: header nomor izin "660.3/Per.TPLB3 144/VII/P3LH/DLH/2020"
    - Baris kedua: judul kolom sesuai urutan tampilan tabel (Jenis Limbah B3, Tanggal Masuk, Sumber Limbah, Jumlah Masuk, Maksimal Penyimpanan, Tanggal Batas, Tanggal Keluar, Jumlah Keluar, Tujuan Penyerahan, Nomor Dokumen, Sisa Limbah, Sisa Hari)
    - Format angka menggunakan format Indonesia (titik ribuan, koma desimal)
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.2 Tambahkan endpoint GET `/api/b3-waste/export` pada b3WasteRecords.js
    - Query seluruh data pencatatan sesuai filter aktif dan siteId
    - Panggil b3WasteExport.js untuk generate file
    - Return file .xlsx dengan nama "Pencatatan_Limbah_B3_{YYYY-MM-DD}.xlsx"
    - Jika tidak ada data, return 400 dengan pesan "Tidak ada data untuk diekspor"
    - _Requirements: 9.1, 9.4_

- [x] 7. Registrasi route di server/index.js
  - [x] 7.1 Mount routes b3WasteRecords dan b3WasteTypes pada Express app
    - Import `b3WasteRecordsRouter` dari `server/routes/b3WasteRecords.js`
    - Import `b3WasteTypesRouter` dari `server/routes/b3WasteTypes.js`
    - Mount: `app.use('/api/b3-waste/records', requireAdminAuth, requireSiteIsolation, b3WasteRecordsRouter)`
    - Mount: `app.use('/api/b3-waste/types', requireAdminAuth, requireSiteIsolation, b3WasteTypesRouter)`
    - Mount export endpoint sesuai pattern yang sudah ada
    - _Requirements: 10.1, 10.4, 10.5_

- [x] 8. Frontend: Service layer
  - [x] 8.1 Buat file src/services/b3WasteService.js
    - Import `apiRequest` dan `appendSiteIdParam` dari `@/services/api.js`
    - Implementasi `getWasteRecords(siteId, params)` — GET dengan pagination/sorting params
    - Implementasi `createWasteRecord(siteId, data)` — POST limbah masuk
    - Implementasi `updateWasteRecord(siteId, id, data)` — PUT edit limbah masuk
    - Implementasi `deleteWasteRecord(siteId, id)` — DELETE limbah masuk
    - Implementasi `createWasteOutRecord(siteId, recordId, data)` — POST limbah keluar
    - Implementasi `updateWasteOutRecord(siteId, id, data)` — PUT edit limbah keluar
    - Implementasi `deleteWasteOutRecord(siteId, id)` — DELETE limbah keluar
    - Implementasi `exportWasteRecords(siteId, params)` — GET export Excel (blob download)
    - Implementasi `getWasteTypes(siteId, params)` — GET daftar jenis limbah
    - Implementasi `createWasteType(siteId, data)` — POST jenis limbah baru
    - Implementasi `updateWasteType(siteId, id, data)` — PUT edit jenis limbah
    - Implementasi `deleteWasteType(siteId, id)` — DELETE jenis limbah
    - _Requirements: 1.1, 2.1, 5.1, 6.1, 6.5, 7.2, 7.3, 9.1_

- [x] 9. Frontend: Halaman Pencatatan Limbah B3
  - [x] 9.1 Buat file src/pages/employeeData/pencatatanLimbahB3/PencatatanLimbahB3.jsx
    - Implementasi halaman DataGrid dengan kolom: Jenis Limbah B3, Tanggal Masuk, Sumber Limbah, Jumlah Masuk (kg), Maksimal Penyimpanan, Tanggal Batas, Tanggal Keluar, Jumlah Keluar (kg), Tujuan Penyerahan, Nomor Dokumen, Sisa Limbah (kg), Sisa Hari
    - Server-side pagination (default 25, options [25, 50, 100])
    - Server-side sorting (tanggalMasuk desc default, tanggalBatas)
    - Indikator visual: warning (kuning) jika 1-14 sisaHari dan sisaLimbah > 0, overdue (merah) jika sisaHari <= 0 dan sisaLimbah > 0
    - Format angka Indonesia (titik ribuan, koma desimal) untuk kolom jumlah
    - Tombol: Tambah Limbah Masuk, Tambah Limbah Keluar, Edit, Hapus, Ekspor Excel
    - Loading state, empty state, error state dengan retry
    - _Requirements: 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.5, 5.6, 5.7_

  - [x] 9.2 Write property test: Indonesian Number Formatting
    - **Property 6: Indonesian Number Formatting**
    - **Validates: Requirements 3.4**

- [x] 10. Frontend: Form Dialog Limbah Masuk
  - [x] 10.1 Buat file src/pages/employeeData/pencatatanLimbahB3/WasteRecordForm.jsx
    - Dialog modal dengan Formik + Yup validation
    - Fields: jenisLimbahId (dropdown dari master data), tanggalMasuk (date picker, default today, min 2020-01-01, max today), sumberLimbah (text, max 200), jumlahMasuk (numeric, min 0.01, max 999999.99, precision 2), maksimalPenyimpanan (dropdown [90, 180]), petugasPenanggungJawab (text, auto-fill nama admin login, max 100)
    - Mode create: semua field kosong kecuali tanggalMasuk (default today) dan petugasPenanggungJawab (auto-fill)
    - Mode edit: pre-fill semua field dari editData, petugasPenanggungJawab read-only/disabled
    - Inline validation error messages di bawah field
    - Submit: panggil createWasteRecord atau updateWasteRecord via service, tampilkan snackbar sukses, tutup dialog, callback onSuccess untuk refresh data
    - Handle API errors: tampilkan snackbar error dengan pesan dari server
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [x] 11. Frontend: Form Dialog Limbah Keluar
  - [x] 11.1 Buat file src/pages/employeeData/pencatatanLimbahB3/WasteOutRecordForm.jsx
    - Dialog modal dengan Formik + Yup validation
    - Fields: tanggalKeluar (date picker, min tanggalMasuk parent, max today), jumlahKeluar (numeric, min 0.01, max sisaLimbah parent, precision 2), tujuanPenyerahan (text, max 200), nomorDokumen (text, max 100), petugasPenanggungJawab (text, auto-fill nama admin login, max 100)
    - Mode create: semua field kosong kecuali petugasPenanggungJawab (auto-fill)
    - Mode edit: pre-fill dari editData, petugasPenanggungJawab read-only/disabled
    - Inline validation error messages
    - Submit: panggil createWasteOutRecord atau updateWasteOutRecord via service, tampilkan snackbar sukses, tutup dialog, callback onSuccess untuk refresh data
    - Handle API errors: tampilkan snackbar error (termasuk pesan jika jumlah melebihi sisa)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [x] 12. Frontend: Master Data Jenis Limbah B3
  - [x] 12.1 Buat file src/pages/masterData/masterDokumen/JenisLimbahB3Tab.jsx
    - Tab component untuk ditambahkan pada halaman Master Data Dokumen yang sudah ada
    - DataGrid dengan kolom: Kode Limbah, Jenis Limbah B3
    - Pagination default 25 baris per halaman
    - Form dialog untuk tambah/edit: kode (text, max 20, disabled saat edit), nama (text, max 200)
    - Tombol hapus dengan dialog konfirmasi
    - Handle error 409 (kode sudah terdaftar, data masih digunakan)
    - Filter data by siteId aktif
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 12.2 Integrasikan JenisLimbahB3Tab ke halaman Master Data Dokumen yang sudah ada
    - Tambahkan tab "Jenis Limbah B3" pada komponen MasterDokumen page
    - Import dan render JenisLimbahB3Tab pada tab tersebut
    - _Requirements: 7.1_

- [x] 13. Frontend: Routing dan navigasi
  - [x] 13.1 Tambahkan route dan navigasi untuk halaman Pencatatan Limbah B3
    - Tambahkan route di `src/utils/routes/index.jsx` untuk path pencatatan limbah B3
    - Tambahkan menu item di sidebar/navigasi yang sesuai (domain employeeData)
    - Gunakan lazy loading dengan `withLazyLoadably` HOC
    - _Requirements: 5.1_

- [x] 14. Checkpoint - Frontend selesai
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Integrasi dan wiring end-to-end
  - [x] 15.1 Verifikasi integrasi penuh: delete confirmation dialog, refresh data setelah CRUD, ekspor Excel download
    - Pastikan delete record limbah masuk yang memiliki outRecords ditolak dengan pesan error
    - Pastikan delete jenis limbah yang masih digunakan ditolak dengan pesan error
    - Pastikan ekspor Excel menghasilkan file dengan header izin dan format kolom sesuai
    - Pastikan computed fields (sisaLimbah, sisaHari, statusPenyimpanan) ter-update setelah setiap operasi CRUD
    - Pastikan site isolation bekerja pada semua endpoint
    - _Requirements: 3.3, 6.4, 6.5, 6.6, 6.7, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 15.2 Write integration tests untuk CRUD lifecycle dan edge cases
    - Test full lifecycle: create waste record → add out record → verify sisaLimbah → delete out record → delete waste record
    - Test cross-site access returns 403
    - Test export Excel generates valid file
    - _Requirements: 5.4, 6.6, 9.1, 10.4_

- [x] 16. Final checkpoint - Pastikan semua komponen terintegrasi
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All UI text, error messages, and labels must be in Indonesian (Bahasa Indonesia)
- Follow existing code style: tabs, single quotes, ESM imports, no TypeScript
- Use path aliases (@, @helpers, @hooks, @hocs) in frontend imports

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.5", "3.6", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["9.1", "10.1", "11.1", "12.1"] },
    { "id": 8, "tasks": ["9.2", "12.2", "13.1"] },
    { "id": 9, "tasks": ["15.1"] },
    { "id": 10, "tasks": ["15.2"] }
  ]
}
```
