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
- Standar desain UI global untuk seluruh project sekarang wajib mengacu pada referensi `MCP Material UI` yang disimpan di file `docs/llm-mui.md`.
- Seluruh komponen, halaman, form, dialog, tabel, navigasi, dan elemen UI baru maupun revisi UI existing harus mengikuti pola, struktur, dan best practice Material UI dari referensi tersebut.
- Jika ada keputusan desain UI yang lebih spesifik di level fitur, keputusan tersebut tetap harus berada dalam koridor template dan guideline `docs/llm-mui.md`.
- Area `Portal Mobile Karyawan` dibangun di project yang sama dengan prefix route `/karyawan`.
- Area `Portal Mobile Karyawan` ditujukan mobile-first dan diaktifkan sebagai PWA installable.
- Area `Portal Mobile Karyawan` sekarang memiliki theme provider tersendiri yang terpisah dari theme admin desktop, sehingga preferensi dark mode hanya berlaku di route `/karyawan` dan turunannya.
- Area admin desktop juga sekarang punya theme mode light/dark berbasis Material UI theme system, dengan toggle cepat di header admin dan preferensi yang disimpan di `localStorage` pada key `hub-karyawan-admin-theme-config`.
- Halaman admin seperti `Record Notifikasi Admin` dan tabel shared desktop sekarang mengikuti tema admin aktif, termasuk dark mode, tanpa mempengaruhi area `/karyawan`.
- Area admin desktop dan area mobile karyawan menggunakan auth context dan route guard yang terpisah agar session tidak saling bentrok.
- PWA mobile sekarang memiliki domain khusus `pwa.aplikasi-hub.my.id` yang dilayani melalui Cloudflare Tunnel, bukan Cloudflare Pages.
- Mobile PWA juga disiapkan agar bisa dideploy ke Vercel pada domain khusus seperti `pwa-karyawan.vercel.app` tanpa memecah project frontend menjadi aplikasi baru.
- Hostname `*.vercel.app` untuk deployment project ini diperlakukan sebagai host khusus PWA, sehingga akses root/non-`/karyawan` akan diarahkan ke `/karyawan/login` dan area admin desktop tidak dipakai pada domain tersebut.
- Preferensi `Tema Gelap` untuk PWA Karyawan disimpan di `localStorage` browser dengan mode `light/dark`, dan diakses lewat toggle cepat di header mobile serta switch bertanda `Tema Gelap` pada halaman Profil.
- Login PWA mobile menampilkan tombol `Install App` dengan fallback instruksi manual jika `beforeinstallprompt` belum tersedia di browser.
- Halaman login PWA Karyawan sekarang memakai hero header yang lebih minimalis, tanpa logo gambar terpisah, dengan tipografi `SANKYU` dan `Portal Karyawan` yang di-center agar tampil lebih modern dan ringkas.
- Modul `Data Surat Peringatan` sekarang mendukung 3 kategori dokumen disipliner dalam satu modul yang sama:
  - `Surat Peringatan`
  - `Skorsing`
  - `Surat Teguran`
- Print A4 `Surat Peringatan 1/2/3` dan `Skorsing` sekarang memakai satu basis template bersama yang mengikuti form `SII-QSHE-085-01 Surat Peringatan-Skorsing`, dengan perbedaan checkbox dan narasi keputusan dipetakan dari kategori dokumen.
- Rule eskalasi aktif untuk `Surat Peringatan` sekarang mengikuti rule final:
  - jika tidak ada `Surat Peringatan` aktif, admin boleh memilih `SP1`, `SP2`, atau `SP3`
  - jika masih ada `SP1` aktif, form default ke `SP2`, menonaktifkan `SP1`, dan tetap mengizinkan `SP3`
  - jika masih ada `SP2` aktif, form hanya mengizinkan `SP3`
  - jika masih ada `SP3` aktif, pembuatan `Surat Peringatan` baru diblokir sampai masa SP selesai
  - rule ini hanya berlaku untuk kategori `Surat Peringatan`, bukan `Skorsing` atau `Surat Teguran`
  - acuan masa aktif memakai 6 bulan sejak tanggal surat, kecuali jika nanti tersedia field tanggal akhir eksplisit sebagai source of truth
- Manifest PWA sekarang memakai ikon PNG standar `pwa/icon-192.png` dan `pwa/icon-512.png`; SVG tidak lagi dipakai sebagai ikon utama agar kompatibilitas install lebih stabil.
- Standar global `table list` desktop sekarang mengikuti pola halaman `Bimbingan & Pengarahan`, kecuali halaman `Detail Karyawan`.
- Frontend testing sekarang tersedia melalui `Vitest` dengan environment `jsdom`, global test helpers, dan setup `@testing-library/jest-dom`.

### Standar Global Table List Desktop

- Berlaku untuk halaman daftar data desktop yang memakai komponen tabel bersama maupun halaman list custom yang sudah diselaraskan.
- Halaman `Detail Karyawan` dikecualikan dan tetap memakai pola tabel/ringkasan khususnya sendiri.
- Library standar untuk tabel list desktop adalah `MUI X Data Grid`, mengikuti pola implementasi pada halaman `Bimbingan & Pengarahan`.
- Tampilan tabel list desktop sekarang memakai gaya spreadsheet ringan:
  - header abu muda
  - garis pemisah vertikal antar kolom
  - hover state lembut per baris
  - pagination standar `15 / 30 / 50 / 100`
- Aksi row seperti `Detail`, `Edit`, `Hapus`, dan `Print A4` dipindahkan dari kolom `AKSI` ke menu `klik kanan` pada baris data.
- Jika halaman membutuhkan bulk action, selection memakai `checkboxSelection` bawaan `Data Grid`, bukan checkbox manual pada tabel HTML biasa.
- Resize antar kolom diaktifkan sebagai perilaku standar pada tabel list desktop melalui drag di sisi kanan header kolom.
- Lebar kolom tabel list yang memakai `columnResizeKey` disimpan ke `localStorage` browser agar konsisten saat halaman dibuka ulang.
- Komponen acuan global untuk perilaku ini adalah shared `EnhancedTable` yang sekarang menjadi wrapper `MUI X Data Grid`, sedangkan halaman `Bimbingan & Pengarahan` tetap menjadi referensi visual utama.

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
- Workflow dev sekarang punya helper aman untuk Prisma generate dan stop backend saja:
  - `npm run prisma:generate:safe`
  - `npm run dev:server:stop`
  - `npm run dev:server:status`
- Panduan lengkap workflow dev disimpan di [`docs/dev-workflow.md`](D:/Github/aplikasi-hub-karyawan/docs/dev-workflow.md).
- Ditambahkan auth flow khusus admin dan karyawan berbasis bearer token ringan. Admin memakai `ADMIN_AUTH_SECRET`, karyawan memakai `EMPLOYEE_AUTH_SECRET`, dan keduanya wajib diisi pada production.
- Password admin dan karyawan tidak dikirim balik ke frontend, password baru disimpan sebagai hash `scrypt`, dan login lama berbasis plaintext dimigrasikan otomatis saat kredensial valid dipakai login.
- Untuk database existing, jalankan `npm run security:hash-passwords` dari `app-karyawan` agar seluruh password plaintext lama langsung dikonversi menjadi hash.
- Login `Portal Mobile Karyawan` menggunakan `Employee No` sebagai NIK dan `password` dari tabel `employees`.
- API self-service karyawan menggunakan endpoint khusus `/api/employee-me/*` dan seluruh data selalu difilter berdasarkan employee yang sedang login.
- Fitur self-service `Ubah Password` untuk PWA Karyawan tersedia dari halaman `/karyawan/profil` dan diproses melalui endpoint `POST /api/employee-me/change-password`.
- Endpoint `GET /api/employee-me/training-records` dan `GET /api/employee-me/training-records/:id` menampilkan riwayat pelatihan milik employee login saja, berdasarkan partisipasi employee pada data training.
- Endpoint `GET /api/employee-me/dashboard` sekarang juga mengembalikan ringkasan `activeLeaveProcess` untuk kebutuhan kartu `Quick Status` di beranda PWA, dengan prioritas menampilkan approval cuti yang sedang menunggu tindakan approver login, atau pengajuan cuti aktif milik requester bila masih dalam proses.
- Deploy publik saat ini memakai arsitektur full lokal + Cloudflare Tunnel:
  - frontend admin/PWA tetap berjalan di server lokal
  - backend API tetap berjalan di server lokal
  - domain publik `aplikasi-hub.my.id`, `www.aplikasi-hub.my.id`, `pwa.aplikasi-hub.my.id`, dan `api.aplikasi-hub.my.id` diarahkan melalui tunnel, bukan Cloudflare Pages atau Netlify
- Arsitektur hybrid deploy yang sekarang didukung:
  - admin desktop tetap berjalan dari frontend lokal / tunnel
  - backend API tetap berjalan lokal dan dipublikasikan lewat Cloudflare Tunnel `hub-karyawan-api`
  - Mobile PWA dapat dideploy terpisah ke Vercel dengan root directory `app-karyawan`
  - build Mobile PWA di Vercel tetap memakai `VITE_API_BASE_URL=https://api.aplikasi-hub.my.id/api`
- CORS backend harus mengizinkan origin Cloudflare dan origin Vercel untuk Mobile PWA, termasuk pola `https://pwa-karyawan*.vercel.app` agar alias production dan deployment alias tetap bisa mengakses API publik.
- Link email approval cuti dan payload push notification untuk portal karyawan harus memakai base URL khusus `EMPLOYEE_PWA_BASE_URL`, yang sekarang diarahkan ke `https://pwa-karyawan.vercel.app`.
- `APP_BASE_URL` dipakai untuk domain publik utama `https://aplikasi-hub.my.id`.
- `VITE_API_BASE_URL` untuk build publik mengarah ke `https://api.aplikasi-hub.my.id/api`.
- `Data Cuti Karyawan` sekarang diperlakukan sebagai saldo utama admin-only dengan satu row per kombinasi `Karyawan + Jenis Cuti + Tahun`.
- Final approval cuti dari PWA tidak lagi menambah row baru pada `Data Cuti Karyawan`; sistem hanya mengurangi `Sisa Cuti` pada row utama yang sesuai.
- Riwayat approval cuti dan perubahan admin/import untuk `Data Cuti Karyawan` ditampilkan melalui aksi `Detail`, bukan dengan menduplikasi row pada grid utama.
- Header admin sekarang memiliki tombol notifikasi `live alert` tanpa tabel notifikasi tersendiri di database.
- Notifikasi header dihitung langsung dari data existing untuk:
  - lisensi & sertifikasi karyawan `Akan Expired` dan `Expired`
  - lisensi & sertifikasi unit `Akan Expired` dan `Expired`
  - flow cuti aktif terlalu lama
  - cuti `Rejected`
  - email workflow cuti yang gagal terkirim
