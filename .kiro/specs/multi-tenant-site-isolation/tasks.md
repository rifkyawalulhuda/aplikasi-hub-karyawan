# Implementation Plan: Multi-Tenant Site Isolation

## Overview

This plan implements site-based multi-tenancy for Aplikasi Hub Karyawan. The implementation follows a bottom-up approach: database schema first, then middleware/auth layer, then route handlers, then frontend. Each step builds incrementally on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Add MasterSite model to Prisma schema and update related models
    - Add `MasterSite` model with `id`, `name` (unique, VarChar(100)), `createdAt`, `updatedAt` mapped to `master_sites`
    - Add `siteId` foreign key to Employee (required, onDelete: Restrict, onUpdate: Cascade), replacing `siteDiv`
    - Add `siteId` foreign key to MasterGroupShift, MasterUnit, MasterVendor, EmployeeTraining (required, onDelete: Restrict, onUpdate: Cascade)
    - Add nullable `siteId` foreign key to MasterAdmin (onDelete: SetNull, onUpdate: Cascade)
    - Add `@@index([siteId])` to all modified models
    - Add relation fields on MasterSite (employees, admins, groupShifts, units, vendors, trainings)
    - Run `npx prisma generate` to update the Prisma client
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.2 Create Prisma migration with data migration logic
    - Create migration SQL that: creates `master_sites` table, seeds "CLC" record, adds nullable `site_id` columns, updates all existing records to CLC's id, sets lowest-id admin to `super_admin` with null `siteId`, applies NOT NULL constraints (except MasterAdmin), adds foreign keys, drops `site_div` from employees, adds indexes
    - Ensure entire migration runs within a single transaction (BEGIN/COMMIT)
    - Verify rollback restores `site_div` column and removes all `site_id` columns
    - _Requirements: 2.7, 2.8, 2.9, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

- [x] 2. Checkpoint - Ensure schema migration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Authentication and middleware layer
  - [x] 3.1 Enhance JWT token generation to include siteId
    - Modify `server/lib/adminSession.js` `createAdminAccessToken` to include `siteId` (null for super_admin, integer for admin/user) in the JWT payload
    - Ensure payload includes: `sub`, `employeeId`, `role`, `siteId`, `tokenVersion`, `type`, `iat`, `exp`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.2 Enhance JWT token verification with site context validation
    - Modify `verifyAdminAccessToken` in `server/lib/adminSession.js` to reject tokens where role is "admin" or "user" but `siteId` is null
    - Return HTTP 401 with message "Konteks site tidak valid." for invalid site context
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 3.3 Update requireAdminAuth middleware to attach siteId to req.admin
    - Modify `server/middleware/requireAdminAuth.js` to include `siteId` from the admin DB record in `req.admin`
    - Ensure `req.admin` contains: `id`, `role`, `employeeId`, `siteId`, `employee`
    - _Requirements: 4.4_

  - [x] 3.4 Create requireSiteIsolation middleware
    - Create `server/middleware/requireSiteIsolation.js` as a factory function accepting `{ modelType: 'per-site' | 'shared' }`
    - For `shared` modelType: set `req.siteFilter = {}` and pass through
    - For `per-site` + super_admin: set `req.siteFilter = {}` and `req.isSuperAdmin = true`
    - For `per-site` + admin/user with valid siteId: set `req.siteFilter = { siteId }` and `req.isSuperAdmin = false`
    - For `per-site` + admin/user with null siteId: return HTTP 403 "Akses ditolak. Admin belum memiliki site yang ditugaskan."
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 3.5 Create requireSuperAdmin route guard
    - Create a reusable middleware function that checks `req.admin.role === 'super_admin'` and returns HTTP 403 "Akses ditolak. Hanya Super Admin yang dapat mengelola Site." if not
    - _Requirements: 9.5, 10.3_

  - [x]* 3.6 Write property tests for JWT and middleware
    - **Property 8: JWT Site Context Correctness**
    - **Property 9: Token Validation Rejects Invalid Tokens**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7**

  - [x]* 3.7 Write property tests for site isolation middleware
    - **Property 6: Site-Scoped Query Filtering**
    - **Property 7: Super Admin Bypass**
    - **Property 10: Cross-Site Access Denied**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 4. Site CRUD management API
  - [x] 4.1 Create site management routes (server/routes/sites.js)
    - Implement `POST /api/master/sites` — validate name (min 1 non-whitespace, max 100 chars, unique), create MasterSite record
    - Implement `GET /api/master/sites` — return all sites with admin count and employee count
    - Implement `PUT /api/master/sites/:id` — validate name, update site record; return 404 if not found
    - Implement `DELETE /api/master/sites/:id` — delete if no references; return 409 if referenced, 404 if not found
    - Apply `requireSuperAdmin` guard to all endpoints
    - Use Yup for name validation schema
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x]* 4.2 Write property tests for site name validation and uniqueness
    - **Property 1: Site Name Validation**
    - **Property 2: Site Name Uniqueness**
    - **Property 3: Referential Integrity on Site Deletion**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6, 9.1, 9.4, 9.6**

