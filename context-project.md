# Context Project

## Ringkasan Proyek

Proyek ini adalah aplikasi internal `Hub Karyawan` yang dibangun di atas template yang sudah tersedia pada folder `aplikasi-hub-karyawan`, dengan stack utama:

- React JS
- Vite
- Material UI
- PostgreSQL
- Prisma ORM
- Docker untuk environment database development

Tujuan aplikasi adalah menjadi pusat pengelolaan data karyawan, history/report, pengajuan cuti, master data, dan dokumen lisensi/sertifikasi.

## Folder Implementasi Aktif

Implementasi aktif saat ini menggunakan folder:

- `app-karyawan`

Folder ini dipilih sebagai basis utama pengembangan karena struktur template-nya lebih ringan dan cocok untuk membangun modul bisnis dari awal.

## Status Folder Template

- `app-karyawan` adalah folder implementasi aktif proyek Hub Karyawan saat ini.
- `complete-template` hanya digunakan sebagai referensi template bawaan, demo komponen, dan contoh halaman. Folder ini bukan source utama aplikasi yang sedang dikembangkan.

## Tujuan Utama

- Menyediakan aplikasi internal untuk administrasi dan monitoring data karyawan.
- Menyediakan form dan report yang mengikuti format dokumen/form existing perusahaan.
- Menyediakan alur approval pengajuan cuti berdasarkan struktur jabatan, department, dan grup shift.
- Menyediakan master data yang rapi dan mudah dimigrasikan antar perangkat development.

## Keputusan Teknis yang Sudah Disepakati

### Frontend

- Menggunakan template project yang sudah ada di folder proyek.
- Menggunakan React JS + Vite.
- Menggunakan Material UI sebagai library UI utama.

### Backend dan Database

- Database menggunakan PostgreSQL.
- ORM menggunakan Prisma.
- PostgreSQL pada environment development dijalankan melalui Docker.
- Port host PostgreSQL untuk proyek ini menggunakan `5434` agar tidak bentrok dengan container lain di perangkat development.
- Docker Compose project untuk aplikasi aktif menggunakan nama `app-karyawan`.
- Container PostgreSQL aktif menggunakan nama `app-karyawan-postgres`.
- Primary key tiap tabel menggunakan `id` auto increment.
- Kolom `NO` pada tabel UI hanya nomor urut tampilan, bukan kolom utama database.
- Backend API awal menggunakan Express JS dalam project yang sama dengan frontend.

## Struktur Navigasi yang Sudah Disepakati

- Tab utama: `Data Master`
- Dropdown: `Master Data Karyawan`
- Submenu awal:
  - `Master Admin`
  - `Master Work Location`
  - `Master Department`
  - `Master Job Role`
  - `Master Job Level`
- Dropdown tambahan: `Master Data Dokumen`
- Submenu dokumen:
  - `Master Dok PKB`
- Tab utama tambahan: `Data Karyawan`
- Menu utama: `Bimbingan & Pengarahan`
- Menu tambahan: `Data Surat Peringatan`

## Scope Modul yang Sudah Dibahas

### 1. Data Master

Fokus implementasi awal proyek.

#### Master Karyawan

Struktur `Master Karyawan` mengikuti file Excel:

- File sumber: `D:\Github\aplikasi-hub-karyawan\database master karyawan.xlsx`
- Sheet sumber: `Data`

Kolom utama yang diimplementasikan:

- `Employee No`
- `Password`
- `Fullname`
- `Employment Type`
- `Site / Div`
- `Department`
- `Length Of Service` (hasil kalkulasi dari `Join Date`, tidak disimpan sebagai kolom fisik)
- `Age` (hasil kalkulasi dari `Birth Date`, tidak disimpan sebagai kolom fisik)
- `Birth Date`
- `Gender`
- `Work Location`
- `Job Role`
- `Job Level`
- `Education Level`
- `Grade`
- `Join Date`
- `Phone Number`
- `Email`

Relasi master yang dipakai:

- `Department` -> dari `Master Department`
- `Work Location` -> dari `Master Work Location`
- `Job Role` -> dari `Master Job Role`
- `Job Level` -> dari `Master Job Level`

Catatan implementasi:

- `Employee No` disimpan sebagai unique field.
- `Site / Div` default awal adalah `CLC`.
- `Age` dan `Length Of Service` dihitung otomatis dari tanggal pada layer aplikasi/API.
- Kolom `Password` saat ini masih disimpan sebagai string biasa untuk mengikuti struktur master data awal; hashing/authentication belum diimplementasikan pada fase ini.
- Kolom `Password` saat ini masih disimpan sebagai string biasa untuk mengikuti struktur master data awal.
- Login aplikasi sekarang menggunakan data `Master Admin` dengan rule:
  - input `NIK` divalidasi ke `Master Admin -> Employee -> employeeNo`
  - input `password` divalidasi ke `Master Admin -> password`
  - user yang belum terdaftar di `Master Admin` tidak bisa mengakses aplikasi
