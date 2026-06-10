# Implementation Plan: Site Approval Workflow Config

## Overview

Replace the hardcoded `APPROVAL_STAGE_SEQUENCE` in `server/lib/leaveWorkflow.js` with a database-driven per-site approval configuration. This involves creating a new Prisma model, migration with seed data, CRUD + bulk API endpoints, modifying the workflow engine, and building a Super Admin configuration UI page.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Add SiteApprovalConfig model and modify JobLevel in Prisma schema
    - Add `approvalRank Int?` column to the `JobLevel` model
    - Add `siteApprovalConfigs SiteApprovalConfig[]` relation to `JobLevel` model
    - Add `siteApprovalConfigs SiteApprovalConfig[]` relation to `MasterSite` model
    - Create `SiteApprovalConfig` model with fields: id, siteId, jobLevelId, approvalRank (nullable), maxApprovalRank, createdAt, updatedAt
    - Add `@@unique([siteId, jobLevelId])`, `@@index([siteId])`, `@@index([jobLevelId])` constraints
    - Add foreign keys with `onDelete: Restrict, onUpdate: Cascade`
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.5, 2.6_

  - [x] 1.2 Create database migration with seed data
    - Generate Prisma migration SQL
    - Add `approval_rank` nullable integer column to `job_levels` table
    - Create `site_approval_configs` table with all columns, unique constraint, and foreign keys
    - Seed `site_approval_configs` for each existing MasterSite with the hardcoded hierarchy values (Staff: null/5, Foreman: 1/5, General Foreman: 2/5, Section Chief: 3/5, Dy. Dept. Manager: 4/5, Dept. Manager: 5/6, Site/Div. Manager: 6/6)
    - Update `job_levels.approval_rank` for known job level names (Foreman=1, General Foreman=2, Section Chief=3, Dy. Dept. Manager=4, Dept. Manager=5, Site/Div. Manager=6)
    - Ensure all operations run within a single transaction
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 1.3 Run Prisma generate to update the client
    - Run `npx prisma generate` to regenerate the Prisma client with new models
    - _Requirements: 2.1_

- [x] 2. Backend API — CRUD and Bulk endpoints
  - [x] 2.1 Create the site approval config route file with authorization middleware
    - Create `server/routes/siteApprovalConfigs.js`
    - Implement local `requireSuperAdmin` middleware that checks `req.admin.role === 'super_admin'` and returns HTTP 403 with message "Akses ditolak. Hanya Super Admin yang dapat mengelola konfigurasi approval."
    - _Requirements: 3.5_

  - [x] 2.2 Implement GET endpoints (list by site and get by id)
    - GET `/` — list configs for a site (query param `siteId`), include associated JobLevel name
    - GET `/:id` — get single config with associated JobLevel and MasterSite names
    - Return HTTP 404 with message "Konfigurasi approval tidak ditemukan." for non-existent id
    - _Requirements: 3.1, 3.11, 3.12_

  - [x] 2.3 Implement POST endpoint (create single config)
    - Validate `approvalRank` is null or positive integer, else return HTTP 400 "approvalRank harus berupa bilangan bulat positif atau kosong."
    - Validate `maxApprovalRank` is a required positive integer, else return HTTP 400 "maxApprovalRank harus berupa bilangan bulat positif."
    - Validate `siteId` exists in MasterSite, else return HTTP 400 "Site tidak ditemukan."
    - Validate `jobLevelId` exists in JobLevel, else return HTTP 400 "Job Level tidak ditemukan."
    - Check unique constraint on siteId + jobLevelId, else return HTTP 409 "Konfigurasi approval untuk site dan job level ini sudah ada."
    - Create and return the new record
    - _Requirements: 3.2, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 2.4 Implement PUT /:id endpoint (update single config)
    - Validate `approvalRank` and `maxApprovalRank` with same rules as POST
    - Return HTTP 404 if record not found
    - Update and return the record
    - _Requirements: 3.3, 3.7, 3.8, 3.12_

  - [x] 2.5 Implement DELETE /:id endpoint
    - Return HTTP 404 if record not found
    - Delete the record and return success response
    - _Requirements: 3.4, 3.12_

  - [x] 2.6 Implement PUT /bulk endpoint (replace all configs for a site)
    - Validate `siteId` exists, else return HTTP 400 "Site tidak ditemukan."
    - Check for duplicate `jobLevelId` values in entries array, else return HTTP 400 "Terdapat duplikasi Job Level dalam konfigurasi."
    - Validate each entry's `approvalRank` and `maxApprovalRank` values, reject entire request if any invalid
    - Delete all existing configs for the site and create new ones within a single transaction
    - Return the complete list of new SiteApprovalConfig records for the site
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.7 Register the route in server/index.js
    - Import `siteApprovalConfigsRouter` from `./routes/siteApprovalConfigs.js`
    - Register at `/api/master/site-approval-configs` with `requireAdminAuth` middleware
    - _Requirements: 3.1, 3.5_

  - [x] 2.8 Write unit tests for CRUD and bulk API endpoints
    - Test authorization (non-super_admin gets 403)
    - Test validation errors (invalid approvalRank, maxApprovalRank, missing site/jobLevel)
    - Test duplicate constraint (409)
    - Test successful CRUD operations
    - Test bulk replace transactional behavior
    - _Requirements: 3.1–3.12, 4.1–4.5_

