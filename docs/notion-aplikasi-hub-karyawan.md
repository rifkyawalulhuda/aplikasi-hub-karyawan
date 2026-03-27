# Aplikasi Hub Karyawan

Dokumentasi internal untuk onboarding teknis, operasional server, dan pemahaman relasi data pada project `Aplikasi Hub Karyawan`.

## Ringkasan

Project ini adalah aplikasi internal untuk pengelolaan data karyawan, master data, dokumen, sertifikasi, dan pengajuan cuti.

### Cakupan dokumentasi

- Setup development server
- Setup production server
- Flow pengajuan cuti
- Relasi data master
- Format data master yang wajib linked
- Ringkasan modul dan endpoint penting

### Referensi utama di repo

- `context-project.md`
- `leave_approval_workflow.md`
- `deploy-cloudflare-tunnel.md`
- `app-karyawan/package.json`
- `app-karyawan/prisma/schema.prisma`

---

## 1. Setup Development Server

### 1.1 Prasyarat

- Node.js dan npm
- PostgreSQL
- Docker Desktop jika ingin memakai database via container
- Prisma CLI

### 1.2 Hub detail setup dev

Di Notion, halaman setup development juga dipecah menjadi beberapa subpage kecil:

- `Setup Development Server - Detail`
- `Prasyarat`
- `Setup Environment`
- `Jalankan Development`
- `Script Tersedia`
- `Verifikasi Awal`

### 1.3 Struktur project aktif

- Folder aktif: `app-karyawan`
- Folder `complete-template` hanya referensi template bawaan

### 1.4 Opsi database development

#### Opsi A: PostgreSQL via Docker Compose

Konfigurasi container:

- Service: `postgres`
- Container name: `app-karyawan-postgres`
- Port host: `5434`
- Database: `hub_karyawan`

Perintah:

```bash
cd app-karyawan
npm run db:up
```

Contoh `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
```

#### Opsi B: PostgreSQL lokal

Jika database lokal yang dipakai, pastikan:

- service PostgreSQL aktif
- user dan password sesuai di `.env`
- database `hub_karyawan` sudah dibuat

### 1.5 Setup environment

File utama:

- `app-karyawan/.env`

Sumber template:

- `app-karyawan/.env.example`

Variabel penting:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hub_karyawan?schema=public"
PORT=4000
VITE_API_BASE_URL="/api"
EMPLOYEE_AUTH_SECRET="dev-employee-auth-secret"
APP_BASE_URL="https://pwa.aplikasi-hub.my.id"
CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id,https://admin.aplikasi-hub.my.id,https://app.aplikasi-hub.my.id"
```

Jika email dan push notification dipakai:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
SMTP_FROM_NAME="Workflow Pengajuan Cuti"
PUSH_VAPID_PUBLIC_KEY=""
PUSH_VAPID_PRIVATE_KEY=""
PUSH_VAPID_SUBJECT="mailto:admin@sankyu.co.id"
```

### 1.6 Langkah menjalankan development

#### Setup awal

```bash
cd app-karyawan
npm install
npx prisma generate
npx prisma db push
```

#### Jalankan frontend + backend sekaligus

```bash
npm run dev:full
```

#### Jalankan dengan host agar bisa diakses jaringan lokal / Cloudflare tunnel

```bash
npm run dev:full:host
```

### 1.7 Script yang tersedia

- `npm run dev` -> frontend Vite
- `npm run dev:host` -> frontend Vite dengan host
- `npm run dev:server` -> backend Express via nodemon
- `npm run dev:full` -> frontend + backend
- `npm run dev:full:host` -> frontend host + backend
- `npm run build` -> build production frontend
- `npm run server` -> jalankan backend sekali jalan
- `npm run prisma:migrate` -> migration Prisma
- `npm run prisma:studio` -> Prisma Studio

### 1.8 Verifikasi awal

- Buka frontend di `http://localhost:5173`
- Cek API health di `http://localhost:4000/api/health`
- Pastikan login admin dan login PWA karyawan berjalan

---

## 2. Setup Production Server

### 2.1 Arsitektur produksi yang dipakai

Project ini memakai model full lokal + Cloudflare Tunnel:

- frontend admin/PWA tetap jalan di server lokal
- backend API tetap jalan di server lokal
- domain publik diarahkan via Cloudflare Tunnel

Domain yang dipakai:

- `https://aplikasi-hub.my.id`
- `https://www.aplikasi-hub.my.id`
- `https://api.aplikasi-hub.my.id`
- `https://pwa.aplikasi-hub.my.id`

### 2.1 Hub detail setup production

Di Notion, halaman setup production juga dipecah menjadi beberapa subpage kecil:

