---
inclusion: always
---

# Tech Stack & Conventions

## Frontend

- React 18 with JSX — no TypeScript
- Vite 4 — bundler, dev server, PWA plugin
- MUI v5 (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid` v6)
- Redux Toolkit — global state (theme only; use React Context for auth/site)
- React Router v6 — client-side routing
- Formik + Yup — form handling and validation
- notistack — snackbar notifications
- ApexCharts (`react-apexcharts`) — data visualization

## Backend

- Express.js v4 — REST API (ESM modules)
- Prisma ORM v6 — database access and migrations
- PostgreSQL 16 — primary database
- nodemailer — email delivery
- web-push — push notifications
- multer v2 — file uploads
- exceljs — Excel import/export
- helmet + express-rate-limit — security hardening

## Dev Tools

- ESLint 8 — Airbnb config + Prettier plugin
- Prettier — tabs (width 4), single quotes, trailing commas, semicolons, 120 print width
- Vitest 4 — unit testing (jsdom, globals enabled)
- Testing Library — `@testing-library/react` + `@testing-library/user-event`
- nodemon — backend auto-restart
- concurrently — run frontend + backend together
- Docker Compose — local PostgreSQL

## Code Style Rules

When generating or editing code, follow these rules exactly:

- **Indentation**: tabs, width 4
- **Quotes**: single quotes everywhere
- **Semicolons**: always
- **Trailing commas**: all (including function params)
- **Print width**: 120 characters
- **Bracket spacing**: yes (`{ foo }` not `{foo}`)
- **End of line**: auto
- **Module system**: ESM (`import`/`export`) in both frontend and backend
- **No TypeScript** — all files are `.js` or `.jsx`
- **`no-console`**: allowed (rule disabled)
- **`prop-types`**: not enforced (rule disabled)
- **`jsx-props-no-spreading`**: allowed
- **`no-array-index-key`**: allowed

## Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@` | `src/` |
| `@helpers` | `src/utils/helpers/` |
| `@hooks` | `src/utils/hooks/` |
| `@hocs` | `src/utils/hocs/` |

Use these aliases in imports. They are configured in Vite, ESLint, and jsconfig.

## Commands

All commands run from `app-karyawan/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run dev:server` | Express backend via nodemon (port 4000) |
| `npm run dev:full` | Both frontend + backend concurrently |
| `npm run build` | Production build |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run (CI) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:studio` | Prisma Studio GUI |
| `npm run db:up` | Start local PostgreSQL (Docker) |
| `npm run db:down` | Stop local PostgreSQL |

## Key Configuration

- Vite proxies `/api` → `http://localhost:4000` in dev mode.
- Vite dev server binds to `0.0.0.0` (accessible on LAN).
- Vitest uses jsdom environment with global test functions (`describe`, `it`, `expect`, `vi`).
- Test setup file: `src/test/setup.js`.
- Environment variables prefixed with `VITE_` are exposed to the frontend.
- PWA service worker imports `push-sw.js` for push notification handling.
- API routes use `NetworkOnly` caching strategy (no offline API caching).