- Status notifikasi admin sekarang disimpan per admin sebagai `baca / belum baca`.
- Riwayat notifikasi admin sekarang memiliki snapshot record persisten pada tabel `admin_notification_records`, sehingga halaman record/inbox admin tetap bisa menampilkan histori notifikasi walau alert live sudah tidak aktif.
- Badge lonceng sekarang menampilkan jumlah notifikasi `belum dibaca`, bukan jumlah total alert.
- Endpoint admin `GET /api/notifications/history` tersedia untuk kebutuhan halaman record notifikasi dengan dukungan filter status baca, status aktif, kategori, keyword, dan pagination ringan.
- Kegagalan email workflow cuti sekarang dicatat persisten pada tabel `email_workflow_failure_logs`, dengan error message yang disanitasi agar tidak menyimpan secret/token/password.
- Log gagal email workflow cuti juga disinkronkan ke notifikasi admin live/history yang sudah ada, sehingga badge dan history tetap konsisten dengan status terbaru.
- Endpoint admin `GET /api/admin/email-workflow-failures`, `GET /api/admin/email-workflow-failures/:id`, dan `POST /api/admin/email-workflow-failures/:id/resolve` tersedia untuk list, detail, dan resolve log gagal kirim email workflow cuti.
- Notifikasi workflow cuti sekarang juga dikirim melalui **WhatsApp** via Fonnte API, selain email dan push notification.
- WhatsApp notification dikirim pada event:
  - `Cuti submitted` → ke requester (konfirmasi pengajuan berhasil)
  - `Stage activation` → ke approver (notifikasi ada cuti yang perlu di-approve)
  - `Cuti rejected` → ke requester (notifikasi ditolak + alasan)
  - `Cuti approved` → ke requester (notifikasi disetujui + sisa cuti)
- Service WhatsApp diimplementasikan pada `server/lib/whatsappService.js` mendukung dua provider:
  - **Fonnte** (default/production): via REST API `https://api.fonnte.com/send`, env var `FONNTE_TOKEN`.
  - **WAHA self-hosted** (development): via REST API WAHA v2, env var `WAHA_URL`, `WAHA_API_KEY`, `WAHA_SESSION`.
- Provider aktif dipilih via env var `WHATSAPP_PROVIDER` (default: `fonnte`). Nilai `waha` mengaktifkan WAHA self-hosted.
- WAHA self-hosted project ini menggunakan instance `waha.ngopicode.com` (v2026.8.x, engine WEBJS, tier CORE).
- `WAHA_SESSION` harus diisi persis sama dengan nama session di WAHA dashboard (case-sensitive, contoh: `Default`).
- Nomor telepon karyawan dari database (format `08xx`) otomatis dinormalisasi ke format internasional `62xx` sebelum dikirim.
- `mapJobLevelToStageType` di `server/lib/leaveWorkflow.js` sekarang memetakan nama jabatan aktual dari database (`Deputy Department Manager`, `Department Manager`, `Division Manager`) ke enum Prisma `LeaveStageType` yang benar (`DY_DEPT_MANAGER`, `DEPT_MANAGER`, `SITE_DIV_MANAGER`). Sebelumnya hanya ada alias pendek (`Dy. Dept. Manager`, dll.) yang tidak cocok dengan nama di database sehingga menyebabkan `PrismaClientValidationError` saat pengajuan cuti.
- Kegagalan kirim WhatsApp tidak menggagalkan proses workflow cuti — hanya dicatat sebagai warning di console log (fire-and-forget).
- Request cuti `Approved` sekarang memiliki fitur `Print A4` baik dari admin maupun dari PWA karyawan.
- Dokumen print cuti menggunakan halaman HTML/CSS A4 khusus yang dikalibrasi mengikuti file referensi `Form Permohonan Cuti dan Ijin.pdf`.
- Kolom approval pada dokumen print menampilkan tanggal dan nama requester/approver sesuai grup approval yang sudah disepakati.
- Routing approval cuti foreman sekarang bersifat eksklusif:
  - jika requester punya `Group Shift`, tahap foreman hanya memakai foreman yang terdaftar pada `Master Group Shift` tersebut
  - jika requester tidak punya `Group Shift`, tahap foreman hanya memakai foreman dalam department yang sama yang tidak punya assignment pada `group_shift_foremen`
  - jika kandidat foreman pada jalur aktif tidak ada, approval langsung naik ke job level berikutnya yang tersedia di department yang sama
  - stage `Foreman Group Shift` dan `Foreman` tidak boleh muncul dobel untuk approver yang sama
- Frontend Vite development host sekarang di-whitelist untuk domain Cloudflare public agar tunnel dapat mengakses frontend lokal tanpa blok host.
- Server backend dev sekarang memiliki guard `EADDRINUSE` agar proses lama di port `4000` tidak memunculkan crash berulang saat restart dev.
- `VITE_API_BASE_URL` di `.env` dev lokal di-set ke `/api` (proxy Vite ke `http://localhost:4000`), sedangkan `.env.production` tetap diarahkan ke `https://api.aplikasi-hub.my.id/api`. Mencegah dev lokal salah memanggil backend publik saat domain Cloudflare/DB production tidak sinkron dengan akun lokal.

### Hardening Auth & Session Admin

- Verifier `Bearer` admin sekarang juga memvalidasi field `alg` dan `typ` pada header token (wajib `HS256` + `JWT`). Algorithm-confusion / `alg=none` ditolak di awal sebelum verifikasi signature.
- Setiap akun `MasterAdmin` punya kolom `tokenVersion` (`Int @default(0)`) yang ikut disertakan dalam payload token saat login.
- Middleware `requireAdminAuth` menolak token kalau `payload.tokenVersion !== admin.tokenVersion` di DB. Ini berlaku sebagai mekanisme revocation ringan tanpa menambah lookup baru.
- Endpoint `PUT /api/master/admins/:id` otomatis melakukan `tokenVersion: { increment: 1 }` setiap kali payload mengubah field `password`. Akibatnya, semua sesi admin yang aktif sebelum reset password langsung invalid.
- Untuk paksa logout massal seluruh admin (misal saat insiden keamanan), cukup jalankan: `prisma.masterAdmin.updateMany({ data: { tokenVersion: { increment: 1 } } })`.
- Auto-rehash legacy plaintext password tetap dibiarkan tidak menaikkan `tokenVersion`, karena hanya bersifat normalisasi storage dan tidak mengubah kredensial efektif.

### Sanitasi Password pada Import Bulk Karyawan

- File error report Excel hasil import bulk `Master Karyawan` sekarang me-mask kolom `Password` menjadi `***`. Cell yang aslinya kosong tetap kosong agar admin masih bisa membedakan baris yang memang belum mengisi password.
- Tujuan: mencegah residual exposure plaintext password karyawan pada file `.xlsx` yang berakhir di disk server (`ERROR_REPORT_DIR`) dan sering di-download admin.

### Security & Performance Hardening

- Ditambahkan `helmet` middleware untuk security headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, dll). CSP dinonaktifkan karena SPA.
- Ditambahkan `compression` middleware untuk gzip response — mengurangi ukuran transfer ~70%.
- Ditambahkan JSON body size limit `1mb` pada `express.json()` untuk mencegah large payload DoS.
- Ditambahkan rate limiting:
  - Login endpoints (`/api/auth`, `/api/employee-auth`): max 20 attempts per IP per 15 menit.
  - General API (`/api/*`): max 200 requests per IP per menit.
  - Pesan error rate limit dalam Bahasa Indonesia.
- Ditambahkan request timeout 30 detik per request untuk mencegah hanging connections.
- Ditambahkan PM2 ecosystem config (`ecosystem.config.cjs`) untuk production deployment:
  - Cluster mode (multi-process, memanfaatkan semua CPU core).
  - Auto-restart saat crash atau memory > 512MB.
  - Log rotation dengan timestamp.
- Health check endpoint `/api/health` sekarang mengembalikan uptime dan memory usage (RSS, heap) untuk monitoring.
- Standardisasi implementasi `toBase64Url` pada employee session agar konsisten dengan admin session (menggunakan `toString('base64url')` native).
- Untuk production, disarankan menambahkan `connection_limit=10` pada `DATABASE_URL` agar Prisma connection pool lebih besar dari default (5).
- Dependencies baru: `helmet@8.1.0`, `compression@1.8.0`, `express-rate-limit@7.5.0`.

### Skema dan Migration Terbaru

- Migration `20260519144643_add_master_admin_token_version` menambahkan kolom `tokenVersion INTEGER NOT NULL DEFAULT 0` pada tabel `master_admins`. Sifatnya additive dan aman dijalankan di production lewat `npx prisma migrate deploy`.
- Untuk deploy production, gunakan `prisma migrate deploy` (bukan `migrate dev`). Sebelum deploy disarankan tetap menjalankan backup DB lewat script di bawah.

### Skrip Backup Database

- Folder `app-karyawan/scripts/` berisi skrip backup versi `docker exec` (cocok untuk dev lokal yang Postgres-nya jalan via container `app-karyawan-postgres`):
  - `scripts/backup-db.bat` (Windows / CMD)
  - `scripts/backup-db.sh` (Linux / Bash)
- Folder `app-karyawan/scripts-exec/` berisi skrip backup versi standalone (cocok untuk server production yang `pg_dump`-nya ter-install langsung di host):
  - `scripts-exec/backup-db.bat`
  - `scripts-exec/backup-db.sh`
- Output backup: `app-karyawan/backups/hub_karyawan_YYYYMMDD_HHMMSS.sql.gz` (folder `backups/` sudah ditambahkan ke `.gitignore`).
- Default retention 30 hari, dapat di-override lewat env var `RETENTION_DAYS`.
- Konfigurasi koneksi (host/port/user/password/container) bisa di-override lewat env var (`PG_HOST`, `PG_PORT`, `PG_USER`, `PG_DATABASE`, `PGPASSWORD`, `PG_CONTAINER`).
- Untuk production Linux disarankan memakai `~/.pgpass` (chmod 600) dibanding `PGPASSWORD` env var agar password tidak terlihat via `ps -ef`.
- Auto-schedule disarankan via `cron` (Linux) atau `Task Scheduler` (Windows) jam 2 pagi.

