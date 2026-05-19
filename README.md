# Aplikasi Hub Karyawan

Aplikasi Hub Karyawan adalah aplikasi internal untuk mengelola master data karyawan, data administrasi SDM, dokumen/lisensi, cuti, notifikasi, dan portal mobile karyawan.

Project ini berasal dari template React/MUI, tetapi implementasi aktif saat ini ada di folder `app-karyawan`. Folder `complete-template` hanya dipertahankan sebagai referensi template/demo bawaan.

## Ringkasan

- Admin desktop web untuk HR/admin.
- Portal mobile karyawan berbasis PWA di route `/karyawan`.
- Backend API Express dalam project yang sama.
- Database PostgreSQL dengan Prisma ORM.
- Deploy publik utama memakai server lokal/Xubuntu + Cloudflare Tunnel.
- Mobile PWA juga disiapkan untuk opsi deploy terpisah ke Vercel.

## Tech Stack

### Frontend

- React 18
- Vite
- Material UI 5
- MUI X Data Grid
- React Router
- React Hook Form
- Notistack
- Vite PWA
- Vitest + Testing Library

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- CORS
- Multer
- ExcelJS
- Nodemailer
- Web Push

### Infrastruktur

- Docker Compose untuk PostgreSQL development
- PM2 untuk proses backend/frontend di server Linux
- Cloudflare Tunnel untuk publikasi domain lokal
- Vercel untuk opsi deploy PWA mobile

## Struktur Project

```text
.
|-- app-karyawan/        # source aktif aplikasi
|   |-- src/             # frontend React
|   |-- server/          # backend Express API
|   |-- prisma/          # schema, migration, seed
|   |-- public/          # aset publik, PWA icon, service worker
|   |-- scripts/         # helper workflow development
|   |-- docker-compose.yml
|   |-- package.json
|   `-- vite.config.js
|-- complete-template/   # referensi template bawaan
|-- docs/                # dokumentasi teknis dan operasional
|-- run-dev.bat          # helper run dev Windows
|-- run-dev.sh           # helper run dev Linux
`-- README.md
```

## Modul Utama

- `Data Master`: Master Karyawan, Master Admin, Work Location, Department, Job Role, Job Level, Group Shift, Dokumen, Cuti, Hari Libur, Unit, Vendor.
- `Data Karyawan`: Bimbingan & Pengarahan, Surat Peringatan/Skorsing/Teguran, Detail Karyawan, Lisensi & Sertifikasi, Cuti Karyawan.
- `Data Unit`: Lisensi & Sertifikasi Unit.
- `Portal Mobile Karyawan`: dashboard, profil, ubah password/kontak, cuti, approval cuti, catatan bimbingan/peringatan, pelatihan, notifikasi.
- `Notifikasi`: live alert admin, riwayat notifikasi, email workflow failure log, notifikasi PWA karyawan.

## Prasyarat Development

- Node.js dan npm
- Docker Desktop atau PostgreSQL lokal
- Prisma CLI melalui dependency project
- Git

Database development standar memakai Docker Compose:

- Database: `hub_karyawan`
- User: `postgres`
- Password: `postgres`
- Host port: `5434`
- Container: `app-karyawan-postgres`

## Setup Lokal

Masuk ke folder aplikasi aktif:

```bash
cd app-karyawan
```

Install dependency:

```bash
npm install
```

Salin dan sesuaikan environment:

```bash
cp .env.example .env
```

Untuk Docker development, gunakan `DATABASE_URL` seperti ini:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"
PORT=4000
VITE_API_BASE_URL="/api"
ADMIN_AUTH_SECRET="dev-admin-auth-secret"
EMPLOYEE_AUTH_SECRET="dev-employee-auth-secret"
APP_BASE_URL="https://aplikasi-hub.my.id"
EMPLOYEE_PWA_BASE_URL="https://pwa-karyawan.vercel.app"
```

Jalankan database:

```bash
npm run db:up
```

Generate Prisma Client dan siapkan schema:

```bash
npx prisma generate
npx prisma migrate dev
```

Jika perlu login awal:

```bash
npm run prisma:seed:login
```

Jika database lama masih berisi password plaintext, jalankan migrasi hash satu kali:

```bash
npm run security:hash-passwords
```

Jalankan frontend dan backend:

```bash
npm run dev:full
```

Atau jalankan dengan host terbuka untuk LAN/Cloudflare Tunnel:

```bash
npm run dev:full:host
```

URL lokal:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`
- API base lokal via Vite proxy: `/api`

