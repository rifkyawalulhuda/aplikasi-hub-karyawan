# Project Structure

The repository is a monorepo-style layout with a single application in `app-karyawan/`.

```
app-karyawan/
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Prisma schema (all models, enums, relations)
│   └── migrations/            # Sequential SQL migration files
├── server/                    # Express.js backend (REST API)
│   ├── index.js               # Server entry point, route registration, CORS, error handling
│   ├── config/                # Server configuration (master data config)
│   ├── lib/                   # Shared libraries (prisma client, email, sessions, workflows)
│   ├── middleware/            # Auth middleware (requireAdminAuth, requireEmployeeAuth)
│   └── routes/                # Route handlers organized by domain
├── src/                       # React frontend
│   ├── App.jsx                # Root component (providers, router)
│   ├── main.jsx               # Entry point
│   ├── assets/                # CSS, icons, images
│   ├── components/            # Reusable UI components
│   ├── constants/             # Static constants and enums
│   ├── contexts/              # React context providers (auth, theme)
│   ├── hooks/                 # Custom hooks (top-level)
│   ├── pages/                 # Page components organized by domain
│   ├── services/              # API service layers (fetch wrappers)
│   ├── store/                 # Redux store and slices
│   ├── test/                  # Test setup files
│   └── utils/                 # Utilities, helpers, HOCs, hooks, routes, theme
├── scripts/                   # Dev utility scripts (workflow, password hashing)
├── public/                    # Static assets served by Vite
├── docker-compose.yml         # Local PostgreSQL setup
├── vite.config.js             # Vite + PWA + proxy configuration
└── package.json               # Dependencies and scripts
```

## Architecture Patterns

- **Frontend**: Pages are organized by domain (`employeeData/`, `masterData/`, `unitData/`, `employeeMobile/`). Each page folder typically contains the page component and related sub-components.
- **Backend**: Routes are domain-based files in `server/routes/`. Business logic lives in `server/lib/`. Auth is handled via middleware.
- **API Convention**: All API routes are prefixed with `/api/`. Admin routes require `requireAdminAuth` middleware. Employee self-service routes use `requireEmployeeAuth`.
- **Database**: Prisma schema uses `@@map()` for snake_case table names. Models use camelCase field names. Enums are UPPER_CASE.
- **Auth**: Dual auth system — admin auth (token-based via `MasterAdmin`) and employee auth (separate context and session).
- **State Management**: Redux Toolkit for global UI state (theme). React Context for auth state. Local component state for forms.
- **File naming**: Components use PascalCase filenames. Utilities, services, routes, and server files use camelCase.