- [x] 5. Role system and admin management
  - [x] 5.1 Update admin CRUD routes with role validation and site assignment
    - Validate role field accepts only "super_admin", "admin", "user"; reject others with validation error
    - Require non-null `siteId` for role "admin" or "user" on create/update; reject with "Site wajib dipilih untuk role yang dipilih."
    - When promoting to "super_admin", set `siteId` to null
    - Prevent super_admin from demoting themselves; return HTTP 400 "Super Admin tidak dapat menurunkan role diri sendiri."
    - On site assignment change, increment `tokenVersion` to invalidate existing sessions
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 10.1, 10.2, 10.4, 10.5, 10.6_

  - [x]* 5.2 Write property tests for role validation and site assignment
    - **Property 4: Role Value Validation**
    - **Property 5: Site-Scoped Admin Requires Non-Null SiteId**
    - **Property 17: Token Version Increment on Site Change**
    - **Property 18: Promotion to Super Admin Nullifies SiteId**
    - **Validates: Requirements 3.1, 3.3, 3.5, 3.6, 10.2, 10.5**

- [x] 6. Checkpoint - Ensure middleware and admin management work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Per-site data route handlers
  - [x] 7.1 Update employee routes with site isolation pattern
    - Apply `requireSiteIsolation({ modelType: 'per-site' })` middleware to employee routes
    - LIST: add `...req.siteFilter` to where clause; include `site` relation for super_admin
    - DETAIL: verify `record.siteId === req.admin.siteId` for non-super_admin; return 403 if mismatch
    - CREATE: auto-assign `siteId` from `req.admin.siteId` for site-scoped admins; require explicit `siteId` for super_admin
    - UPDATE: strip `siteId` from update payload for site-scoped admins; verify ownership before update
    - DELETE: verify ownership before delete
    - IMPORT (Excel): auto-assign `siteId` to all imported records for site-scoped admins
    - EXPORT (Excel): filter by `req.siteFilter`
    - For super_admin: include Site name in employee list response
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [x] 7.2 Update MasterGroupShift routes with site isolation pattern
    - Apply `requireSiteIsolation({ modelType: 'per-site' })` middleware
    - LIST: filter by `req.siteFilter`
    - CREATE: auto-assign `siteId` for site-scoped admins; require explicit `siteId` for super_admin; validate siteId references existing MasterSite
    - UPDATE: preserve original `siteId`, verify ownership
    - DELETE: verify ownership
    - _Requirements: 7.1, 7.2, 7.9, 7.10, 7.11, 7.12_

  - [x] 7.3 Update MasterUnit routes with site isolation pattern
    - Apply same pattern as MasterGroupShift
    - _Requirements: 7.3, 7.4, 7.9, 7.10, 7.11, 7.12_

  - [x] 7.4 Update MasterVendor routes with site isolation pattern
    - Apply same pattern as MasterGroupShift
    - _Requirements: 7.5, 7.6, 7.9, 7.10, 7.11, 7.12_

  - [x] 7.5 Update EmployeeTraining routes with site isolation pattern
    - Apply same pattern as MasterGroupShift
    - _Requirements: 7.7, 7.8, 7.9, 7.10, 7.11, 7.12_

  - [x]* 7.6 Write property tests for per-site data isolation
    - **Property 12: Auto-Assignment of SiteId on Creation**
    - **Property 13: SiteId Preserved on Update by Site-Scoped Admin**
    - **Property 14: Super Admin Requires Explicit SiteId for Per-Site Creation**
    - **Validates: Requirements 7.2, 7.4, 7.6, 7.8, 7.9, 7.10, 7.12, 11.4, 11.5, 11.7, 11.8**

- [x] 8. Shared master data routes
  - [x] 8.1 Apply shared model type middleware to existing master data routes
    - Apply `requireSiteIsolation({ modelType: 'shared' })` to Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, MasterDokKaryawan, MasterCutiKaryawan, MasterHoliday routes
    - Verify no `siteId` filtering is applied to these routes
    - Ensure all authenticated admins can CRUD shared data regardless of role/site
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x]* 8.2 Write property test for shared master data access
    - **Property 11: Shared Master Data Accessible Without Site Filter**
    - **Validates: Requirements 5.6, 6.1, 6.4, 14.2**

- [x] 9. Leave approval site isolation
  - [x] 9.1 Update leave approval workflow with site boundary enforcement
    - Modify `server/lib/leaveApprovalWorkflow.js` to filter approvers by `siteId` matching the leave requester's `siteId`
    - Reject leave submission if no eligible approver found within the requester's site
    - Validate approver's `siteId` matches requester's `siteId` on assignment
    - Filter leave request views by admin's `siteId` for site-scoped admins
    - Reject approve/reject actions if admin's `siteId` differs from employee's `siteId`
    - Allow super_admin to view all leave requests without filtering
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x]* 9.2 Write property test for leave approval site boundary
    - **Property 15: Leave Approval Site Boundary**
    - **Validates: Requirements 8.1, 8.3, 8.5**

