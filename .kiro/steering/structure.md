---
inclusion: always
---

# Project Structure

Monorepo-style layout with a single application in `app-karyawan/`.

```
app-karyawan/
├── prisma/
│   ├── schema.prisma              # All models, enums, relations
│   └── migrations/                # Sequential SQL migration files
├── server/                        # Express.js backend (REST API, ESM)
│   ├── index.js                   # Entry point: route registration, CORS, global error handler
│   ├── config/                    # Static configuration (masterDataConfig.js)
│   ├── lib/                       # Shared business logic and services
│   ├── middleware/                # Auth and site-isolation middleware
│   └── routes/                    # Domain-based route handlers (one file per resource)
├── src/                           # React frontend
│   ├── App.jsx                    # Root: providers, router setup
│   ├── main.jsx                   # Vite entry point
│   ├── components/                # Reusable UI components (by concern)
│   ├── constants/                 # Static constants and enum mappings
│   ├── contexts/                  # React context providers (auth, site, theme)
│   ├── hooks/                     # Top-level custom hooks
│   ├── pages/                     # Page components organized by domain
│   ├── services/                  # API service layers (fetch wrappers)
│   ├── store/                     # Redux store and slices
│   ├── test/                      # Test setup (Vitest + jsdom)
│   └── utils/                     # Helpers, HOCs, hooks, routes, theme
├── scripts/                       # Dev utility scripts
├── public/                        # Static assets (PWA manifest, icons)
├── docker-compose.yml             # Local PostgreSQL
├── vite.config.js                 # Vite + PWA + proxy config
└── package.json                   # Dependencies and scripts
```

## Architecture Patterns

### Frontend

- **Domain-based pages**: `src/pages/` is split by domain — `employeeData/`, `masterData/`, `unitData/`, `employeeMobile/`. Each domain folder contains page components and sub-components.
- **Shared components**: `src/components/` groups reusable UI by concern (e.g., `dataTable/`, `formInput/`, `modal/`, `layouts/`).
- **Services layer**: `src/services/api.js` exports a default `apiRequest(path, options)` function. It auto-attaches the admin Bearer token from localStorage (key `hub-karyawan-auth`) unless the path is an employee-auth or login route. Domain-specific services import and wrap this function.
- **Site scoping**: Use `appendSiteIdParam(path, siteId)` from `src/services/api.js` to append `?siteId=` to API paths. The `useSiteApiRequest` hook and `siteContext` manage the active site.
- **State management**: Redux Toolkit for global UI state (theme only). React Context for auth (`authContext`, `employeeAuthContext`) and site (`siteContext`). Local state for forms.
- **Utils structure**: `src/utils/` contains sub-folders mapped to path aliases — `helpers/` (`@helpers`), `hooks/` (`@hooks`), `hocs/` (`@hocs`). HOCs use `with` prefix (e.g., `withLazyLoadably.jsx`).

### Backend

- **Route files**: One file per resource in `server/routes/`. Each exports a default `Router()` instance. Routes use a local `withAsync(handler)` wrapper for async error forwarding.
- **Validation**: Yup schemas defined inline in route files. Validation errors return `400` with `{ message }`.
- **Middleware chain**: Routes are mounted in `server/index.js` with middleware applied at mount level (e.g., `app.use('/api/master/sites', requireAdminAuth, requireSuperAdmin, sitesRouter)`).
- **Business logic**: Complex logic (workflows, email, push notifications) lives in `server/lib/`. Route handlers stay thin — validate, call lib, respond.
- **Global error handler**: Catches Prisma unique constraint (`P2002` → 409), foreign key (`P2003` → 409), custom `statusCode` errors, and falls back to 500.

### Database (Prisma)

- Table names use `@@map()` for snake_case (e.g., `@@map("master_karyawan")`).
- Model fields use camelCase. Enums are UPPER_CASE.
- Relations are explicit with `@relation` annotations.
- Migrations are sequential and named descriptively.

### API Response Conventions

- Success: return JSON body directly (object or array). 201 for creation, 204 (no body) for deletion.
- Error: return `{ message: "..." }` with appropriate HTTP status.
- All messages are in Indonesian.

## File Naming Rules

| Location | Convention | Examples |
|----------|-----------|----------|
| `src/pages/`, `src/components/` | PascalCase | `EmployeeDetail.jsx`, `DataTable.jsx` |
| `src/services/`, `src/utils/`, `src/hooks/` | camelCase | `api.js`, `dateUtils.js`, `useSiteApiRequest.js` |
| `src/utils/hocs/` | camelCase with `with` prefix | `withLazyLoadably.jsx` |
| `src/contexts/` | camelCase with `Context` suffix | `authContext.jsx`, `siteContext.jsx` |
| `server/routes/` | camelCase (plural resource name) | `employees.js`, `warningLetters.js` |
| `server/lib/` | camelCase (service/module name) | `leaveWorkflow.js`, `emailService.js` |
| `server/middleware/` | camelCase with `require` prefix | `requireAdminAuth.js`, `requireSiteIsolation.js` |

## Adding New Features Checklist

1. **Database**: Add/update model in `prisma/schema.prisma`, create migration with `npm run prisma:migrate`.
2. **Backend route**: Create `server/routes/{resource}.js`, export a Router, mount in `server/index.js` with appropriate middleware.
3. **Frontend service**: Add fetch wrapper in `src/services/` importing `apiRequest`.
4. **Page component**: Create domain folder under `src/pages/`, add route in `src/utils/routes/index.jsx`.
5. **Tests**: Backend unit tests co-located as `*.test.js` or in `__tests__/`. Frontend tests use Vitest + Testing Library.