## Struktur Navigasi yang Sudah Disepakati

- Tab navigasi utama: `Dashboard`
  - Halaman dashboard admin dengan grafik dan ringkasan data karyawan
  - Data difilter berdasarkan site yang dipilih di header (Super Admin bisa pilih "Semua Site")
- Tab utama: `Data Master`
  - Menu item: `Master Data Karyawan` → halaman tabbed gabungan:
    - Tab: Master Karyawan | Master Site | Master Department | Master Job Role | Master Job Level | Master Work Location | Master Group Shift
  - Menu item: `Master Admin` (terpisah, bukan tab)
  - Menu item: `Site Approval Config` (Super Admin only, terpisah)
  - Menu item: `Master Data Unit` (dropdown):
    - `Master Unit`
    - `Master Vendor`
  - Menu item: `Master Data Dokumen` → halaman tabbed gabungan:
    - Tab: Master Dok PKB | Master Dok Karyawan | Master Cuti Karyawan | Master Hari Libur
- Tab utama: `Data Karyawan`
  - Menu item: `Detail Karyawan`
  - Menu item: `Bimbingan & Pengarahan`
  - Menu item: `Data Surat Peringatan`
  - Menu item: `Lisensi & Sertifikasi`
  - Menu item: `Pelatihan Karyawan`
  - Menu item: `Cuti Karyawan` → halaman tabbed gabungan:
    - Tab: Data Cuti Karyawan | Flow Proses Cuti
- Tab utama: `Data Unit`
  - Menu item: `Lisensi & Sertifikasi Unit`

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
- `Group Shift`
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
- `Group Shift` -> dari `Master Group Shift`

Catatan implementasi:

- `Employee No` disimpan sebagai unique field.
- `Site / Div` sekarang mengacu pada `Master Site` dan dipilih via dropdown di template import (tidak lagi default CLC).
- `Age` dan `Length Of Service` dihitung otomatis dari tanggal pada layer aplikasi/API.
- Kolom `Password` tidak boleh dikirim balik ke frontend, tidak ditampilkan pada tabel/export, dan disimpan sebagai hash `scrypt` untuk data baru maupun reset password.
- Login aplikasi sekarang menggunakan data `Master Admin` dengan rule:
  - input `NIK` divalidasi ke `Master Admin -> Employee -> employeeNo`
  - input `password` diverifikasi terhadap hash `Master Admin -> password`
  - user yang belum terdaftar di `Master Admin` tidak bisa mengakses aplikasi
- Proteksi akses halaman frontend sekarang mewajibkan login terlebih dahulu.
- Session admin frontend menyimpan access token di `localStorage`, lalu setiap request admin mengirim header `Authorization: Bearer`.
- Seluruh route admin-only di backend diproteksi middleware `requireAdminAuth`; route employee self-service tetap memakai middleware bearer token karyawan.
- Nilai `Employment Type` untuk user-facing UI dan template Excel menggunakan format label `Permanent` dan `Contract`, sedangkan penyimpanan internal database tetap memakai enum teknis.
- Nilai `Grade` untuk user-facing UI dan template Excel menggunakan format label seperti `Rank 1`, `Rank 2`, dan seterusnya, sedangkan penyimpanan internal database tetap memakai enum teknis.
- Sudah tersedia template Excel bulk import untuk `Master Karyawan`.
- Sudah tersedia fitur import bulk dari file Excel pada halaman `Master Karyawan`.
- Template import `Master Karyawan` sekarang sudah memiliki kolom `Group Shift` dengan dropdown value dari `Master Group Shift`.
- Template import `Master Karyawan` sekarang dihasilkan dinamis dari backend, sehingga seluruh dropdown value selalu mengikuti data master terbaru di sistem.
- Import bulk mendukung partial success:
  - baris valid tetap diimport
  - baris gagal menghasilkan file error report `.xlsx`
- Import bulk `Master Karyawan` sekarang menggunakan mekanisme **all-or-nothing**:
  - jika ada 1 baris error, seluruh data ditolak
  - semua baris valid di-insert dalam satu database transaction
  - detail error per baris ditampilkan di dialog popup frontend
  - non-super_admin hanya bisa import karyawan ke site mereka sendiri
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
  - `approvalRank` : integer nullable (posisi dalam hierarki approval)
- Kolom `Approval Rank` sekarang tampil di tabel dan form edit halaman Master Job Level.

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

#### Master Dok Karyawan

- Kolom database utama:
  - `id` : auto increment
  - `documentName` : varchar
  - `documentType` : varchar
  - `issuer` : varchar
- Ditempatkan pada grup menu `Master Data Dokumen`
- Form input mengikuti pola halaman master yang sudah ada, dengan field:
  - `Nama Dokumen`
  - `Jenis Dokumen` dengan pilihan `Sertifikat`, `Lisensi`, `Izin`, `Rahasia`, dan `Lainnya`
  - `Penerbit`
- Jika user memilih `Lainnya`, sistem menampilkan input manual tambahan untuk mengisi jenis dokumen custom.

#### Master Cuti Karyawan

- Kolom database utama:
  - `id` : auto increment
  - `leaveType` : varchar
  - `leaveCode` : varchar(10) nullable (kode checkbox dokumen cetak: C1, C2, C3, H1, H2, DP, S1, S2, SC, A, B)
- Ditempatkan pada grup menu `Master Data Dokumen`
- Form input mengikuti pola halaman master yang sudah ada, dengan field:
  - `Jenis Cuti`
  - `Leave Code` sebagai dropdown dengan pilihan kode standar
- Kolom `NO` pada tabel menggunakan nomor urut tampilan dan otomatis rapat kembali saat ada row yang dihapus.
- Data Master Cuti Karyawan harus sesuai dengan jenis cuti yang ada di template dokumen cetak cuti (Form Permohonan Cuti dan Ijin).
- Migration seed otomatis mengisi 11 jenis cuti standar: Cuti Tahunan, Cuti 10 Tahunan, Cuti Spesial, Cuti Haid, Cuti Melahirkan, Dispensasi, Sakit Ijin Dokter, Sakit Karena Kecelakaan, Skorsing, Absen, Ijin.

#### Master Group Shift

- Kolom database utama:
  - `id` : auto increment
  - `groupShiftName` : varchar
- Ditempatkan pada grup menu `Master Data Karyawan`
- Form input mengikuti pola halaman master yang sudah ada, dengan field:
  - `Nama Group Shift`
  - `Foreman` sebagai multi select searchable dari `Master Karyawan`
  - `Karyawan` sebagai multi select searchable dari `Master Karyawan`
- Opsi `Foreman` hanya menampilkan karyawan dengan `Job Level = Foreman`
- Satu `Master Group Shift` dapat memiliki lebih dari satu foreman yang terhubung
- Satu `Master Group Shift` dapat memiliki lebih dari satu karyawan yang terhubung
- Satu karyawan hanya boleh memiliki satu assignment `Group Shift` aktif pada saat yang sama melalui field `Employee.groupShiftId`
- `Master Group Shift` sekarang menjadi source of truth untuk assignment massal `Group Shift` pada `Master Karyawan`
- Saat `Master Group Shift` dibuat, diubah, dihapus, atau diimport:
  - assignment karyawan pada field `Group Shift` di `Master Karyawan` otomatis tersinkron
  - karyawan yang dipindahkan ke group lain otomatis dilepas dari assignment group sebelumnya
- Halaman `Master Group Shift` sekarang memiliki kolom list `Karyawan`
- Sudah tersedia template Excel bulk import untuk `Master Group Shift`
- Sudah tersedia fitur `Download Template` dan `Import Excel` pada halaman `Master Group Shift`
- Template import `Master Group Shift` sekarang dihasilkan dinamis dari backend
- Template import `Master Group Shift` minimal memiliki kolom:
  - `Nama Group Shift`
  - `Foreman`
  - `Karyawan`
- Kolom `Foreman` dan `Karyawan` pada template import mendukung banyak nama dalam satu sel dengan delimiter `;`
- Import `Master Group Shift` mendukung partial success:
  - baris valid tetap diproses
  - baris gagal menghasilkan file error report `.xlsx`
- Kolom `NO` pada tabel menggunakan nomor urut tampilan dan otomatis rapat kembali saat ada row yang dihapus.

#### Master Unit

- Kolom database utama:
  - `id` : auto increment
  - `unitName` : varchar
  - `unitType` : varchar
  - `capacity` : varchar
  - `unitSerialNumber` : varchar
  - `detailLainnya` : varchar
- Ditempatkan pada grup menu `Master Data Unit`
- Form input mengikuti pola halaman master yang sudah ada, dengan field:
  - `Nama Unit`
  - `Jenis Unit` dengan pilihan `Forklift`, `Cargo Lift`, `Kendaraan`, dan `Infrastruktur`
  - `Kapasitas`
  - `Unit/Serial Number`
  - `Detail Lainnya`
- Kolom `NO` pada tabel menggunakan nomor urut tampilan dan otomatis rapat kembali saat ada row yang dihapus.

#### Master Vendor

- Kolom database utama:
  - `id` : auto increment
  - `vendorName` : varchar
  - `vendorType` : varchar
  - `address` : varchar
  - `picName` : varchar
  - `phoneNumber` : varchar
  - `email` : varchar
  - `detailLainnya` : varchar
- Ditempatkan pada grup menu `Master Data Unit`
- Form input mengikuti pola halaman master yang sudah ada, dengan field:
  - `Nama Vendor`
  - `Jenis Vendor` dengan pilihan `Consumable`, `Building`, `Trucking`, `Jasa`, `Warehousing`, `Disposable`, dan `Lainnya`
  - `Alamat`
  - `Nama PIC`
  - `Nomor Telfon` opsional
  - `Email` opsional
  - `Detail Lainnya`