- Proteksi akses halaman frontend sekarang mewajibkan login terlebih dahulu.
- Session login frontend saat ini disimpan di `localStorage` browser.
- Hashing password dan session backend persisten belum diimplementasikan pada fase ini.
- Nilai `Employment Type` untuk user-facing UI dan template Excel menggunakan format label `Permanent` dan `Contract`, sedangkan penyimpanan internal database tetap memakai enum teknis.
- Nilai `Grade` untuk user-facing UI dan template Excel menggunakan format label seperti `Rank 1`, `Rank 2`, dan seterusnya, sedangkan penyimpanan internal database tetap memakai enum teknis.
- Sudah tersedia template Excel bulk import untuk `Master Karyawan`.
- Sudah tersedia fitur import bulk dari file Excel pada halaman `Master Karyawan`.
- Import bulk mendukung partial success:
  - baris valid tetap diimport
  - baris gagal menghasilkan file error report `.xlsx`
- Tombol download template tersedia pada halaman `Master Karyawan`.

#### Master Work Location

- Kolom database utama:
  - `id` : auto increment
  - `workLocation` : varchar

#### Master Department

- Kolom database utama:
  - `id` : auto increment
  - `department` : varchar

#### Master Job Role

- Kolom database utama:
  - `id` : auto increment
  - `jobRole` : varchar

#### Master Job Level

- Kolom database utama:
  - `id` : auto increment
  - `jobLevel` : varchar

#### Master Dok PKB

- Kolom database utama:
  - `id` : auto increment
  - `article` : varchar
  - `content` : text
- Ditempatkan pada grup menu `Master Data Dokumen`
- Form input mengikuti pola halaman master yang sudah ada, dengan field:
  - `(PKB) Pasal`
  - `Isi` sebagai textarea
- Sudah tersedia template Excel bulk import untuk `Master Dok PKB`.
- Sudah tersedia fitur import bulk dari file Excel pada halaman `Master Dok PKB`.
- Import bulk mendukung partial success:
  - baris valid tetap diimport
  - baris gagal menghasilkan file error report `.xlsx`

### 2. History Karyawan (Report)

Modul ini direncanakan untuk menampilkan histori karyawan dan report keseluruhan, mencakup contoh data seperti:

- History konseling karyawan
- Surat peringatan
- Pelatihan
- Sakit berat / rawat inap
- Instruksi kerja
- Dan histori lain yang relevan

#### Halaman Konseling Karyawan

- Menyediakan form input konseling karyawan.
- Terdapat dua form:
  - `FORMULIR CATATAN BIMBINGAN KARYAWAN`
  - `FORMULIR CATATAN PENGARAHAN KARYAWAN`
- Isi kolom harus mengikuti form integrasi existing.
- Perlu fungsi print dengan format yang sama dengan form aslinya.
- Implementasi awal yang sudah dibuat:
  - halaman `Bimbingan & Pengarahan`
  - tombol input dropdown untuk memilih:
    - `Formulir Catatan Bimbingan Karyawan`
    - `Formulir Catatan Pengarahan Karyawan`
  - struktur field mengikuti dokumen `SII-QSHE-091-02 Formulir Catatan Bimbingan Karyawan.docx`
  - field `Nama Karyawan`, `NIK`, `Departemen`, `Jabatan`, dan `Rank`
  - `NIK` diisi dari `Employee No`
  - `Departemen` diisi dari `Master Department`
  - `Jabatan` diisi dari `Job Level`
  - `Rank` diisi dari `Grade`
  - tabel data sekarang memiliki kategori:
    - `Bimbingan` untuk formulir bimbingan
    - `Pengarahan` untuk formulir pengarahan
  - halaman `Detail` full-page untuk melihat hasil formulir
  - tombol `Print A4` pada halaman detail
  - layout print sekarang menggunakan template visual dari `SII-QSHE-091-02 Formulir Catatan Bimbingan Karyawan.pdf` sebagai background agar spacing, border, dan proporsi mendekati form resmi
  - ditambahkan template visual `SII-QSHE-091-01 Catatan Pengarahan Karyawan.pdf` untuk print `Formulir Catatan Pengarahan Karyawan`
  - `Formulir Catatan Pengarahan Karyawan` memiliki section:
    - `A.1 Pengetahuan/Keterampilan Kerja`
    - `A.2 Tanggung Jawab Pekerjaan`
    - `B. Penyebab Masalah`
    - `C. Pemecahan Masalah (Oleh Atasan Langsung)`
  - field identitas tersebut terisi otomatis saat user memilih `Nama Karyawan`
  - halaman daftar sudah memiliki filter:
    - pencarian no-case sensitive
    - kategori `Bimbingan` / `Pengarahan`
    - rentang tanggal `Dari Tanggal` dan `Sampai Tanggal`
  - halaman daftar sudah mendukung seleksi data satu per satu dan `pilih semua`
  - data yang dipilih dapat dicetak bulk dalam format `A4` dengan layout form asli masing-masing kategori
  - halaman daftar sudah memiliki fitur `Export Excel`
  - file export Excel mencakup seluruh isi form, tidak hanya kolom tabel, termasuk:
    - kategori
    - pertemuan ke
    - tanggal
    - jam
    - tempat
    - nama karyawan
    - NIK
    - departemen
    - jabatan
    - rank
    - isi section A
    - isi section B
    - isi section C
  - jika filter tanggal kosong, export akan mengambil seluruh data yang tersedia