- [x] 3. Checkpoint — Ensure API layer works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Workflow engine refactoring
  - [x] 4.1 Implement `mapJobLevelToStageType` helper function
    - Create helper in `server/lib/leaveWorkflow.js` that maps job level names to `LeaveStageType` enum values using case-insensitive matching
    - Handle known mappings: Foreman→FOREMAN, General Foreman→GENERAL_FOREMAN, Section Chief→SECTION_CHIEF, Dy. Dept. Manager→DY_DEPT_MANAGER, Dept. Manager→DEPT_MANAGER, Site/Div. Manager→SITE_DIV_MANAGER
    - Implement fallback: uppercase + underscore transformation for unknown names
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Refactor `resolveApprovalStages` to use SiteApprovalConfig
    - Query `SiteApprovalConfig` for requester's `siteId` + `jobLevelId`
    - If no config found, throw HTTP 400 "Konfigurasi approval belum diatur untuk site dan job level Anda. Hubungi administrator."
    - Get `requesterRank` (treat null as 0) and `maxApprovalRank` from config
    - Retain Foreman Group Shift logic when requester's approvalRank is null and has a group shift
    - Query all SiteApprovalConfig records for requester's site where `approvalRank > requesterRank` AND `approvalRank <= maxApprovalRank`
    - Group by distinct approvalRank values, ordered ascending
    - For each rank level, find employees in same site + department with matching job level IDs (excluding requester)
    - Assign stageType using `mapJobLevelToStageType`
    - If no approvers found, throw HTTP 400 "Tidak ada approver yang tersedia untuk site karyawan."
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.3_

  - [x] 4.3 Modify `findDepartmentApprovers` to accept jobLevelIds
    - Change function signature to accept `jobLevelIds` array instead of `jobLevelName`
    - Filter employees by `jobLevelId` in the provided array
    - _Requirements: 6.1, 6.4_

  - [x] 4.4 Remove hardcoded `APPROVAL_STAGE_SEQUENCE` and `getApprovalRank`
    - Remove the `APPROVAL_STAGE_SEQUENCE` constant
    - Remove the `getApprovalRank()` function
    - Ensure `getStageLabel()` remains unchanged
    - Ensure `LeaveStageType` enum is preserved
    - _Requirements: 8.1, 8.2, 8.3, 11.3, 11.4_

  - [x] 4.5 Write unit tests for the refactored workflow engine
    - Test config lookup success and failure cases
    - Test approver resolution with various rank configurations
    - Test Foreman Group Shift logic preservation
    - Test stage type assignment for known and unknown job level names
    - Test backward compatibility: seeded config produces same stages as old hardcoded logic
    - _Requirements: 5.1–5.3, 6.1–6.7, 7.1–7.3, 8.4, 11.1, 11.2_

- [x] 5. Checkpoint — Ensure workflow engine works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend — API service and configuration page
  - [x] 6.1 Create API service file for site approval config
    - Create `src/services/siteApprovalConfigService.js`
    - Implement `fetchConfigsBySite(siteId)` → GET `/api/master/site-approval-configs?siteId=...`
    - Implement `saveConfigsBulk(siteId, entries)` → PUT `/api/master/site-approval-configs/bulk`
    - _Requirements: 9.1, 9.5_

  - [x] 6.2 Create the SiteApprovalConfig page component
    - Create `src/pages/masterData/siteApprovalConfig/index.jsx`
    - Implement SiteSelector using MUI Autocomplete with MasterSite list
    - Implement ApprovalConfigTable showing all Job Levels with editable `approvalRank` (nullable integer) and `maxApprovalRank` (required positive integer) columns
    - Implement ApprovalChainPreview showing visual ordered list of approval stages based on configured ranks
    - Implement Save button that calls `saveConfigsBulk`
    - Show success notification "Konfigurasi approval berhasil disimpan." on successful save using notistack
    - Show API error messages on failure
    - Use local component state (useState) for config rows, loading, and selected site
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 6.3 Register route and add navigation menu item
    - Add lazy-loaded route in `src/utils/routes/index.jsx` at path `data-master/master-data-karyawan/site-approval-config`
    - Add sidebar menu item under "Master Data Karyawan" section, visible only when `admin.role === 'super_admin'`
    - Ensure non-super_admin users cannot access the page (redirect or access denied)
    - _Requirements: 9.9_

  - [x] 6.4 Write unit tests for the configuration page
    - Test site selector renders and loads sites
    - Test table displays job levels with config values
    - Test save button calls bulk API
    - Test error display on validation failure
    - Test access restriction for non-super_admin
    - _Requirements: 9.1–9.9_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The migration seeds data to maintain backward compatibility (Requirement 11)
- Existing leave requests (SUBMITTED/IN_APPROVAL) continue using stored approval records — no re-resolution needed
- The `LeaveStageType` enum and `getStageLabel` function are preserved unchanged

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7"] },
    { "id": 4, "tasks": ["2.8"] },
    { "id": 5, "tasks": ["4.1", "4.3"] },
    { "id": 6, "tasks": ["4.2"] },
    { "id": 7, "tasks": ["4.4"] },
    { "id": 8, "tasks": ["4.5"] },
    { "id": 9, "tasks": ["6.1"] },
    { "id": 10, "tasks": ["6.2", "6.3"] },
    { "id": 11, "tasks": ["6.4"] }
  ]
}
```