- `Setup Production Server - Detail`
- `Arsitektur Produksi`
- `Environment Produksi`
- `Cloudflare Tunnel`
- `Stabilitas Server`
- `Verifikasi Production`

### 2.2 Environment produksi

Frontend produksi:

```env
VITE_API_BASE_URL=https://api.aplikasi-hub.my.id/api
```

Backend produksi:

```env
APP_BASE_URL=https://aplikasi-hub.my.id
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id,https://admin.aplikasi-hub.my.id,https://app.aplikasi-hub.my.id
```

### 2.3 Jalankan service lokal

```bash
cd app-karyawan
npm run dev:full:host
```

### 2.4 Cloudflare Tunnel

Login dan buat tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create hub-karyawan
```

Route DNS:

```bash
cloudflared tunnel route dns hub-karyawan aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan www.aplikasi-hub.my.id
cloudflared tunnel route dns hub-karyawan api.aplikasi-hub.my.id
```

Contoh konfigurasi tunnel:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<USER>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: aplikasi-hub.my.id
    service: http://127.0.0.1:5173
  - hostname: www.aplikasi-hub.my.id
    service: http://127.0.0.1:5173
  - hostname: api.aplikasi-hub.my.id
    service: http://127.0.0.1:4000
  - service: http_status:404
```

Jalankan tunnel:

```bash
cloudflared tunnel --config <PATH_KE_YAML> run
```

### 2.5 Catatan operasional produksi

- Akses publik hanya aktif jika:
  - frontend lokal hidup
  - backend lokal hidup
  - `cloudflared tunnel` berjalan
- Pastikan DNS mengarah ke tunnel, bukan ke Pages
- Jika muncul `Origin DNS error (1016)`, biasanya masih ada record lama yang salah

### 2.6 Tips menjaga server tetap stabil

- Gunakan process manager seperti PM2, NSSM, atau Task Scheduler
- Pastikan port `4000` dan `5173` tidak bentrok
- Server backend sudah punya guard `EADDRINUSE` agar tidak crash berulang saat port sedang dipakai

---

## 3. Flow Pengajuan Cuti

### 3.1 Tujuan flow

Pengajuan cuti dipakai untuk membuat request cuti dari karyawan, lalu diproses oleh approval berjenjang berdasarkan:

- department
- group shift
- job level

### 3.2 Hub detail flow cuti

Di Notion, flow cuti sudah dipecah menjadi hub detail terpisah agar lebih mudah dibaca:

- `Flow Pengajuan Cuti - Detail`
- `Tahapan Approval`
- `Validasi & Rule Pengajuan`
- `Print Cuti Approved`
- `Resubmit & Status`

### 3.3 Status pengajuan

- `SUBMITTED`
- `IN_APPROVAL`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

### 3.4 Status approval per tahap

- `WAITING`
- `PENDING`
- `APPROVED`
- `REJECTED`
- `LOCKED`
- `CANCELLED`

### 3.5 Aturan validasi utama

- Saldo cuti harus cukup
- Minimal 1 replacement employee
- Maksimal 4 replacement employee
- Tanggal cuti tidak boleh overlap dengan request aktif atau approved
- Alamat selama cuti wajib diisi
- Alasan cuti wajib diisi

### 3.6 Urutan approval

Urutan tahapan normal:

1. Foreman
2. General Foreman
3. Section Chief
4. Dy. Dept. Manager
5. Dept. Manager
6. Site/Div. Manager

Jika pengaju punya `Group Shift`, maka tahap awal bisa dimulai dari:

- `Foreman Group Shift`

### 3.7 Logika pemilihan approver

- Approval dimulai dari satu tingkat di atas jabatan pengaju
- Sistem mencari approver di department yang sama
- Jika level tertentu kosong, tahap itu dilewati
- Jika tidak ada approver sama sekali, request ditolak oleh sistem
- Jika requestor punya `Group Shift`, approver foreman diambil dari assignment group shift tersebut
- Jika tidak punya `Group Shift`, approver foreman diambil dari foreman department yang belum ter-assign ke group shift
- Jika approver aktif tidak ada, approval lanjut ke job level berikutnya yang tersedia
- Tahap `Foreman Group Shift` dan `Foreman` tidak boleh dobel untuk approver yang sama

### 3.8 Resubmit

Jika request ditolak, karyawan dapat melakukan resubmit:

- revisi dimulai dari awal
- `revisionNo` bertambah

### 3.9 Print form approved

Request cuti dengan status `APPROVED` dapat dicetak ke format A4 dari:

- admin flow cuti
- halaman detail cuti di PWA