- Jika user memilih `Lainnya`, sistem menampilkan input manual tambahan untuk mengisi jenis vendor custom.
- Sudah tersedia template Excel bulk import untuk `Master Vendor`.
- Sudah tersedia fitur import bulk dari file Excel pada halaman `Master Vendor`.
- Template import `Master Vendor` dihasilkan dinamis dari backend dengan kolom:
  - `Nama Vendor`
  - `Jenis Vendor`
  - `Alamat`
  - `Nama PIC`
  - `Nomor Telepon`
  - `Email`
  - `Detail Lainnya`
- Kolom `Jenis Vendor` pada template import `Master Vendor` menyediakan dropdown value standar seperti form input, tetapi tetap boleh diisi manual untuk vendor type custom.
- Import `Master Vendor` mendukung partial success:
  - baris valid tetap diimport
  - baris gagal menghasilkan file error report `.xlsx`
- Validasi import `Master Vendor` memeriksa duplikasi `Nama Vendor` secara no-case sensitive serta format `Nomor Telepon` dan `Email`.
- Kolom `NO` pada tabel menggunakan nomor urut tampilan dan otomatis rapat kembali saat ada row yang dihapus.

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

### 2A. Portal Mobile Karyawan (PWA)

Modul ini digunakan agar karyawan dapat login dari HP dan melihat data dirinya sendiri dalam tampilan mobile yang ringan.

- Route utama:
  - `/karyawan/login`
  - `/karyawan`
  - `/karyawan/profil`
  - `/karyawan/bimbingan-pengarahan`
  - `/karyawan/pelatihan`
  - `/karyawan/surat-peringatan`
- Scope v1 bersifat read-only untuk data milik karyawan yang sedang login.
- Login menggunakan:
  - `NIK` -> `Employee.employeeNo`
  - `Password` -> `Employee.password`
- Session mobile karyawan disimpan terpisah dari session admin.
- Data yang ditampilkan pada dashboard/profil minimal mencakup:
  - `employeeNo`
  - `fullName`
  - `employmentType`
  - `siteDiv`
  - `department`
  - `workLocation`
  - `jobRole`
  - `jobLevel`
  - `educationLevel`
  - `grade`
  - `joinDate`
  - `lengthOfService`
  - `birthDate`
  - `age`
  - `gender`
  - `phoneNumber`
  - `email`
- Halaman mobile karyawan menampilkan:
  - dashboard ringkasan
  - profil karyawan
  - riwayat `Bimbingan & Pengarahan` milik sendiri
  - riwayat `Pelatihan Karyawan` milik sendiri
  - riwayat `Surat Peringatan / Skorsing / Surat Teguran` milik sendiri
- PWA sekarang memiliki:
  - manifest
  - service worker
  - ikon install app
  - `start_url` ke `/karyawan/login`
- Frontend sekarang diarahkan ke deployment Cloudflare-only:
  - admin: `https://admin.aplikasi-hub.my.id`
  - PWA: `https://pwa.aplikasi-hub.my.id`
- Domain custom PWA dipisahkan ke `pwa.aplikasi-hub.my.id`.
- Hostname guard PWA ditambahkan di frontend agar akses root pada host PWA otomatis diarahkan ke `/karyawan/login`.
- Konfigurasi build production frontend menyetel `VITE_API_BASE_URL` ke `https://api.aplikasi-hub.my.id/api`.
- Ditambahkan file `.env.production` agar build production frontend selalu mengarah ke `https://api.aplikasi-hub.my.id/api` dan tidak lagi memakai base URL lokal LAN.
- Konfigurasi CORS backend diperluas untuk mengizinkan origin subdomain Cloudflare (`pwa/admin`) dan origin lokal development.
- Strategi PWA untuk data sensitif bersifat online-first:
  - shell aplikasi dapat dicache
  - request `/api/*` tidak menyimpan cache persisten data karyawan

#### Notifikasi Header Admin

- Tombol lonceng pada header admin sekarang menampilkan panel notifikasi global.
- Badge menggunakan jumlah alert aktif, bukan `dot` statis.
- Data notifikasi diambil dari endpoint live `/api/notifications`.
- Status `baca / belum baca` disimpan pada tabel `admin_notification_read_states`.
- Panel notifikasi mendukung:
  - tandai otomatis sebagai dibaca saat item diklik
  - tombol `Tandai semua`
- Setiap item notifikasi memiliki deep-link ke halaman terkait:
  - `Lisensi & Sertifikasi` karyawan
  - `Lisensi & Sertifikasi Unit`
  - `Flow Proses Cuti`
- Query deep-link minimal menggunakan `?search=` agar halaman tujuan langsung terfilter ke data terkait.
- Ambang `Akan Expired` tetap `25 hari` agar konsisten dengan halaman lisensi yang sudah ada.

#### Halaman Surat Peringatan

- Menyediakan form input surat peringatan.
- Isi form harus sama dengan `Data Record Warning Letter`.
- Perlu fungsi print dengan format yang sama dengan form surat peringatan.
- Implementasi awal yang sudah dibuat:
  - halaman `Data Surat Peringatan` di bawah menu `Data Karyawan`
    - halaman ini sekarang menampung 3 kategori dokumen disipliner:
      - `Surat Peringatan`
      - `Skorsing`
      - `Surat Teguran`
    - tombol input dibuat menjadi dropdown `Tambah Input Form` dengan pilihan:
      - `Form Surat Peringatan`
      - `Form Skorsing`
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
    - `Superior` hanya menampilkan karyawan dengan `Job Level = Dept. Manager` dan tetap kompatibel dengan data lama `Department Manager`
  - struktur input `Surat Teguran`:
    - `Nama` dari `Master Karyawan`
    - `NIK` autofill dari `Employee No`
    - `Departement` autofill dari master karyawan
    - `Jabatan` autofill dari master karyawan
    - `Nomor Surat` maksimal 25 karakter
    - `Tanggal`
    - `Pelanggaran`
    - `Superior` hanya menampilkan karyawan dengan `Job Level = Dept. Manager` dan tetap kompatibel dengan data lama `Department Manager`
  - halaman detail dengan tombol `Print A4`
    - struktur input `Skorsing` memakai basis field `Surat Peringatan` tanpa level SP, tetap menggunakan `Pasal PKB` dan `Isi Pasal`
    - layout print A4 `Surat Peringatan` dan `Skorsing` sekarang memakai template bersama `SII-QSHE-085-01 Surat Peringatan-Skorsing`
    - checkbox pada print template bersama dibedakan otomatis:
      - `Surat Peringatan` menandai salah satu `SP 1 / SP 2 / SP 3`
      - `Skorsing` menandai `Skorsing`
    - narasi keputusan `Kedua / Ketiga / Keempat` pada print template bersama dipetakan berdasarkan kategori dokumen
    - layout print A4 `Surat Teguran` mengikuti dokumen `Surat Teguran.pdf` dengan komposisi manual A4 berbasis struktur PDF
  - nama superior dan nama karyawan tampil pada area tanda tangan di hasil print
    - form input/edit `Surat Peringatan` sekarang mengikuti rule final berdasarkan surat peringatan aktif:
      - jika tidak ada `Surat Peringatan` aktif, form mengizinkan memilih `SP1`, `SP2`, atau `SP3`
      - jika masih ada `SP1` aktif, form otomatis mengarahkan default ke `SP2`, menonaktifkan `SP1`, dan tetap mengizinkan `SP3`
      - jika masih ada `SP2` aktif, form otomatis mengarahkan ke `SP3` dan menonaktifkan `SP1` serta `SP2`
      - jika masih ada `SP3` aktif, pembuatan `Surat Peringatan` baru diblokir sampai masa SP3 selesai
    - rule ini hanya berlaku untuk kategori `Surat Peringatan`, bukan `Skorsing`
    - form input/edit menampilkan warning/error yang mengikuti state SP aktif karyawan terpilih
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

#### Rule Pengganti Selama Cuti di PWA Mobile

- Dropdown `Pengganti Selama Cuti` pada form `Pengajuan Cuti` PWA difilter dari backend dan baru dimuat setelah user memilih `Periode Dari` dan `Periode Sampai`.
- Rule default kandidat pengganti:
  - wajib dari `Department` yang sama
  - wajib memiliki `Group Shift` dan `Job Role` yang sama dengan requester
- Jika requester tidak memiliki `Group Shift`, fallback memakai kandidat dengan `Job Role` yang sama dalam `Department` yang sama.
- Jika requester tidak memiliki `Job Role`, fallback memakai kandidat dalam `Department` yang sama dengan mengecualikan `Dy. Dept. Manager`, `Dept. Manager`, dan `Site/Div. Manager`.
- Special case `Job Role`:
  - `Dy. Dept. Manager` hanya boleh memilih kandidat dari `General Foreman`, `Section Chief`, `Dy. Dept. Manager`, atau `Dept. Manager`, dan tetap wajib satu department
  - `Dept. Manager` boleh memilih kandidat dari `Section Chief`, `Dy. Dept. Manager`, `Dept. Manager`, atau `Site/Div. Manager`, termasuk lintas department
  - `Site/Div. Manager` boleh memilih kandidat dari `Dy. Dept. Manager`, `Dept. Manager`, atau `Site/Div. Manager`, termasuk lintas department
- Kandidat pengganti yang sedang memiliki cuti overlap pada periode pengajuan tidak boleh ditampilkan di dropdown.
- Jika tidak ada kandidat valid, pengajuan cuti tidak boleh disubmit dan UI wajib menampilkan pesan error yang jelas.
- Validasi kandidat pengganti wajib dijalankan di frontend dan backend untuk mencegah race condition saat submit/resubmit.

#### Data Cuti Karyawan

- Menyediakan halaman `Data Cuti Karyawan` di bawah menu `Data Karyawan`.
- Struktur input:
  - `Nama Karyawan` dari `Master Karyawan`
  - `NIK` autofill dari `Employee No`
  - `Jenis Cuti` dari `Master Cuti Karyawan`
  - `Jumlah Cuti`
  - `Periode Cuti Dari`
  - `Periode Cuti Sampai`
  - `Sisa Cuti`
  - `Catatan`
- Halaman daftar mengikuti pola `Lisensi & Sertifikasi`.
- Halaman daftar memiliki:
  - search no-case sensitive
  - filter rentang tanggal berdasarkan rentang `Periode Cuti`
  - `Import Excel`
  - `Export Excel`
  - `NO` berbasis nomor urut tampilan
  - sticky kolom aksi
  - pagination `15 / 30 / 50 / 100`