- [x] 10. Global search and notifications site scoping
  - [x] 10.1 Update global search with site scoping
    - Modify `server/routes/globalSearch.js` to apply `siteId` filter to employee-related queries for site-scoped admins
    - Return shared master data results without site filtering
    - For super_admin: include Site name in subtitle of employee-related results
    - For site-scoped admin with no siteId: return empty results array
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 10.2 Update notifications with site scoping
    - Modify `server/routes/notifications.js` to filter notifications by employee's `siteId` for site-scoped admins
    - Allow super_admin to see all notifications without filtering
    - For admin/user with no siteId: return empty notification list with HTTP 200
    - Mark-as-read operations: verify notification belongs to employee within admin's site
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x]* 10.3 Write property tests for global search and notification scoping
    - **Property 19: Global Search Site Scoping**
    - **Property 20: Notification Site Scoping**
    - **Validates: Requirements 14.1, 14.5, 15.1, 15.2, 15.5**

- [x] 11. Checkpoint - Ensure all backend functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Login response and route registration
  - [x] 12.1 Update login response to include site context
    - Modify login endpoint to include `siteId` and `siteName` in the user response object
    - Include `site` relation when fetching admin record during login
    - _Requirements: 4.1, 4.2_

  - [x] 12.2 Register site routes and wire middleware in server/index.js
    - Register `sites.js` routes at `/api/master/sites` with `requireAdminAuth` and `requireSuperAdmin`
    - Update existing route registrations to include `requireSiteIsolation` middleware with appropriate `modelType`
    - Ensure per-site routes use `modelType: 'per-site'` and shared routes use `modelType: 'shared'`
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

- [x] 13. Frontend site context and UI
  - [x] 13.1 Create SiteContext provider (src/contexts/siteContext.jsx)
    - Create context that provides `currentSiteId`, `siteName`, `isSuperAdmin`, `selectedSiteId`, `setSelectedSiteId`
    - For site-scoped admins: fixed site from auth context
    - For super_admin: selectable site with "All Sites" default, persisted in sessionStorage
    - Wrap app with SiteProvider in App.jsx
    - _Requirements: 12.3, 12.4_

  - [x] 13.2 Create Site Selector component for Super Admin
    - Create a dropdown/select component in the AppBar for super_admin
    - Fetch sites from `GET /api/master/sites`
    - Include "Semua Site" (All Sites) option as default
    - Persist selection in sessionStorage across page navigations
    - Pass `siteId` query parameter on API calls when a specific site is selected
    - _Requirements: 12.2, 12.3, 12.4_

  - [x] 13.3 Create Site Label display for Site Admin
    - Display assigned site name in AppBar adjacent to user info for role "admin" or "user"
    - Read site name from auth context (login response)
    - _Requirements: 12.1_

  - [x] 13.4 Create Site Management page (Super Admin only)
    - Create page at appropriate route with DataGrid listing all sites
    - Columns: Site name, admin count, employee count
    - CRUD dialogs: create/edit with name validation, delete with confirmation
    - Hide Site management nav item for non-super_admin roles
    - _Requirements: 12.5, 12.6_

  - [x] 13.5 Update employee list to show Site column for Super Admin
    - Add "Site" column to employee DataGrid visible only when role is "super_admin"
    - Display site name from the employee's site relation
    - _Requirements: 12.7_

  - [x] 13.6 Update auth context to store site information from login response
    - Store `siteId` and `siteName` from login response in auth state
    - Make site info available to all components via auth context
    - _Requirements: 12.1, 12.2_

- [x] 14. Checkpoint - Ensure frontend and backend integration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Final integration and cleanup
  - [x] 15.1 Wire Site selector filtering into API service calls
    - Update API service layer to include `siteId` query parameter when super_admin has selected a specific site
    - Ensure "All Sites" selection sends no siteId parameter
    - _Requirements: 12.3, 12.4_

  - [x]* 15.2 Write unit tests for frontend site components
    - Test SiteContext provider behavior for different roles
    - Test Site Selector renders only for super_admin
    - Test Site Label renders for site-scoped admins
    - Test Site Management page CRUD operations
    - _Requirements: 12.1, 12.2, 12.5, 12.6_

  - [x]* 15.3 Write property test for site management access control
    - **Property 16: Site Management Restricted to Super Admin**
    - **Validates: Requirements 9.5, 10.3**

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The migration (task 1.2) is the most critical step — test on a copy of the database first
- All error messages are in Indonesian (Bahasa Indonesia) as per project convention
- The project uses ESM modules (`import`/`export`) throughout
- Use fast-check library for property-based tests with Vitest

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5"] },
    { "id": 4, "tasks": ["3.6", "3.7", "4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1"] },
    { "id": 6, "tasks": ["5.2", "7.1", "7.2", "7.3", "7.4", "7.5", "8.1"] },
    { "id": 7, "tasks": ["7.6", "8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "10.1", "10.2"] },
    { "id": 9, "tasks": ["10.3", "12.1", "12.2"] },
    { "id": 10, "tasks": ["13.1", "13.6"] },
    { "id": 11, "tasks": ["13.2", "13.3", "13.4", "13.5"] },
    { "id": 12, "tasks": ["15.1"] },
    { "id": 13, "tasks": ["15.2", "15.3"] }
  ]
}
```