## Script Penting

Semua script dijalankan dari `app-karyawan`.

| Script                         | Fungsi                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `npm run dev`                  | Menjalankan Vite frontend                                      |
| `npm run dev:host`             | Menjalankan Vite dengan host `0.0.0.0`                         |
| `npm run dev:server`           | Menjalankan Express API via nodemon                            |
| `npm run dev:full`             | Menjalankan frontend + backend                                 |
| `npm run dev:full:host`        | Menjalankan frontend host + backend                            |
| `npm run dev:server:status`    | Cek status backend dev                                         |
| `npm run dev:server:stop`      | Stop backend dev saja                                          |
| `npm run prisma:generate:safe` | Stop backend relevan, generate Prisma, lalu restart jika perlu |
| `npm run prisma:migrate`       | Menjalankan `prisma migrate dev`                               |
| `npm run prisma:studio`        | Membuka Prisma Studio                                          |
| `npm run prisma:seed:login`    | Membuat data login awal                                        |
| `npm run security:hash-passwords` | Meng-hash password plaintext lama di database               |
| `npm run build`                | Build frontend production                                      |
| `npm run preview`              | Preview build Vite                                             |
| `npm run server`               | Menjalankan backend Express sekali jalan                       |
| `npm run test`                 | Menjalankan Vitest watch                                       |
| `npm run test:run`             | Menjalankan Vitest satu kali                                   |
| `npm run lint`                 | Menjalankan ESLint                                             |
| `npm run db:up`                | Start PostgreSQL Docker                                        |
| `npm run db:down`              | Stop PostgreSQL Docker                                         |

## Workflow Development

- Gunakan `app-karyawan` sebagai folder kerja utama.
- Pakai `complete-template` hanya untuk referensi komponen/template.
- Untuk kerja harian, jalankan `npm run dev:full:host`.
- Jangan mematikan semua proses `node.exe` ketika Prisma terkunci.
- Jika Prisma perlu generate ulang, gunakan `npm run prisma:generate:safe`.
- Jika backend port `4000` bentrok, gunakan `npm run dev:server:status` lalu `npm run dev:server:stop`.
- UI baru wajib mengikuti pola Material UI project dan referensi `docs/llm-mui.md`.
- Tabel list desktop memakai pola global `EnhancedTable` berbasis MUI X Data Grid.
- Aksi row seperti Detail/Edit/Hapus/Print ditempatkan pada context menu baris jika memakai pola tabel global.
- Admin desktop dan PWA karyawan memiliki auth context, route guard, dan theme mode terpisah.

Detail workflow ada di [`docs/dev-workflow.md`](docs/dev-workflow.md).

## Database dan Prisma

- PostgreSQL development disediakan oleh `app-karyawan/docker-compose.yml`.
- Prisma schema ada di `app-karyawan/prisma/schema.prisma`.
- Primary key tabel memakai `id` auto increment.
- Kolom `NO` di UI hanya nomor urut tampilan, bukan field database.
- `Employee No` adalah identifier unik karyawan.
- `Master Hari Libur` menjadi sumber internal kalkulasi hari cuti, bukan API eksternal.

Jika `prisma migrate dev` mendeteksi drift karena migrasi sudah sempat membuat objek database, jangan langsung reset database. Ikuti panduan [`docs/TROUBLESHOOTING-PRISMA-MIGRATE.md`](docs/TROUBLESHOOTING-PRISMA-MIGRATE.md).

## Auth dan Session

- Admin login memakai data `Master Admin`.
- Input admin `NIK` dicocokkan ke `Master Admin -> Employee -> employeeNo`.
- Password admin memakai field password di `Master Admin`.
- Portal karyawan login memakai `Employee No` dan password dari tabel `Employee`.
- API self-service karyawan memakai bearer token dan endpoint `/api/employee-me/*`.
- Session frontend admin dan karyawan disimpan terpisah agar tidak saling bentrok.

## Endpoint Penting

