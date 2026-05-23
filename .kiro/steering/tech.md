# Tech Stack

## Frontend
- **React 18** with JSX (no TypeScript)
- **Vite 4** — bundler and dev server
- **Material UI (MUI) v5** — component library (`@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`)
- **Redux Toolkit** — global state management
- **React Router v6** — client-side routing
- **Formik + Yup** — form handling and validation
- **notistack** — snackbar notifications
- **ApexCharts** — data visualization
- **Vite PWA plugin** — progressive web app with service worker and push notifications

## Backend
- **Express.js** — REST API server (ESM modules)
- **Prisma ORM v6** — database access and migrations
- **PostgreSQL 16** — primary database (Docker or remote)
- **nodemailer** — email delivery for workflow notifications
- **web-push** — push notification delivery
- **multer** — file upload handling
- **exceljs** — Excel import/export

## Dev Tools
- **ESLint** — Airbnb config + Prettier integration
- **Prettier** — code formatting (tabs, single quotes, 120 print width)
- **Vitest** — unit testing with jsdom environment
- **Testing Library** — React component testing (`@testing-library/react`)
- **nodemon** — backend auto-restart in development
- **concurrently** — run frontend + backend simultaneously
- **Docker Compose** — local PostgreSQL instance

## Common Commands

All commands run from the `app-karyawan/` directory:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run dev:server` | Start Express backend with nodemon (port 4000) |
| `npm run dev:full` | Start both frontend and backend concurrently |
| `npm run build` | Production build via Vite |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once (CI-friendly) |
| `npm run lint` | Run ESLint on src/ |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format all files with Prettier |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations (dev) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:up` | Start local PostgreSQL via Docker Compose |
| `npm run db:down` | Stop local PostgreSQL |

## Key Configuration

- Vite proxies `/api` requests to `http://localhost:4000` in development.
- Path aliases: `@` → `src/`, `@helpers` → `src/utils/helpers/`, `@hooks` → `src/utils/hooks/`, `@hocs` → `src/utils/hocs/`.
- Prettier: tabs, single quotes, trailing commas, 120 char width.
- ESM throughout — both frontend and backend use `import`/`export` syntax.
- Environment variables prefixed with `VITE_` are exposed to the frontend.
- Project MCP settings live in `.kiro/settings/mcp.json`; the Material UI docs server is configured there and launched on Windows via `cmd /c npx -y @mui/mcp@latest`.