#### Halaman Surat Peringatan

- Menyediakan form input surat peringatan.
- Isi form harus sama dengan `Data Record Warning Letter`.
- Perlu fungsi print dengan format yang sama dengan form surat peringatan.
- Implementasi awal yang sudah dibuat:
  - halaman `Data Surat Peringatan` di bawah menu `Data Karyawan`
  - halaman ini sekarang menampung 2 kategori dokumen disipliner:
    - `Surat Peringatan`
    - `Surat Teguran`
  - tombol input dibuat menjadi dropdown `Tambah Input Form` dengan pilihan:
    - `Form Surat Peringatan`
    - `Surat Teguran`
  - struktur input:
    - `Nama` dari `Master Karyawan`
    - `NIK` autofill dari `Employee No`
    - `Surat Peringatan ke` dengan pilihan `1`, `2`, `3`
    - `Nomor Surat` dengan batas maksimal 25 karakter
    - `Tanggal Surat Peringatan`
    - `Pelanggaran`
    - `Pasal PKB` dari `Master Dok PKB`
    - `Isi Pasal` autofill dari master dokumen
    - `Superior` hanya menampilkan karyawan dengan `Job Level = Department Manager`
  - struktur input `Surat Teguran`:
    - `Nama` dari `Master Karyawan`
    - `NIK` autofill dari `Employee No`
    - `Departement` autofill dari master karyawan
    - `Jabatan` autofill dari master karyawan
    - `Nomor Surat` maksimal 25 karakter
    - `Tanggal`
    - `Pelanggaran`
    - `Superior` hanya menampilkan karyawan dengan `Job Level = Department Manager`
  - halaman detail dengan tombol `Print A4`
  - layout print A4 mengikuti `sample Warning Letter.pdf` dengan pendekatan overlay data di atas template visual PDF
  - layout print A4 `Surat Teguran` mengikuti dokumen `Surat Teguran.pdf` dengan komposisi manual A4 berbasis struktur PDF
  - nama superior dan nama karyawan tampil pada area tanda tangan di hasil print
  - form input/edit memiliki rule eskalasi otomatis berdasarkan surat peringatan aktif 6 bulan:
    - jika masih ada `Surat Peringatan ke 1` yang aktif, form otomatis mengarahkan ke `Surat Peringatan ke 2` dan menonaktifkan pilihan level sebelumnya
    - pada kondisi `Surat Peringatan ke 1` masih aktif, user tetap boleh langsung memilih `Surat Peringatan ke 3`
    - jika masih ada `Surat Peringatan ke 2` yang aktif, form otomatis mengarahkan ke `Surat Peringatan ke 3`
    - jika karyawan sebelumnya langsung mendapat `Surat Peringatan ke 2`, maka surat aktif berikutnya tetap diarahkan ke `Surat Peringatan ke 3`
  - form input/edit menampilkan notifikasi peringatan jika karyawan yang dipilih masih memiliki surat peringatan aktif yang belum melewati 6 bulan
  - halaman daftar sudah mendukung seleksi data satu per satu dan `pilih semua` untuk `Print A4` terpilih
  - halaman daftar sudah memiliki fitur `Export Excel`
  - file export Excel mencakup seluruh isi form surat peringatan, termasuk:
    - nama
    - NIK
    - surat peringatan ke
    - nomor surat
    - tanggal surat peringatan
    - pelanggaran
    - pasal PKB
    - isi pasal
    - superior
  - jika filter tanggal kosong, export akan mengambil seluruh data yang tersedia

### 3. Pengajuan Cuti Karyawan

Modul ini digunakan agar karyawan dapat mengajukan cuti melalui aplikasi.

- Data input harus mengikuti form `QSHE Cuti & Ijin`.
- Approval harus mengikuti route berdasarkan department, grup shift, dan jabatan.

Aturan approval yang sudah disebutkan:

