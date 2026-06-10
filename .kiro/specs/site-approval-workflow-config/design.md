# Design Document

## Overview

This design replaces the hardcoded `APPROVAL_STAGE_SEQUENCE` array in `server/lib/leaveWorkflow.js` with a database-driven per-site approval configuration. A new `SiteApprovalConfig` model stores the approval hierarchy per site, and the workflow engine queries this table at runtime to resolve approval chains dynamically.

## Architecture

### Data Layer

#### New Prisma Model: SiteApprovalConfig

```prisma
model SiteApprovalConfig {
  id              Int        @id @default(autoincrement())
  siteId          Int
  jobLevelId      Int
  approvalRank    Int?
  maxApprovalRank Int
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  site            MasterSite @relation(fields: [siteId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  jobLevel        JobLevel   @relation(fields: [jobLevelId], references: [id], onDelete: Restrict, onUpdate: Cascade)

  @@unique([siteId, jobLevelId])
  @@index([siteId])
  @@index([jobLevelId])
  @@map("site_approval_configs")
}
```

#### Modified Model: JobLevel

Add `approvalRank Int?` column and a relation to `SiteApprovalConfig[]`.

```prisma
model JobLevel {
  id                   Int                  @id @default(autoincrement())
  name                 String               @unique @db.VarChar(255)
  approvalRank         Int?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  employees            Employee[]
  siteApprovalConfigs  SiteApprovalConfig[]

  @@map("job_levels")
}
```

#### Modified Model: MasterSite

Add relation to `SiteApprovalConfig[]`.

```prisma
model MasterSite {
  // ... existing fields ...
  siteApprovalConfigs SiteApprovalConfig[]
  // ... existing relations ...
}
```

### API Layer

#### New Route File: `server/routes/siteApprovalConfigs.js`

Registered at `/api/master/site-approval-configs` with `requireAdminAuth` + a custom `requireSuperAdmin` guard (reusing existing middleware pattern with a custom message for this domain).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List configs for a site (query: `siteId`) |
| GET | `/:id` | Get single config with relations |
| POST | `/` | Create single config |
| PUT | `/bulk` | Replace all configs for a site (transactional) |
| PUT | `/:id` | Update single config |
| DELETE | `/:id` | Delete single config |

#### Route Registration in `server/index.js`

```javascript
import siteApprovalConfigsRouter from './routes/siteApprovalConfigs.js';

// After existing master routes
app.use('/api/master/site-approval-configs', requireAdminAuth, siteApprovalConfigsRouter);
```

#### Authorization

The route file applies a local middleware that checks `req.admin.role === 'super_admin'` and returns HTTP 403 with the domain-specific message: "Akses ditolak. Hanya Super Admin yang dapat mengelola konfigurasi approval."

### Workflow Engine Changes

#### File: `server/lib/leaveWorkflow.js`

**Modified function: `resolveApprovalStages(tx, requester)`**

Current flow:
1. Get `requesterRank` from hardcoded `APPROVAL_STAGE_SEQUENCE` index
2. Iterate through `APPROVAL_STAGE_SEQUENCE` starting from `requesterRank + 1`
3. Find approvers by job level name match

New flow:
1. Query `SiteApprovalConfig` for the requester's `siteId` + `jobLevelId` → get `approvalRank` and `maxApprovalRank`
2. If no config found → throw HTTP 400 "Konfigurasi approval belum diatur..."
3. Retain Foreman Group Shift logic (unchanged) when requester's `approvalRank` is null and has a group shift
4. Query all `SiteApprovalConfig` records for the requester's `siteId` where `approvalRank > requesterApprovalRank` (treating null as 0) AND `approvalRank <= maxApprovalRank`
5. Group by distinct `approvalRank` values, ordered ascending
6. For each rank level, find employees in same site + department with that job level
7. Assign `stageType` by mapping job level name → `LeaveStageType` enum

**Removed/deprecated:**
- `APPROVAL_STAGE_SEQUENCE` constant
- `getApprovalRank()` function

**New helper function: `mapJobLevelToStageType(jobLevelName)`**

Maps job level names to `LeaveStageType` enum values using case-insensitive matching:
- "Foreman" → `FOREMAN`
- "General Foreman" → `GENERAL_FOREMAN`
- "Section Chief" → `SECTION_CHIEF`
- "Dy. Dept. Manager" → `DY_DEPT_MANAGER`
- "Dept. Manager" → `DEPT_MANAGER`
- "Site/Div. Manager" → `SITE_DIV_MANAGER`
- Fallback: uppercase + underscore transformation of the job level name

**Modified function: `findDepartmentApprovers(tx, options)`**

Instead of filtering by `jobLevelName`, filter by `jobLevelId` (or multiple job level IDs for a given rank). The function signature changes to accept `jobLevelIds` array instead of `jobLevelName`.

### Frontend Layer

#### New Page: `src/pages/masterData/siteApprovalConfig/index.jsx`

A dedicated page (not using the generic `MasterDataPage` pattern) because it requires:
- Site selector dropdown
- Editable table with all job levels per site
- Bulk save operation
- Visual approval chain preview