- Sudah tersedia template Excel bulk import untuk `Data Cuti Karyawan`.
- Sudah tersedia fitur import bulk dari file Excel pada halaman `Data Cuti Karyawan`.
- Import bulk mendukung partial success:
  - baris valid tetap diimport
  - baris gagal menghasilkan file error report `.xlsx`
- Template import `Data Cuti Karyawan` sekarang dihasilkan dinamis dari data master terbaru saat user menekan tombol `Download Template`.
- Kolom `Nama Karyawan` pada template import menggunakan dropdown value dari `Master Karyawan`.
- Kolom `NIK` pada template import terisi otomatis berdasarkan `Nama Karyawan` yang dipilih.
- Kolom `Jenis Cuti` pada template import menggunakan dropdown value dari `Master Cuti Karyawan`.
- Template import tidak lagi menyertakan sample data bawaan; sheet `Data Import` disediakan dalam kondisi bersih.

#### Print Form Cuti Approved

- Request cuti dengan status `Approved` sekarang dapat dicetak ke format `Print A4`.
- Tombol `Print A4` tersedia pada:
  - halaman admin `Flow Proses Cuti` di kolom `Aksi`
  - halaman detail cuti karyawan di PWA untuk request yang sudah `Approved`
- Route print yang digunakan:
  - `/print/data-karyawan/cuti-karyawan/:id`
  - `/karyawan/cuti/:id/print`
- Template print mengikuti dokumen `Form Permohonan Cuti dan Ijin.pdf` dengan pendekatan komposisi manual A4 agar hasil visual mendekati form resmi.
- Mapping print saat ini mencakup:
  - `Site / Div`
  - `Department`
  - `Tanggal Pengajuan`
  - `Nama`
  - `NIK`
  - checkbox `Jenis Cuti`
  - `Jumlah hari cuti`
  - `Periode cuti`
  - `Alamat selama cuti`
  - `Alasan cuti`
  - daftar `Pengganti selama cuti` hingga 4 orang
  - `Sisa cuti`
  - tabel approval bawah berisi tanggal dan nama requester/approver
- Layout print A4 cuti sudah disesuaikan ulang agar bagian approval bawah tidak terpotong pada preview/print satu halaman.

### 4. Modul Dokumen

#### Daftar Lisensi Unit & Kargo

- Menyediakan daftar data lisensi unit dan kargo.
- Struktur isian mengikuti form QSHE untuk unit equipment yang disertifikasi.
- Contoh unit:
  - Cargo Lift
  - Omni Lift
  - Forklift
  - Genset
- Implementasi awal yang sudah direncanakan dan disetujui:
  - halaman `Lisensi & Sertifikasi Unit` di bawah menu `Data Unit`
  - form input/edit dengan field:
    - `Nama Unit` dari `Master Unit`
    - `Asset No`
    - `Jenis Unit` autofill dari master unit
    - `Kapasitas` autofill dari master unit
    - `Unit/Serial Number` autofill dari master unit
    - `No. Dokumen`
    - `Diterbitkan`
    - `Vendor Pengurus` dari `Master Vendor`
    - `Masa Berlaku`
    - `Status` dinamis dari `Masa Berlaku`
    - `Catatan`
  - status menggunakan logika:
    - `Aktif` jika masa berlaku hari ini atau masih di masa depan
    - `Akan Expired` jika masa berlaku tinggal 25 hari atau kurang dari hari ini
    - `Expired` jika masa berlaku sudah lewat
  - halaman daftar mengikuti pola `Lisensi & Sertifikasi` karyawan
  - halaman daftar memiliki:
    - search no-case sensitive
    - filter rentang tanggal berdasarkan `Masa Berlaku`
    - filter `Status`
    - `Export Excel`
    - checkbox selection
    - `NO` berbasis nomor urut tampilan

#### Daftar Lisensi SDM

- Menyediakan daftar lisensi dan sertifikasi yang dimiliki karyawan.
- Contoh:
  - SIO
  - Lisensi K3
- Format mengikuti form QSHE.
- Implementasi awal yang sudah direncanakan dan disetujui:
  - halaman `Lisensi & Sertifikasi` di bawah menu `Data Karyawan`
  - form input/edit dengan field:
    - `Nama` dari `Master Karyawan`
    - `NIK` autofill dari `Employee No`
    - `Dokumen` dari `Master Dok Karyawan`
    - `Jenis Dokumen` autofill dari master dokumen
    - `Type`
    - `No. Dokumen`
    - `Diterbitkan` autofill dari `Penerbit` master dokumen
    - `Masa Berlaku`
    - `Status` dinamis dari `Masa Berlaku`
    - `Catatan`
  - status menggunakan logika:
    - `Aktif` jika masa berlaku hari ini atau masih di masa depan
    - `Akan Expired` jika masa berlaku tinggal 25 hari atau kurang dari hari ini
    - `Expired` jika masa berlaku sudah lewat
  - halaman daftar mengikuti pola `Data Surat Peringatan`
  - halaman daftar memiliki:
    - search no-case sensitive
    - filter rentang tanggal berdasarkan `Masa Berlaku`
    - filter `Status`
    - `Export Excel`
    - checkbox selection
    - `NO` berbasis nomor urut tampilan

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
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman `Master Group Shift` dengan field `Nama Group Shift` dan relasi banyak `Foreman` dari `Master Karyawan`.
- Memperluas `Master Group Shift` dengan field multi select `Karyawan`, sinkronisasi otomatis ke `Master Karyawan -> Group Shift`, serta fitur `Download Template` dan `Import Excel` dengan partial success + file error report.
- Menambahkan relasi `Group Shift` pada `Master Karyawan`, dengan sumber dropdown dari `Master Group Shift` dan posisi kolom setelah `Department`.
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman `Master Dok Karyawan` dengan field `Nama Dokumen`, `Jenis Dokumen`, dan `Penerbit`.
- Menambahkan schema, migration, resource master data generic, route, menu, dan halaman `Master Cuti Karyawan` dengan field `Jenis Cuti`.
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman `Data Cuti Karyawan` dengan relasi ke `Master Karyawan` dan `Master Cuti Karyawan`.
- Menambahkan template Excel bulk import dan fitur upload/import Excel untuk `Data Cuti Karyawan`, beserta file error report per baris.
- Menyesuaikan template import `Data Cuti Karyawan` agar dropdown dan autofill mengikuti data master terbaru (`Nama Karyawan`, `NIK`, dan `Jenis Cuti`) serta menghapus sample data dari template.
- Menambahkan schema, migration, resource master data generic, route, menu, dan halaman `Master Unit` dengan field `Nama Unit`, `Jenis Unit`, `Kapasitas`, `Unit/Serial Number`, dan `Detail Lainnya`.
- Menambahkan schema, migration, resource master data generic, route, menu, dan halaman `Master Vendor` dengan field `Nama Vendor`, `Jenis Vendor`, `Alamat`, `Nama PIC`, `Nomor Telfon`, `Email`, dan `Detail Lainnya`.
- Menambahkan template Excel bulk import dan fitur upload/import Excel untuk `Master Vendor`, beserta validasi duplikasi nama vendor, validasi format telepon/email, dan file error report per baris.
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman `Lisensi & Sertifikasi` dengan relasi ke `Master Karyawan` dan `Master Dok Karyawan`.
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman `Lisensi & Sertifikasi Unit` dengan relasi ke `Master Unit` dan `Master Vendor`.
- Menambahkan fitur login aplikasi menggunakan kredensial `Master Admin` (`NIK` + `Password`).
- Menambahkan token auth backend untuk admin, middleware proteksi route admin, hashing password `scrypt`, dan script `npm run security:hash-passwords` untuk mengonversi password plaintext lama.
- Menambahkan halaman login, proteksi route frontend, dan logout dari header aplikasi.
- Menyesuaikan desain halaman login menjadi gaya corporate-modern dengan tema dominan biru dan palet warna yang lebih minimal.
- Menyempurnakan tone biru halaman login ke warna yang lebih kalem dan elegan dengan basis warna `RGB(58, 147, 242)`.
- Menyesuaikan aset logo pada panel kiri halaman login agar tulisan `SANKYU` tampil putih dan lebih kontras di atas background biru.
- Menambahkan aset logo khusus login dengan simbol merah dan tulisan `SANKYU` putih agar mengikuti kebutuhan visual panel kiri.
- Menambahkan template Excel bulk import `Master Karyawan`.
- Menambahkan fitur upload/import Excel `Master Karyawan` beserta file error report per baris.
- Menambahkan fitur `Export Excel` pada halaman `Master Karyawan`.
- Menambahkan kolom filter pencarian no-case sensitive pada seluruh halaman `Data Master`, termasuk `Master Karyawan`.
- Menambahkan schema, migration, API CRUD, menu, route, halaman tabel, dan form input untuk `Bimbingan & Pengarahan`.
- Menambahkan halaman detail dan print `Formulir Catatan Bimbingan Karyawan` dengan pendekatan overlay data di atas template PDF resmi.
- Menambahkan kategori `Bimbingan` dan `Pengarahan` pada modul `Bimbingan & Pengarahan`, beserta form input dan template print A4 untuk `Formulir Catatan Pengarahan Karyawan`.
- Menambahkan schema, migration, API CRUD, route, menu, halaman tabel, form input/edit, halaman detail, dan print A4 untuk modul `Data Surat Peringatan`.
- Memperluas modul `Data Surat Peringatan` agar juga mendukung `Form Skorsing` pada schema Prisma, API Express, list/detail/filter/export, history PWA, dan bulk print tanpa memecah modul data.
- Menyesuaikan template print `Surat Peringatan` agar mengikuti format `SII-QSHE-085-01 Surat Peringatan-Skorsing`, lalu menyatukannya dengan `Skorsing` dalam satu basis komponen print dengan mapping checkbox dan narasi terpusat.
- Menyempurnakan rule eskalasi `Surat Peringatan` di backend dan frontend agar mengikuti rule final:
  - tanpa SP aktif: boleh `SP1`, `SP2`, atau `SP3`
  - dengan `SP1` aktif: hanya `SP2` atau `SP3`
  - dengan `SP2` aktif: hanya `SP3`
  - dengan `SP3` aktif: pembuatan SP baru diblokir
  - rule ini tidak berlaku untuk `Skorsing` dan `Surat Teguran`