Route print:

- `/print/data-karyawan/cuti-karyawan/:id`
- `/karyawan/cuti/:id/print`

Field utama yang muncul di print:

- site/div
- department
- tanggal pengajuan
- nama
- NIK
- jenis cuti
- jumlah hari cuti
- periode cuti
- alamat selama cuti
- alasan cuti
- pengganti selama cuti
- sisa cuti
- approval bawah

---

## 4. Relasi Data Master

Bagian ini menjelaskan data master yang saling terhubung supaya dropdown, import Excel, relasi Prisma, dan filter UI tetap konsisten.

### 4.1 Master karyawan

Entitas utama:

- `Employee`

Relasi wajib:

- `departmentId` -> `Department`
- `groupShiftId` -> `MasterGroupShift` optional
- `workLocationId` -> `WorkLocation`
- `jobRoleId` -> `JobRole`
- `jobLevelId` -> `JobLevel`

Field penting:

- `employeeNo`
- `password`
- `fullName`
- `employmentType`
- `siteDiv`
- `birthDate`
- `gender`
- `educationLevel`
- `grade`
- `joinDate`
- `phoneNumber`
- `email`

### 4.2 Master data karyawan

- `WorkLocation`
- `Department`
- `JobRole`
- `JobLevel`
- `MasterGroupShift`

### 4.3 Master group shift

- `MasterGroupShift` punya banyak `GroupShiftForeman`
- `GroupShiftForeman` menghubungkan group shift dan employee yang bertugas sebagai foreman
- Hanya employee dengan `Job Level = Foreman` yang relevan sebagai pilihan assign

### 4.4 Data cuti

Relasi utama:

- `EmployeeLeave.employeeId` -> `Employee`
- `EmployeeLeave.masterCutiKaryawanId` -> `MasterCutiKaryawan`
- `EmployeeLeave.replacementEmployeeId` -> `Employee` optional
- `EmployeeLeaveApproval.approverEmployeeId` -> `Employee`
- `EmployeeLeaveDatabase.employeeId` -> `Employee`
- `EmployeeLeaveDatabase.masterCutiKaryawanId` -> `MasterCutiKaryawan`

### 4.5 Bimbingan, pengarahan, dan surat peringatan

- `GuidanceRecord.employeeId` -> `Employee`
- `WarningLetter.employeeId` -> `Employee`
- `WarningLetter.superiorEmployeeId` -> `Employee`
- `WarningLetter.masterDokPkbId` -> `MasterDokPkb` optional

### 4.6 Lisensi dan sertifikasi

#### Karyawan

- `EmployeeLicenseCertification.employeeId` -> `Employee`
- `EmployeeLicenseCertification.masterDokKaryawanId` -> `MasterDokKaryawan`

#### Unit

- `UnitLicenseCertification.masterUnitId` -> `MasterUnit`
- `UnitLicenseCertification.vendorId` -> `MasterVendor`

### 4.7 Hari libur

- `MasterHoliday` dipakai untuk kalkulasi hari kerja dan jumlah hari cuti
- Data hari libur dikelola internal oleh admin, bukan dari API eksternal

---

## 5. Format Data Master yang Wajib Linked

Bagian ini penting agar import Excel, dropdown, dan relasi antar modul tidak putus.

### 5.1 Aturan umum

- Gunakan master sebelum input data turunan
- Jangan isi nama master secara bebas jika field tersebut memang relasi
- Jika ada data untuk dropdown, pastikan master sumbernya sudah dibuat dulu
- Hindari perbedaan penulisan antara label UI, template Excel, dan isi database

### 5.2 Urutan master yang sebaiknya diisi dulu

1. `WorkLocation`
2. `Department`
3. `JobRole`
4. `JobLevel`
5. `MasterGroupShift`
6. `MasterDokKaryawan`
7. `MasterDokPkb`
8. `MasterCutiKaryawan`
9. `MasterUnit`
10. `MasterVendor`
11. `MasterHoliday`
12. `Employee`

### 5.3 Field yang wajib konsisten

#### Employee

- `Employee No` harus unik
- `Department` harus cocok dengan `Master Department`
- `Work Location` harus cocok dengan `Master Work Location`
- `Job Role` harus cocok dengan `Master Job Role`
- `Job Level` harus cocok dengan `Master Job Level`
- `Group Shift` harus cocok dengan `Master Group Shift` jika dipakai

#### Data cuti

- `Nama Karyawan` harus mengarah ke `Employee`
- `NIK` di template harus mengikuti `Employee No`
- `Jenis Cuti` harus berasal dari `Master Cuti Karyawan`

#### Lisensi karyawan