- Pengajuan cuti masuk ke atasan pada department dan grup shift masing-masing.
- Jika karyawan tidak memiliki jabatan approval, pengajuan masuk ke Foreman pada department dan grup terkait.
- Jika pengaju adalah Foreman, approval masuk ke General Foreman pada department terkait.
- Approval lanjutan mengikuti flow approval route perusahaan.

### 4. Modul Dokumen

#### Daftar Lisensi Unit & Kargo

- Menyediakan daftar data lisensi unit dan kargo.
- Struktur isian mengikuti form QSHE untuk unit equipment yang disertifikasi.
- Contoh unit:
  - Cargo Lift
  - Omni Lift
  - Forklift
  - Genset

#### Daftar Lisensi SDM

- Menyediakan daftar lisensi dan sertifikasi yang dimiliki karyawan.
- Contoh:
  - SIO
  - Lisensi K3
- Format mengikuti form QSHE.

## Prioritas Implementasi Saat Ini

Prioritas fase awal:

1. Menyiapkan konteks proyek dan keputusan dasar.
2. Menyiapkan struktur menu `Data Master`.
3. Menyiapkan schema Prisma dan PostgreSQL untuk master data awal.
4. Membangun halaman CRUD awal untuk:
   - Master Work Location
   - Master Department
   - Master Job Role
   - Master Job Level

## Progress Implementasi Saat Ini

Yang sudah selesai:

- Setup environment PostgreSQL development via Docker Compose.
- Setup Prisma schema untuk:
  - `WorkLocation`
  - `Department`
  - `JobRole`
  - `JobLevel`
- Menjalankan migration awal Prisma untuk master data.
- Menambahkan backend API CRUD generik untuk master data.
- Menambahkan struktur menu:
  - `Data Master`
  - `Master Data Karyawan`
  - `Master Work Location`
  - `Master Department`
  - `Master Job Role`
  - `Master Job Level`
- Menambahkan halaman CRUD frontend awal untuk 4 master data tersebut.
- Menambahkan schema, API, route, menu, dan halaman `Master Karyawan` berdasarkan file Excel sumber.
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman `Master Admin` dengan field `Nama`, `NIK`, `Password`, dan `Role`.
- Menambahkan fitur login aplikasi menggunakan kredensial `Master Admin` (`NIK` + `Password`).
- Menambahkan halaman login, proteksi route frontend, dan logout dari header aplikasi.
- Menambahkan template Excel bulk import `Master Karyawan`.
- Menambahkan fitur upload/import Excel `Master Karyawan` beserta file error report per baris.
- Menambahkan fitur `Export Excel` pada halaman `Master Karyawan`.
- Menambahkan kolom filter pencarian no-case sensitive pada seluruh halaman `Data Master`, termasuk `Master Karyawan`.
- Menambahkan schema, migration, API CRUD, menu, route, halaman tabel, dan form input untuk `Bimbingan & Pengarahan`.
- Menambahkan halaman detail dan print `Formulir Catatan Bimbingan Karyawan` dengan pendekatan overlay data di atas template PDF resmi.
- Menambahkan kategori `Bimbingan` dan `Pengarahan` pada modul `Bimbingan & Pengarahan`, beserta form input dan template print A4 untuk `Formulir Catatan Pengarahan Karyawan`.
- Menambahkan schema, migration, API CRUD, route, menu, halaman tabel, form input/edit, halaman detail, dan print A4 untuk modul `Data Surat Peringatan`.
- Verifikasi `lint`, `build`, dan smoke test API ke database berhasil.

## Struktur Teknis Awal yang Sudah Dibangun

- Frontend:
  - React + Vite + Material UI
  - Routing halaman master data
  - Komponen reusable untuk:
    - form dialog master data
    - delete confirmation
    - tabel master data
- Backend:
  - Express API
  - Prisma Client
  - Route CRUD generik `/api/master/:resource`
- Database:
  - Docker Compose service PostgreSQL
  - Prisma migration awal

## Catatan Penting

- Template proyek yang tersedia saat ini sudah cocok dijadikan fondasi aplikasi admin/internal.
- Detail final field, format print, dan approval matrix untuk modul bisnis lanjutan masih perlu dipastikan dari form atau dokumen resmi perusahaan.
- File ini adalah dokumen konteks proyek dan harus diperbarui seiring perkembangan implementasi.

## Aturan Pemeliharaan Dokumen Ini

- Dokumen ini menjadi referensi konteks utama selama pengembangan.
- Jika ada perubahan scope, struktur menu, keputusan teknis, atau modul baru, isi file ini harus diperbarui.
- Jika ada keputusan yang menggantikan keputusan lama, isi file ini harus disesuaikan agar tetap menjadi sumber konteks yang paling mutakhir.