- Menambahkan auth flow khusus `Portal Mobile Karyawan` berbasis `Employee No` + `Employee.password`.
- Menambahkan middleware bearer token karyawan dan endpoint self-service:
  - `/api/employee-auth/login`
  - `/api/employee-me/dashboard`
  - `/api/employee-me/profile`
  - `/api/employee-me/guidance-records`
  - `/api/employee-me/training-records`
  - `/api/employee-me/warning-letters`
- Menambahkan route frontend mobile-first untuk:
  - `/karyawan/login`
  - `/karyawan`
  - `/karyawan/profil`
  - `/karyawan/bimbingan-pengarahan`
  - `/karyawan/pelatihan`
  - `/karyawan/surat-peringatan`
- Menambahkan layout mobile khusus karyawan dengan bottom navigation dan logout terpisah dari area admin.
- Menambahkan halaman dashboard, profil, riwayat bimbingan, riwayat pelatihan, dan riwayat surat peringatan untuk karyawan login.
- Menambahkan fitur `Ubah Password` pada halaman profil PWA Karyawan, lengkap dengan dialog form mobile-first dan endpoint self-service khusus employee login.
- Menambahkan fitur self-service `Ubah Kontak & Email` pada halaman profil PWA Karyawan, lengkap dengan notifikasi admin ketika employee mengubah password, kontak, atau email melalui Portal Karyawan.
- Refactor UI halaman Beranda PWA Karyawan menjadi lebih minimalis dan premium dengan hero card ringkas, quick status yang lebih fokus, menu cepat 2 kolom yang lebih rapi, ringkasan informasi karyawan yang dipadatkan termasuk kontak (`No Telepon` dan `Email`), serta aktivitas terbaru yang lebih ringan dipindai, tanpa mengubah header dan bottom navigation existing.
- Menambahkan status proses cuti aktif pada section `Quick Status` di beranda PWA Karyawan:
  - jika employee login adalah requester dan masih punya pengajuan cuti dengan status aktif (`Submitted` / `Dalam Approval`), kartu akan menampilkan status proses tersebut dan membuka detail request saat ditekan
  - jika employee login adalah approver dan tahap approval aktif sudah sampai ke dirinya (`PENDING`), kartu akan memprioritaskan item approval tersebut dan membuka halaman approval saat ditekan
  - status otomatis hilang ketika approval/reject sudah selesai atau proses request sudah tidak aktif
- Mengaktifkan PWA pada project aktif dengan manifest, service worker, register SW, dan ikon install app untuk `Portal Mobile Karyawan`.
- Menambahkan route print admin dan PWA untuk `Form Permohonan Cuti dan Ijin`, beserta tombol `Print A4` pada flow cuti approved dan detail cuti approved.
- Menambahkan dokumen print A4 khusus cuti approved dengan mapping field workflow cuti, checkbox jenis cuti, daftar pengganti repetitif, dan ringkasan approval bawah.
- Menyesuaikan layout vertikal dokumen print cuti agar seluruh form tetap muat dalam satu halaman A4 tanpa memotong area approval bawah.
- Menambahkan tombol `Install App` pada halaman login PWA Karyawan, beserta fallback informasi manual untuk browser yang belum memunculkan prompt install otomatis.
- Menyederhanakan hero header halaman login PWA Karyawan dengan menghapus logo gambar terpisah dan memusatkan teks `SANKYU` + `Portal Karyawan` agar tampil lebih minimalis dan modern.
- Menyesuaikan konfigurasi PWA agar manifest menggunakan ikon PNG standar (`pwa/icon-192.png` dan `pwa/icon-512.png`) untuk kompatibilitas install yang lebih stabil.
- Mengubah favicon HTML agar menggunakan PNG standar dari `public/pwa`.
- Menyesuaikan `vite.config.js` agar host development menerima domain Cloudflare public (`aplikasi-hub.my.id`, `www`, `pwa`, `api`) saat diakses lewat tunnel.
- Menambahkan konfigurasi host PWA terpusat untuk domain Cloudflare dan Vercel, lengkap dengan redirect runtime agar host `*.vercel.app` hanya melayani area Mobile PWA (`/karyawan`).
- Menambahkan `vercel.json` pada `app-karyawan` untuk memastikan deep-link SPA Vite tetap kembali ke `index.html` saat Mobile PWA dideploy ke Vercel.
- Menambahkan guard startup server Express agar port `4000` yang sedang dipakai tidak menyebabkan crash dev berulang.
- Menambahkan endpoint live `/api/notifications` dan panel notifikasi pada header admin.
- Menambahkan endpoint update status notifikasi:
  - `POST /api/notifications/read`
  - `POST /api/notifications/read-all`
- Menambahkan endpoint riwayat notifikasi admin:
  - `GET /api/notifications/history`
- Menambahkan tabel `admin_notification_read_states` untuk menyimpan status baca per admin.
- Menambahkan tabel `admin_notification_records` untuk menyimpan snapshot histori notifikasi admin yang pernah muncul.
- Menambahkan notifikasi global untuk lisensi/sertifikasi karyawan dan unit yang akan expired atau expired.
- Menambahkan reminder operasional pada notifikasi header untuk flow cuti terlalu lama, cuti rejected, dan email workflow gagal.
- Menambahkan status `Sudah dibaca` dan `Belum dibaca` pada panel notifikasi serta verifikasi UI klik/deep-link secara langsung di browser lokal.
- Menambahkan halaman admin `Record Notifikasi` pada route `/notifikasi` sebagai inbox/riwayat notifikasi lengkap, tetapi halaman ini tidak ditampilkan sebagai tab/menu utama navbar dan diakses dari panel lonceng header melalui CTA `Lihat semua notifikasi`.
- Verifikasi `lint`, `build`, dan smoke test API ke database berhasil.
- Menyesuaikan bottom navigation PWA Karyawan dengan menggabungkan menu `Bimbingan` dan `Peringatan` ke dalam tab `Catatan` yang memicu _Bottom Sheet_ Drawer.
- Memperbaiki styling bottom navigation PWA untuk memastikan ikon tab aktif selalu konsisten berwarna biru saat diklik.
- Menyesuaikan UI dashboard cuti PWA karyawan untuk menampilkan kartu ringkasan saldo riil untuk masing-masing jenis cuti aktif.
- Menambahkan rule backend + frontend baru untuk dropdown `Pengganti Selama Cuti` di form cuti PWA:
  - kandidat dimuat ulang setelah periode cuti dipilih
  - filter mengikuti kombinasi `Department`, `Group Shift`, `Job Role`, dan special case jabatan manager
  - kandidat yang sedang cuti overlap tidak ditampilkan
  - submit/resubmit ditolak jika pengganti kosong atau sudah tidak valid pada saat proses simpan
- Menambahkan tombol dropdown notifikasi (lonceng) pada header PWA khusus Karyawan beserta badge _unread_.
- Menambahkan endpoint live `/api/employee-me/notifications` khusus PWA.
- Menambahkan fungsi klik/baca notifikasi khusus PWA melalui `/api/employee-me/notifications/read` dan `read-all` yang transparan menggunakan tabel read-state Admin berbasis `employeeId`.
- Fitur notifikasi PWA sekarang menyaring status Cuti Menunggu Approval, Cuti Disetujui/Ditolak (14 hari terakhir), Bimbingan (14 hari), dan Peringatan (30 hari).
- Tombol `Logout` untuk PWA Karyawan tidak lagi tampil di header mobile; aksi logout dipindahkan ke halaman `/karyawan/profil` sebagai tombol merah penuh di bagian paling bawah dengan dialog konfirmasi.
- Panel notifikasi PWA sekarang memakai gaya `mini inbox` yang lebih minimalis:
  - header ringkas dengan badge jumlah notifikasi baru
  - action dipisah antara kontrol utama push dan aksi utilitas seperti `Refresh` / `Tandai semua`
  - item notifikasi tampil sebagai kartu ringan dengan hierarchy judul, waktu, isi singkat, dan status baca yang lebih jelas
  - trigger ikon lonceng memiliki state aktif saat panel terbuka dengan highlight biru lembut tanpa mengganggu badge unread
- Menyelesaikan perbaikan _bug_ destructuring auth pada fungsionalitas _hooks_ React di notifikasi PWA Karyawan.
- Menambahkan dark mode khusus `Portal Mobile Karyawan` dengan nested Material UI theme provider, nested snackbar provider, dan persistensi `localStorage`, tanpa mengubah theme admin desktop.
- Menyesuaikan surface dark mode pada halaman dashboard, profil, cuti, bimbingan, surat peringatan, login PWA, dialog, drawer, snackbar, bottom navigation, header mobile, dan panel notifikasi PWA agar tetap elegan, lembut, dan konsisten dengan aksen biru corporate-modern.
- Menyesuaikan halaman `Login Page Admin` agar mengikuti tema aktif melalui `MinimalLayout` dan komponen login utama, sehingga background, card, form field, dan hero panel ikut berubah saat light/dark mode berganti tanpa reload.
- Menambahkan halaman **Detail Karyawan** di bawah menu Data Karyawan, yang menampilkan:
  - Halaman daftar karyawan (`/data-karyawan/detail-karyawan`) dengan tabel searchable + filter departemen + pagination 15/30/50/100
  - Halaman detail per karyawan (`/data-karyawan/detail-karyawan/:id`) menampilkan hero card profil lengkap dan ringkasan data dari semua modul:
    - Bimbingan & Pengarahan (5 data terbaru)
    - Surat Peringatan (5 data terbaru + counter SP aktif 6 bulan)
    - Lisensi & Sertifikasi (5 data terbaru + badge status expired/akan expired)
    - Saldo Cuti (kartu saldo per jenis cuti dengan progress bar)
    - Riwayat Pengajuan Cuti (5 pengajuan terbaru)
  - Setiap section memiliki tombol deep-link "Lihat semua" yang langsung filter ke halaman terkait dengan nama karyawan
  - Backend endpoint baru `GET /api/master/employees/:id/summary` mengambil semua data terkait sekaligus