- `GET /api/health`
- `POST /api/auth/*`
- `POST /api/employee-auth/login`
- `GET /api/employee-me/dashboard`
- `GET /api/employee-me/profile`
- `GET /api/employee-me/notifications`
- `GET/POST/PUT/DELETE /api/master/:resource`
- `GET/POST/PUT/DELETE /api/master/employees`
- `GET/POST/PUT/DELETE /api/master/admins`
- `GET/POST/PUT/DELETE /api/master/group-shifts`
- `GET/POST/PUT/DELETE /api/data-karyawan/employee-leaves`
- `GET/POST/PUT/DELETE /api/data-karyawan/guidance-records`
- `GET/POST/PUT/DELETE /api/data-karyawan/warning-letters`
- `GET /api/notifications/history`
- `GET /api/admin/email-workflow-failures`

## Workflow Cuti

Pengajuan cuti dilakukan dari Portal Mobile Karyawan dan diproses melalui approval bertingkat berdasarkan department, group shift, dan job level.

Urutan approval normal:

1. Foreman
2. General Foreman
3. Section Chief
4. Dy. Dept. Manager
5. Dept. Manager
6. Site/Div. Manager

Catatan rule utama:

- Approval dimulai dari satu tingkat di atas jabatan pengaju.
- Jika pengaju punya `Group Shift`, tahap awal memakai `Foreman Group Shift`.
- Jika approver pada level tertentu kosong, sistem melompati ke level berikutnya.
- Pengajuan harus memiliki saldo cukup.
- Pengganti selama cuti wajib minimal 1 dan maksimal 4 orang.
- Periode cuti tidak boleh overlap dengan request aktif atau approved.
- Request `APPROVED` dapat dicetak A4 dari admin dan PWA.

Referensi detail:

- [`docs/leave_approval_workflow.md`](docs/leave_approval_workflow.md)
- [`docs/workflow-alur-proses-cuti.drawio`](docs/workflow-alur-proses-cuti.drawio)

## Import, Export, dan Template Excel

Beberapa modul mendukung template Excel, import bulk, partial success, dan error report per baris:

- Master Karyawan
- Master Group Shift
- Master Dok PKB
- Master Cuti Karyawan
- Master Hari Libur
- Master Vendor
- Data Cuti Karyawan

Prinsip yang perlu dijaga:

- Template import harus mengikuti data master terbaru.
- Dropdown pada template tidak boleh diisi bebas jika field tersebut relasi.
- Data relasi seperti department, work location, job role, job level, group shift, jenis cuti, unit, dan vendor harus tersedia dulu di master.
- Snapshot teks dipakai di beberapa dokumen historis agar print tetap konsisten walau master berubah.

## Testing

Test frontend memakai Vitest dengan environment `jsdom`.

```bash
cd app-karyawan
npm run test:run
```

Area prioritas test:

- Login admin dengan seeded account.
- Login PWA karyawan dengan seeded account.
- Protected route redirect.
- Master data list/search/filter.
- Import dialog dan template download.
- Mobile leave request dan dropdown pengganti.
- Panel notifikasi admin/PWA.

Panduan PRD testing ada di [`docs/testsprite-prd.md`](docs/testsprite-prd.md).

## Build Production

```bash
cd app-karyawan
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

Jalankan backend:

```bash
npm run server
```

Preview frontend build:

```bash
npm run preview -- --host 0.0.0.0 --port 5173
```

## Deploy Lokal + Cloudflare Tunnel

Arsitektur publik utama:

- `https://aplikasi-hub.my.id` -> frontend lokal
- `https://www.aplikasi-hub.my.id` -> frontend lokal
- `https://pwa.aplikasi-hub.my.id` -> frontend/PWA lokal
- `https://api.aplikasi-hub.my.id` -> backend lokal

Environment penting:

```env
VITE_API_BASE_URL="https://api.aplikasi-hub.my.id/api"
APP_BASE_URL="https://aplikasi-hub.my.id"
EMPLOYEE_PWA_BASE_URL="https://pwa.aplikasi-hub.my.id"
CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,https://aplikasi-hub.my.id,https://www.aplikasi-hub.my.id,https://pwa.aplikasi-hub.my.id,https://pwa-karyawan*.vercel.app"
```

