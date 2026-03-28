# TestSprite PRD

## Project

- Name: `Hub Karyawan`
- Active app folder: `app-karyawan`
- Stack:
  - React + Vite
  - Material UI
  - Express API
  - Prisma + PostgreSQL
- App type:
  - Admin desktop web
  - Mobile PWA under `/karyawan`

## Local Run

- Install dependency:
  - `npm install`
- Run frontend + backend together:
  - `npm run dev:full`
- Frontend URL:
  - `http://localhost:5173`
- Backend URL:
  - `http://localhost:4000/api`

## Seed Data

- Prepare sample login:
  - `npm run prisma:seed:login`
- Admin:
  - NIK: `EMP-ADMIN-001`
  - Password: `admin123`
- Employee PWA:
  - NIK / Employee No: `EMP-USER-001`
  - Password: `user123`

## Product Scope To Test

### Admin Desktop

- Login admin
- Open master data pages
- Search/filter table list
- Add/edit/delete simple master data
- Import Excel flows for master pages that already support import
- Open employee data pages without layout break

### Mobile PWA

- Login employee
- Dashboard opens correctly
- Profile page loads
- Leave Center loads
- Submit leave request flow
- Notification panel opens and remains usable

## Priority Test Areas

### P0

- Admin login works with seeded account
- Employee PWA login works with seeded employee
- Protected routes redirect unauthenticated user to login
- Core layout renders without blank page or fatal JS error

### P1

- `Master Unit`:
  - list renders
  - download template works
  - import dialog opens
- `Master Vendor`:
  - list renders
  - add vendor works with only required fields
  - `Nomor Telfon` and `Email` optional
  - download template works
  - imported template includes:
    - `Nama Vendor`
    - `Jenis Vendor`
    - `Alamat`
    - `Nama PIC`
    - `Nomor Telepon`
    - `Email`
    - `Detail Lainnya`
- `Master Hari Libur`:
  - download template works
  - import dialog opens
- `Master Group Shift`:
  - import dialog opens
  - template download works

### P2

- Mobile leave request:
  - page opens
  - date picker works
  - replacement dropdown loads or shows clear empty state
  - save button state is correct
- Notification icon:
  - unread badge remains visible
  - active state appears when panel is open

## Functional Rules To Validate

### Master Vendor

- `Nama Vendor` required
- `Jenis Vendor` required
- `Alamat` required
- `Nama PIC` required
- `Nomor Telfon` optional
- `Email` optional
- `Detail Lainnya` optional
- `Jenis Vendor` Excel template must provide dropdown values:
  - `Consumable`
  - `Building`
  - `Trucking`
  - `Jasa`
  - `Warehousing`
  - `Disposable`
  - `Lainnya`
- Import should accept blank `Nomor Telepon` and blank `Email`
- Duplicate vendor name should be rejected case-insensitively

### Master Hari Libur

- Template download should return valid Excel file
- `Tanggal` column should support `DD/MM/YYYY`

### Mobile Leave Request

- Replacement candidate list depends on department, group shift, and job role rules
- If no valid replacement candidate exists, request cannot be submitted
- Conflicting replacement candidates should not appear in dropdown

## Non-Functional Expectations

- No fatal console errors on tested pages
- No broken dialog buttons
- No overlapping critical text on mobile leave form
- Import dialogs should show clear success or error notification

## Suggested First TestSprite Prompt

Use this project PRD to generate end-to-end tests for the local app at `http://localhost:5173`.

Focus on:

1. Admin login with seeded account.
2. Employee PWA login with seeded account.
3. Master Unit template download and import dialog.
4. Master Vendor create flow, template download, and optional phone/email import behavior.
5. Master Hari Libur template download.
6. Mobile leave request page usability and replacement dropdown behavior.

Reject tests that require unavailable external email inboxes or real push delivery. Validate visible UI state and API-backed flows only.