- `Nama` harus mengarah ke `Employee`
- `Dokumen` harus mengarah ke `Master Dok Karyawan`
- `Diterbitkan` mengikuti issuer snapshot dari master dokumen

#### Lisensi unit

- `Nama Unit` harus mengarah ke `Master Unit`
- `Vendor Pengurus` harus mengarah ke `Master Vendor`

### 5.4 Prinsip yang perlu dijaga saat import

- Template import harus dinamis mengikuti data master terbaru
- Dropdown import tidak boleh diisi manual jika sumbernya master relasi
- Jika master berubah nama, data turunan yang menyimpan snapshot perlu dicek ulang

### 5.5 Snapshot vs relasi live

Beberapa field disimpan sebagai snapshot teks untuk kebutuhan dokumen/print:

- `issuerSnapshot` pada lisensi karyawan
- `departmentName` pada warning letter
- `jobLevelName` pada warning letter
- `articleLabel` dan `articleContent` pada warning letter

Snapshot dipakai supaya dokumen historis tetap konsisten meskipun data master berubah.

---

## 6. Ringkasan Modul & Endpoint Penting

### 6.1 Endpoint health

- `GET /api/health`

### 6.2 Auth admin

- `POST /api/auth/*`
- `POST /api/master/admins/*`

### 6.3 Portal karyawan

- `POST /api/employee-auth/login`
- `GET /api/employee-me/dashboard`
- `GET /api/employee-me/profile`
- `GET /api/employee-me/guidance-records`
- `GET /api/employee-me/warning-letters`
- `GET /api/employee-me/notifications`
- `POST /api/employee-me/notifications/read`
- `POST /api/employee-me/notifications/read-all`

### 6.4 Master data

- `GET/POST/PUT/DELETE /api/master/:resource`
- `Master Karyawan`
- `Master Admin`
- `Master Group Shift`
- `Master Dok Karyawan`
- `Master Dok PKB`
- `Master Cuti Karyawan`
- `Master Hari Libur`
- `Master Unit`
- `Master Vendor`

### 6.5 Data karyawan

- `Bimbingan & Pengarahan`
- `Data Surat Peringatan`
- `Detail Karyawan`
- `Lisensi & Sertifikasi`
- `Cuti Karyawan`

### 6.5.1 Pecahan modul data karyawan

Di Notion, dua modul ini juga dipecah menjadi subpage detail per fitur:

- `Bimbingan & Pengarahan`
  - `Daftar & Filter`
  - `Form Input & Field`
  - `Print A4`
  - `Export Excel`
- `Data Surat Peringatan`
  - `Daftar & Filter`
  - `Form & Eskalasi`
  - `Print A4`
  - `Export Excel`

### 6.6 Data unit

- `Lisensi & Sertifikasi Unit`

### 6.7 Hub detail endpoint

Bagian endpoint juga dipecah ke subpage yang lebih spesifik di Notion:

- `API Health & Core`
- `Auth & Session`
- `Master Data API`
- `Portal Karyawan API`
- `Data Karyawan & Unit API`
- `Notification, Email & Print API`

---

## 7. Detail Master Data

Bagian master data sudah dipecah ke hub tersendiri di Notion agar tiap modul punya referensi yang lebih spesifik.

### Subpage master data

- `Detail Master Data`
- `Master Karyawan`
- `Master Group Shift`
- `Master Dokumen`
- `Master Cuti & Hari Libur`
- `Master Unit & Vendor`

### Tujuan pemecahan

- Memudahkan onboarding admin atau developer baru
- Memisahkan aturan per modul supaya lebih mudah dipelihara
- Mengurangi risiko informasi master data bercampur dengan flow cuti atau server setup

---

## 8. Catatan Implementasi Penting

- Folder aktif pengembangan adalah `app-karyawan`
- `complete-template` hanya referensi
- Login admin memakai data `Master Admin`
- Login PWA karyawan memakai `Employee No` dan password employee
- Session admin dan session karyawan disimpan terpisah
- Server backend punya guard saat port `4000` sudah dipakai
- PWA karyawan memakai route khusus dan dapat di-install sebagai app
- Notifikasi admin dan karyawan dihitung dari data existing, bukan tabel notifikasi terpisah
- Data cuti utama admin-only memakai satu row per kombinasi `Karyawan + Jenis Cuti + Tahun`

---

## 9. Referensi Struktur Teknis

### Frontend

- React
- Vite
- Material UI
- React Router
- PWA

### Backend

- Express
- Prisma
- PostgreSQL
- CORS

### Integrasi tambahan

- Cloudflare Tunnel
- Email workflow
- Push notification
- Excel import/export