- Menambahkan schema, migration, API CRUD, route, menu, dan halaman **Master Hari Libur** di bawah Master Data Dokumen:
  - Input field: `Periode Tahun` (max 5 karakter, number), `Tanggal`, dan `Nama Hari Libur`.
  - Berhasil menangani normalisasi data tipe angka dan tanggal pada API master data generik.
  - Form Edit diperbaiki agar format tanggal `YYYY-MM-DD` muncul dengan benar di native input browser.
  - Halaman **Master Hari Libur** sekarang mendukung `Download Template` dan `Import Excel` bulk melalui flow generik master data.
  - Template import memakai kolom `Periode Tahun`, `Tanggal`, dan `Nama Hari Libur`.
  - Kolom `Tanggal` pada template Excel dipreset ke format `DD/MM/YYYY`.
  - Import bulk mendukung partial success dengan file error report `.xlsx` untuk baris yang gagal.
  - Validasi backend memastikan `Periode Tahun` valid, `Tanggal` valid, tahun sesuai dengan tanggal, dan kombinasi `tahun + tanggal + nama` tidak duplikat.
- Mengubah sumber data hari libur pada kalkulasi otomatis "Jumlah Hari Cuti":
  - Tidak lagi mengambil dari API eksternal `libur.deno.dev`.
  - Sekarang sepenuhnya mengambil dari database **Master Hari Libur** yang dikelola oleh Admin.
- Refactor UI PWA Mobile pada modul Cuti:
  - Halaman **Detail Cuti** (requester): Menghapus kartu detail redundan, memindahkan tombol Kembali dan Nomor Pengajuan ke header, serta memindahkan tombol **Print A4**, **Resubmit**, dan **Cancel** ke dalam kartu Flow Approval.
  - Halaman **Detail Approval** (approver): Kartu detail utama otomatis disembunyikan jika status bukan lagi "Menunggu Tindakan" agar user fokus ke Timeline Approval.
  - Halaman **Daftar Cuti**: Informasi "Stage aktif" dan "Approver aktif" pada kartu pengajuan disembunyikan jika status pengajuan bukan lagi "Dalam Approval" (PENDING_APPROVAL) untuk tampilan yang lebih ringkas.
- Menambahkan notifikasi WhatsApp via Fonnte API pada workflow cuti:
  - Service baru `server/lib/whatsappService.js` untuk integrasi REST API Fonnte.
  - Notifikasi WhatsApp dikirim pada event: submitted (ke requester), stage activation (ke approver), rejected (ke requester), approved (ke requester).
  - Nomor telepon karyawan dari database (format `08xx`) otomatis dinormalisasi ke format internasional `62xx`.
  - Konfigurasi memakai env var `FONNTE_TOKEN`; jika kosong, notifikasi WA dilewati tanpa error.
  - Bersifat fire-and-forget — kegagalan kirim WA tidak menggagalkan proses workflow cuti.
- Menambahkan fitur **Site Approval Workflow Config** — konfigurasi approval cuti per-site yang menggantikan hardcoded `APPROVAL_STAGE_SEQUENCE`:
  - Model baru `SiteApprovalConfig` menyimpan mapping `siteId + jobLevelId → approvalRank + maxApprovalRank`.
  - Kolom `approvalRank` (nullable integer) ditambahkan pada model `JobLevel`.
  - Migration seed otomatis mengisi konfigurasi default untuk semua site existing agar backward compatible.
  - API CRUD + Bulk endpoint di `/api/master/site-approval-configs` (Super Admin only).
  - Workflow engine `resolveApprovalStages` sekarang query `SiteApprovalConfig` secara dinamis, bukan hardcoded.
  - Halaman konfigurasi UI di `data-master/master-data-karyawan/site-approval-config` (Super Admin only).
  - Kolom `Approval Rank` sekarang tampil dan bisa diedit di halaman Master Job Level.
- Memperbaiki kolom `Site / Div` pada profil PWA Karyawan:
  - `requireEmployeeAuth` middleware sekarang include relasi `site`.
  - `buildEmployeePortalProfile` mengambil `employee.site?.name` alih-alih field `siteDiv` yang tidak ada.
- Mengubah template import `Master Karyawan` agar kolom `Site / Div` menjadi dropdown dari Master Site:
  - Tidak lagi default hardcode `CLC`.
  - Dropdown mengacu pada data `Master Site` terbaru.
  - Import handler resolve site per-baris dari kolom Excel.
  - Non-super_admin hanya bisa import karyawan ke site mereka sendiri.
  - Super Admin bisa import lintas site.
- Mengubah mekanisme import `Master Karyawan` menjadi **all-or-nothing**:
  - Jika ada 1 baris error, seluruh data ditolak (tidak ada yang masuk database).
  - Semua baris valid di-insert dalam satu database transaction.
  - Detail error per baris (nomor baris, Employee No, nama, pesan error) dikembalikan di response.
  - Frontend menampilkan dialog popup detail error dengan tabel per baris + tombol download error report.
  - Toast notifikasi sukses ditampilkan jika semua data berhasil diimport.
- Menambahkan kolom `leaveCode` pada model `MasterCutiKaryawan`:
  - Kolom `leaveCode` (VARCHAR 10, nullable) menyimpan kode checkbox dokumen cetak cuti (C1, C2, C3, H1, H2, DP, S1, S2, SC, A, B).
  - Migration seed otomatis mengisi 11 jenis cuti standar beserta kode-nya.
  - Halaman Master Cuti Karyawan sekarang menampilkan kolom `Leave Code` di tabel dan dropdown di form.
  - Template print cuti sekarang prioritaskan `leaveCode` dari database untuk menentukan checkbox yang dicentang, fallback ke name-matching jika kosong.
  - Backend `mapLeaveRequestSummary` mengembalikan `leaveCode` di response API.
- Menambahkan halaman **Dashboard** admin:
  - Navigasi menu "Dashboard" di posisi pertama (sebelah kiri Data Master).
  - Summary cards: Total Karyawan, Jumlah Site, Cuti Aktif, Lisensi Akan Expired.
  - Grafik: Distribusi per Department (bar), per Job Level (donut), Tipe Karyawan (donut), Tren Cuti per Bulan (area), per Site (bar).
  - Tabel ringkas: Lisensi Akan Expired (5 teratas), Pengajuan Cuti Terbaru (5 terbaru).
  - Data difilter berdasarkan site yang dipilih di header (Super Admin bisa filter per site atau "Semua Site").
  - Backend endpoint `GET /api/dashboard?siteId=` mendukung query parameter opsional.
- Menambahkan validasi duplikasi peserta pada form **Tambah Pelatihan Karyawan**:
  - Karyawan yang sudah dipilih di satu dropdown peserta otomatis disembunyikan dari dropdown peserta lainnya.
  - Menggunakan `useWatch` dari react-hook-form untuk memantau semua `participantEmployeeIds` dan memfilter opsi secara real-time.
- Menggabungkan halaman **Data Cuti Karyawan** dan **Flow Proses Cuti** menjadi satu halaman tabbed:
  - Halaman gabungan `src/pages/employeeData/leaveCombined/index.jsx`.
  - Tab: "Data Cuti Karyawan" | "Flow Proses Cuti".
  - URL-based tab switching (kedua URL lama tetap berfungsi).
  - Menu sidebar "Cuti Karyawan" sekarang jadi satu item (bukan dropdown 2 sub-item).
- Menggabungkan halaman **Master Data Karyawan** menjadi satu halaman tabbed:
  - Halaman gabungan `src/pages/masterData/masterDataKaryawanCombined/index.jsx`.
  - Tab (scrollable): Master Karyawan | Master Site | Master Department | Master Job Role | Master Job Level | Master Work Location | Master Group Shift.
  - URL-based tab switching, state preserved antar tab.
  - Menu sidebar "Master Data Karyawan" sekarang jadi satu item. "Master Admin" dan "Site Approval Config" tetap terpisah.
- Menggabungkan halaman **Master Data Dokumen** menjadi satu halaman tabbed:
  - Halaman gabungan `src/pages/masterData/masterDataDokumenCombined/index.jsx`.
  - Tab: Master Dok PKB | Master Dok Karyawan | Master Cuti Karyawan | Master Hari Libur | Jenis Limbah B3.
  - URL-based tab switching, state preserved antar tab.
  - Menu sidebar "Master Data Dokumen" sekarang jadi satu item.
- Menambahkan modul **Pencatatan Limbah B3** dengan:
  - 3 model Prisma baru: `B3WasteType`, `B3WasteRecord`, `B3WasteOutRecord`
  - Backend CRUD routes dengan site isolation, computed fields, dan export Excel
  - Frontend halaman utama pencatatan dengan EnhancedTable + context menu klik kanan
  - Form dialog limbah masuk dan limbah keluar
  - Master data jenis limbah B3 sebagai tab di Master Data Dokumen
  - Visual indicator warning/overdue berdasarkan sisa hari penyimpanan
  - Dropdown Pengelola Pihak Ketiga dari Master Vendor pada form limbah keluar
  - Kolom `vendorId` (nullable) di `B3WasteOutRecord` dengan relasi ke `MasterVendor`
  - 11 property-based tests + 1 integration test suite (51+ tests total)
  - Fix timezone: tanggal disimpan UTC noon, frontend menggunakan local date
  - Navigasi top-level "Limbah B3" di navbar (bersebelahan dengan Data Unit)
- Memperbaiki `MasterDataPage` shared component agar menyertakan `siteId` pada semua API request (list, create, update, delete, import) melalui `appendSiteIdParam` — fix issue Master Vendor untuk super_admin.
- Menambahkan **HTML Email Templates** modern dan responsive untuk notifikasi workflow cuti:
  - File baru: `server/lib/emailTemplates.js`
  - 4 template HTML: `buildSubmittedEmail` (konfirmasi ke karyawan), `buildStageActivationEmail` (notifikasi ke approver), `buildRejectedEmail` (notifikasi ditolak), `buildApprovedEmail` (notifikasi disetujui)
  - Semua template menggunakan inline CSS, responsive, email-client-safe (tidak ada external stylesheet)
  - Setiap template memiliki header berwarna kontekstual (biru/kuning/merah/hijau), tabel info detail, alert box, dan CTA button langsung ke portal karyawan
  - `textBody` tetap dipertahankan sebagai fallback untuk email client yang tidak support HTML
  - Template `buildExpiryNotificationEmail` untuk notifikasi kadaluarsa lisensi/sertifikasi dengan tabel unit dan karyawan, urgency badge (merah/kuning/biru), dan test mode banner