**Component structure:**
```
SiteApprovalConfigPage
├── SiteSelector (Autocomplete with MasterSite list)
├── ApprovalConfigTable (DataGrid or custom table)
│   ├── Job Level Name (read-only)
│   ├── Approval Rank (editable, nullable integer input)
│   └── Max Approval Rank (editable, required positive integer)
├── ApprovalChainPreview (visual ordered list of approval stages)
└── SaveButton (calls bulk API)
```

**State management:** Local component state (no Redux needed). Uses `useState` for config rows, loading states, and selected site.

**API service:** New file `src/services/siteApprovalConfigService.js` with functions:
- `fetchConfigsBySite(siteId)` → GET `/api/master/site-approval-configs?siteId=...`
- `saveConfigsBulk(siteId, entries)` → PUT `/api/master/site-approval-configs/bulk`

#### Route Registration

```jsx
// In src/utils/routes/index.jsx
const SiteApprovalConfigPage = withLazyLoadably(lazy(() => import('@/pages/masterData/siteApprovalConfig')));

// Inside ProtectedRoute > MainLayout routes:
<Route path="data-master/master-data-karyawan/site-approval-config" element={<SiteApprovalConfigPage />} />
```

#### Navigation

Add menu item in the admin sidebar under "Master Data Karyawan" section. The item is only visible when `admin.role === 'super_admin'`.

### Database Migration

#### Migration file: `prisma/migrations/YYYYMMDDHHMMSS_add_site_approval_config/migration.sql`

Operations (all within a single transaction):

1. `ALTER TABLE job_levels ADD COLUMN approval_rank INTEGER;`
2. `CREATE TABLE site_approval_configs (...)` with unique constraint and foreign keys
3. Seed `site_approval_configs` for each existing site using the hardcoded hierarchy values
4. `UPDATE job_levels SET approval_rank = ...` for known job level names

**Down migration:**
1. `DROP TABLE site_approval_configs;`
2. `ALTER TABLE job_levels DROP COLUMN approval_rank;`

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `approvalRank` | null OR positive integer (≥1) | "approvalRank harus berupa bilangan bulat positif atau kosong." |
| `maxApprovalRank` | required positive integer (≥1) | "maxApprovalRank harus berupa bilangan bulat positif." |
| `siteId` | must exist in MasterSite | "Site tidak ditemukan." |
| `jobLevelId` | must exist in JobLevel | "Job Level tidak ditemukan." |
| `siteId + jobLevelId` | unique combination | "Konfigurasi approval untuk site dan job level ini sudah ada." |

### Backward Compatibility Strategy

1. **Existing leave requests** (status SUBMITTED/IN_APPROVAL): The `EmployeeLeaveApproval` records already store the resolved approval chain. The workflow engine only resolves stages on new submissions — existing requests continue using their stored approvals.

2. **Migration seeding**: The migration seeds `SiteApprovalConfig` records that exactly replicate the hardcoded hierarchy, ensuring zero behavioral change for existing sites immediately after migration.

3. **Preserved functions**: `getStageLabel()` remains unchanged. The `LeaveStageType` enum is preserved. Only the resolution logic changes.

4. **`getApprovalRank()` removal**: After the new engine is active, this function is removed. Any callers (if any outside the workflow) would need to use the config-based lookup instead.

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `prisma/schema.prisma` | Modified | Add `approvalRank` to JobLevel, add SiteApprovalConfig model, add relations to MasterSite |
| `prisma/migrations/...` | New | Migration SQL for schema + seed data |
| `server/routes/siteApprovalConfigs.js` | New | CRUD + bulk API endpoints |
| `server/index.js` | Modified | Register new route |
| `server/lib/leaveWorkflow.js` | Modified | Replace hardcoded logic with config-based resolution |
| `src/pages/masterData/siteApprovalConfig/index.jsx` | New | Configuration UI page |
| `src/services/siteApprovalConfigService.js` | New | API service layer |
| `src/utils/routes/index.jsx` | Modified | Add route for new page |
| Sidebar navigation config | Modified | Add menu item for super_admin |

## Sequence Diagram: Leave Request Submission (New Flow)

```
Employee → API → leaveWorkflow.resolveApprovalStages(tx, requester)
  │
  ├─ Query SiteApprovalConfig WHERE siteId = requester.siteId AND jobLevelId = requester.jobLevelId
  │   └─ Not found? → throw 400 "Konfigurasi approval belum diatur..."
  │
  ├─ requesterRank = config.approvalRank ?? 0
  ├─ maxRank = config.maxApprovalRank
  │
  ├─ [If requesterRank === 0 AND hasGroupShift] → Add FOREMAN_GROUP_SHIFT stage
  │
  ├─ Query SiteApprovalConfig WHERE siteId = requester.siteId
  │   AND approvalRank > requesterRank AND approvalRank <= maxRank
  │   ORDER BY approvalRank ASC
  │
  ├─ For each distinct approvalRank level:
  │   ├─ Get jobLevelIds at this rank
  │   ├─ Find employees in same site + department with those jobLevelIds
  │   ├─ Map jobLevel.name → stageType
  │   └─ Add stage with approvers
  │
  └─ Return stages[] (or throw 400 if empty)
```
