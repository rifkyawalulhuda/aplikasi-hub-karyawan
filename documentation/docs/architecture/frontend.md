---
id: frontend
title: Arsitektur Frontend
sidebar_label: Frontend
---

# Arsitektur Frontend

Frontend dibangun dengan **React 18 + Vite**, dibagi menjadi dua area utama: Admin Desktop dan Portal Mobile Karyawan.

## Struktur Folder

```
app-karyawan/src/
├── components/          # Komponen yang dipakai di lebih dari satu area
│   ├── auth/            # Route guards (ProtectedRoute, PublicOnlyRoute)
│   ├── employeePortal/  # Komponen khusus portal karyawan
│   ├── layouts/         # Layout shell (MainLayout, EmployeeMobileLayout, dll)
│   ├── mainHeader/      # Header bar admin (logo, search, user menu)
│   ├── navbar/          # Navbar tab admin
│   └── footer/
├── contexts/            # React contexts (auth admin, auth karyawan, theme)
├── hocs/                # Higher-order components (lazy load, scroll top, dll)
├── pages/
│   ├── login/           # Halaman login admin
│   ├── dashboard/       # Dashboard admin
│   ├── masterData/      # Halaman-halaman Data Master
│   ├── employeeData/    # Data Karyawan, cuti, surat peringatan, dll
│   ├── unitData/        # Data Unit & lisensi unit
│   ├── adminNotifications/
│   └── employeeMobile/  # Portal Mobile Karyawan (/karyawan)
├── services/
│   ├── api.js           # apiRequest() — fetch + JWT admin
│   └── employeeApi.js   # employeeMeRequest() — fetch + JWT karyawan
├── store/               # Redux Toolkit (theme config)
└── utils/
    ├── routes/          # Router utama + semua route definitions
    └── employeePortal.js # Helpers portal karyawan
```

## Dua Area Terpisah

### Admin Desktop (`src/pages/` selain `employeeMobile/`)

- Route: `/`, `/dashboard`, `/data-master/*`, `/data-karyawan/*`, `/data-unit/*`, dll
- Auth: JWT admin via `requireAdminAuth` middleware, token disimpan di `localStorage`
- Layout: `MainLayout` dengan `Navbar` (tab navigasi horizontal) dan `MainHeader`
- Theme: MUI dengan dark/light mode via Redux

### Portal Mobile Karyawan (`src/pages/employeeMobile/`)

- Route: `/karyawan/*`
- Auth: JWT karyawan via `requireEmployeeAuth` middleware
- Layout: `EmployeeMobileLayout` (mobile-first, bottom navigation)
- PWA: installable via Vite PWA plugin

## Auth Flow

```
Admin Login
  → POST /api/auth/login
  → { accessToken, admin }
  → localStorage['hub-karyawan-auth']
  → apiRequest() membaca token dari localStorage
  → Authorization: Bearer <token>

Karyawan Login
  → POST /api/employee-auth/login
  → { accessToken, employee }
  → localStorage['hub-karyawan-employee-auth']
  → employeeMeRequest() membaca token
  → Authorization: Bearer <token>
```

## Routing

Semua route didefinisikan di `src/utils/routes/index.jsx`. Setiap halaman di-lazy load:

```js
const DashboardPage = withLazyLoadably(lazy(() => import('@/pages/dashboard')));
```

Route admin dilindungi oleh `ProtectedRoute`, route karyawan oleh `EmployeeProtectedRoute`.

## State Management

- **Redux Toolkit** — hanya untuk konfigurasi tema (dark/light mode, sticky header)
- **React Context** — auth state untuk admin dan karyawan
- **Local state (`useState`)** — state per komponen/halaman

## PWA (Portal Mobile Karyawan)

Portal karyawan dikonfigurasi sebagai PWA yang dapat diinstal:
- Service worker otomatis via `vite-plugin-pwa`
- Manifest di `public/manifest.webmanifest`
- Icon PWA di `public/icons/`
- Offline-ready untuk halaman yang sudah pernah dikunjungi