- Menambahkan dukungan **Brevo API v3** untuk pengiriman email (menggantikan SMTP):
  - `server/lib/emailService.js` sekarang mendukung dua mode: Brevo API (`BREVO_API_KEY`) dan SMTP (fallback)
  - Brevo API tidak terikat IP (bebas dari `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` dan IP restriction Brevo SMTP)
  - Jika `BREVO_API_KEY` diset, semua email dikirim via `POST https://api.brevo.com/v3/smtp/email`
  - Sender email (`SMTP_FROM`) harus diverifikasi di dashboard Brevo sebelum bisa digunakan sebagai sender API
  - SMTP tetap digunakan sebagai fallback jika `BREVO_API_KEY` tidak diset
- Menambahkan **Unit Serial Number** pada dropdown Nama Unit di form Input/Edit Lisensi & Sertifikasi Unit:
  - `src/pages/unitData/licenseCertifications/unitLicenseCertificationFormDialog.jsx`: `getOptionLabel` dan `renderOption` diperbarui untuk menampilkan `unitName — unitSerialNumber`
  - Di input field: menampilkan `Nama Unit — Serial Number` setelah dipilih
  - Di dropdown list: nama unit tebal di kiri, serial number abu-abu kecil di kanan
  - Pencarian di autocomplete sekarang bisa berdasarkan serial number karena sudah masuk ke `getOptionLabel`
  - Tidak ada perubahan backend — `unitSerialNumber` sudah ada di response API
- Menambahkan modul **Pengaturan Email Notifikasi** (`/pengaturan/email-notifikasi`):
  - **Database**: Model `EmailNotificationSettings` per-site dengan field: `isEnabled`, `sendHour` (jam kirim 0-23), `unitThresholds` (Int[]), `employeeThresholds` (Int[]), `recipients` (Json array of `{email, name, isActive}`)
  - Migration: `20260901132034_add_email_notification_settings`
  - **Backend routes**: `server/routes/emailNotificationSettings.js`
    - `GET /api/admin/email-notification-settings` — load config site aktif
    - `PUT /api/admin/email-notification-settings` — upsert config
    - `POST /api/admin/email-notification-settings/test` — kirim test email ke semua penerima aktif
  - **Cron job**: `server/jobs/expiryNotificationJob.js`
    - Jadwal: `0 * * * *` (top of every hour) via `node-cron`
    - PM2 cluster guard: hanya berjalan di instance 0 (`NODE_APP_INSTANCE === '0'` atau undefined)
    - Logic: cek `isEnabled && sendHour == currentHour` per site → query unit/employee certs yang expiry = today + threshold → kirim summary email ke semua `recipients.isActive == true`
    - Threshold kadaluarsa dicek dengan exact date match (hari ini + N hari)
  - **Frontend**: `src/pages/masterData/emailNotificationSettings/index.jsx`
    - Section 1: Toggle aktif/nonaktif + dropdown jam pengiriman (00:00-23:00 WIB)
    - Section 2: Threshold Lisensi & Sertifikasi Unit — input angka bebas (≥0) + tambah/hapus, tampil sebagai chip warna urgency (merah=hari-H, kuning=≤30 hari, biru=lainnya)
    - Section 3: Threshold Lisensi & Sertifikasi Karyawan — sama seperti section 2
    - Section 4: Penerima Email — tabel dengan checkbox aktif/nonaktif per penerima, form tambah email + nama, tombol hapus per baris
    - Action: "Kirim Test Email" (POST /test) dan "Simpan Pengaturan" (PUT)
  - **Route**: `pengaturan/email-notifikasi` ditambahkan di `src/utils/routes/index.jsx`
  - **Navigasi**: Menu "Pengaturan > Pengaturan Email" ditambahkan di `src/components/layouts/mainLayout/navItems.js` sebagai group top-level baru setelah "Limbah B3"
  - Frontend menggunakan `apiRequest` dari `src/services/api.js` (Bearer token otomatis dari localStorage)
- Memperbaiki **navbar tabs overflow** — Tab "Pengaturan" terlalu ke kanan melewati batas layar:
  - `src/components/navbar/navLinks/navItem.jsx`: `minWidth` dari `260px` → `0` pada desktop (flexShrink: 1) agar setiap tab ukurannya sesuai konten, bukan fixed 260px
  - `src/components/navbar/navLinks/navItem.jsx`: padding horizontal desktop dikurangi dari `2.5` → `1.5`
  - `src/components/navbar/navLinks/index.jsx`: tambah `overflowX: 'auto'` sebagai fallback scroll jika viewport terlalu sempit
- Memperbaiki error `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` pada production PM2:
  - `server/index.js`: tambah `app.set('trust proxy', 1)` sebelum rate limiter untuk mendukung reverse proxy (nginx/Cloudflare)

#### Pencatatan Limbah B3

- Modul baru di bawah menu navigasi top-level `Limbah B3` (terletak setelah `Data Unit`).
- Route frontend: `/limbah-b3/pencatatan`
- Breadcrumb: `Limbah B3 / Pencatatan Limbah B3`
- Kolom database utama (3 model):
  - `B3WasteType` (`b3_waste_types`): id, siteId, kode (VarChar 20), nama (VarChar 200), unique [siteId, kode]
  - `B3WasteRecord` (`b3_waste_records`): id, siteId, jenisLimbahId, tanggalMasuk (Date), sumberLimbah, jumlahMasuk (Decimal 10,2), maksimalPenyimpanan (90/180), tanggalBatas (Date, computed), petugasPenanggungJawab
  - `B3WasteOutRecord` (`b3_waste_out_records`): id, siteId, wasteRecordId, tanggalKeluar (Date), jumlahKeluar (Decimal 10,2), tujuanPenyerahan, nomorDokumen, vendorId (nullable, FK ke MasterVendor), petugasPenanggungJawab
- Backend routes:
  - `server/routes/b3WasteRecords.js` — CRUD limbah masuk + limbah keluar + export Excel
  - `server/routes/b3WasteTypes.js` — CRUD master jenis limbah B3
  - Mount: `/api/b3-waste/records` dan `/api/b3-waste/types` (requireAdminAuth, requireSiteIsolation internal)
- Middleware site isolation menggunakan pola `router.use(requireSiteIsolation({ modelType: 'per-site' }))` di dalam route file dengan helper `getSiteId(req)` yang membaca dari `req.query.siteId` (super admin) atau `req.admin.siteId` (admin biasa).
- Computed fields (server-side):
  - `sisaLimbah` = jumlahMasuk - SUM(outRecords.jumlahKeluar), presisi 2 desimal
  - `sisaHari` = tanggalBatas - today (hari)
  - `statusPenyimpanan`: normal / warning (1-14 hari) / overdue (<=0 hari), hanya berlaku jika sisaLimbah > 0
- Ekspor Excel (`server/lib/b3WasteExport.js`):
  - Baris pertama: nomor izin hardcoded "660.3/Per.TPLB3 144/VII/P3LH/DLH/2020"
  - 13 kolom: Jenis Limbah B3, Tanggal Masuk, Sumber Limbah, Jumlah Masuk, Maks Penyimpanan, Tanggal Batas, Tanggal Keluar, Jumlah Keluar, Tujuan Penyerahan, Nomor Dokumen, Sisa Limbah, Sisa Hari, Pengelola Pihak Ketiga
  - Format angka Indonesia (titik ribuan, koma desimal)
  - Record dengan banyak out-records: baris pertama tampilkan semua, baris berikutnya hanya kolom keluar
- Frontend components:
  - `src/pages/employeeData/pencatatanLimbahB3/PencatatanLimbahB3.jsx` — halaman utama dengan `EnhancedTable`, context menu klik kanan, visual indicator warning/overdue
  - `src/pages/employeeData/pencatatanLimbahB3/WasteRecordForm.jsx` — form dialog limbah masuk
  - `src/pages/employeeData/pencatatanLimbahB3/WasteOutRecordForm.jsx` — form dialog limbah keluar (dengan dropdown vendor dari Master Vendor)
  - `src/pages/masterData/masterDokumen/JenisLimbahB3Tab.jsx` — tab master jenis limbah di halaman Master Data Dokumen
- Service layer: `src/services/b3WasteService.js`
- Master Data Jenis Limbah B3 ditempatkan sebagai tab terakhir pada halaman `Master Data Dokumen`
- Kolom tabel utama (urutan prioritas): Jenis Limbah B3, Tgl Masuk, Sumber, Masuk (kg), Keluar (kg), Sisa (kg) [bold, hijau "Habis" jika 0], Sisa Hari [chip warning/overdue], Tgl Batas, Maks, Tgl Keluar, Tujuan, No Dokumen, Pengelola
- Tanggal disimpan ke Postgres kolom DATE sebagai UTC noon (T12:00:00Z) melalui helper `toDateOnly()` untuk mencegah timezone shift
- Frontend date input menggunakan local timezone (`getFullYear/getMonth/getDate`) untuk `max` dan formatting, bukan `toISOString()` yang bisa bergeser
- Validasi form: tanggal masuk min 2020-01-01 max hari ini, jumlah masuk 0.01-999999.99 presisi 2, maksimal penyimpanan enum [90, 180], jumlah keluar max = sisa limbah
- Field `petugasPenanggungJawab` auto-fill dari nama admin login, immutable setelah disimpan
- Field `kode` pada jenis limbah B3 immutable setelah disimpan
- Referential integrity: delete waste record ditolak jika punya out-records, delete jenis limbah ditolak jika masih digunakan

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
- Testing frontend:
  - `vitest`
  - `jsdom`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`

## Catatan Penting

- Template proyek yang tersedia saat ini sudah cocok dijadikan fondasi aplikasi admin/internal.
- `docs/llm-mui.md` sekarang menjadi referensi UI utama yang wajib dipakai untuk seluruh implementasi desain pada project ini.
- Detail final field, format print, dan approval matrix untuk modul bisnis lanjutan masih perlu dipastikan dari form atau dokumen resmi perusahaan.
- File ini adalah dokumen konteks proyek dan harus diperbarui seiring perkembangan implementasi.

## Aturan Pemeliharaan Dokumen Ini

- Dokumen ini menjadi referensi konteks utama selama pengembangan.
- Jika ada perubahan scope, struktur menu, keputusan teknis, atau modul baru, isi file ini harus diperbarui.
- Jika ada keputusan yang menggantikan keputusan lama, isi file ini harus disesuaikan agar tetap menjadi sumber konteks yang paling mutakhir.