Cloudflare Tunnel mengarah ke:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:4000`

Panduan lengkap:

- [`docs/deploy-cloudflare-tunnel.md`](docs/deploy-cloudflare-tunnel.md)
- [`docs/deploy-xubuntu-server.md`](docs/deploy-xubuntu-server.md)

## Deploy di Xubuntu Server

Ringkasan alur server:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan/app-karyawan
npm install
npm run db:up
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start npm --name hub-karyawan-api -- run server
pm2 start npm --name hub-karyawan-web -- run preview -- --host 0.0.0.0 --port 5173
pm2 save
```

Cloudflare Tunnel dijalankan sebagai service systemd `hub-karyawan-cloudflared`.

Verifikasi:

```bash
curl http://127.0.0.1:4000/api/health
curl https://api.aplikasi-hub.my.id/api/health
pm2 status
```

Cara update aplikasi di server:

```bash
cd /home/rifky/Public/aplikasi-hub-karyawan/app-karyawan
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart hub-karyawan-api
pm2 restart hub-karyawan-web
```

## Opsi Deploy PWA ke Vercel

Mobile PWA dapat dideploy terpisah ke Vercel dengan root directory `app-karyawan`.

Catatan:

- `VITE_API_BASE_URL` harus mengarah ke `https://api.aplikasi-hub.my.id/api`.
- `EMPLOYEE_PWA_BASE_URL` dapat diarahkan ke `https://pwa-karyawan.vercel.app`.
- Host `*.vercel.app` diperlakukan sebagai host khusus PWA, sehingga root/non-`/karyawan` diarahkan ke `/karyawan/login`.
- `app-karyawan/vercel.json` menjaga deep-link SPA tetap fallback ke `index.html`.
- Backend CORS harus mengizinkan pola `https://pwa-karyawan*.vercel.app`.

## Dokumentasi di Folder `docs`

- [`docs/context-project.md`](docs/context-project.md): konteks utama project, scope modul, keputusan teknis, dan progress.
- [`docs/dev-workflow.md`](docs/dev-workflow.md): workflow development aman, terutama saat Prisma terkunci.
- [`docs/deploy-cloudflare-tunnel.md`](docs/deploy-cloudflare-tunnel.md): deploy full lokal lewat Cloudflare Tunnel.
- [`docs/deploy-xubuntu-server.md`](docs/deploy-xubuntu-server.md): deploy dan operasional di server Xubuntu dengan PM2 dan systemd.
- [`docs/TROUBLESHOOTING-PRISMA-MIGRATE.md`](docs/TROUBLESHOOTING-PRISMA-MIGRATE.md): panduan mengatasi drift/migrasi Prisma.
- [`docs/leave_approval_workflow.md`](docs/leave_approval_workflow.md): aturan approval cuti.
- [`docs/notion-aplikasi-hub-karyawan.md`](docs/notion-aplikasi-hub-karyawan.md): versi ringkasan dokumentasi internal/onboarding.
- [`docs/testsprite-prd.md`](docs/testsprite-prd.md): PRD testing dan prioritas skenario test.
- [`docs/llm-mui.md`](docs/llm-mui.md): referensi Material UI yang dipakai untuk implementasi UI.
- [`docs/uml-aplikasi-hub-karyawan.drawio`](docs/uml-aplikasi-hub-karyawan.drawio): diagram UML aplikasi.
- [`docs/workflow-alur-proses-cuti.drawio`](docs/workflow-alur-proses-cuti.drawio): diagram workflow cuti.
- [`docs/master-karyawan-mockup.drawio`](docs/master-karyawan-mockup.drawio): mockup halaman Master Karyawan.

## Catatan Operasional

- Akses publik melalui Cloudflare hanya hidup jika frontend, backend, database, dan tunnel aktif.
- Jangan arahkan DNS ke Cloudflare Pages untuk arsitektur full lokal; DNS harus route ke tunnel.
- Jika muncul `Origin DNS error (1016)`, cek record DNS lama dan route tunnel.
- Jika API publik bermasalah, cek `https://api.aplikasi-hub.my.id/api/health`.
- Jika frontend tidak bisa akses API, cek `VITE_API_BASE_URL` dan `CORS_ALLOWED_ORIGINS`.
- Jika port `4000`, `5173`, atau `5434` bentrok, cek proses yang memakai port tersebut sebelum restart service.
- Simpan `.env` server dengan permission terbatas, misalnya `chmod 600 .env` di Linux.

## Lisensi

Project template awal menggunakan lisensi MIT. Lihat [`LICENSE`](LICENSE).
