# Requirements Document

## Introduction

This feature implements site-based multi-tenancy for Aplikasi Hub Karyawan. The system manages multiple operational Sites (e.g., CLC, other mining/industrial locations) where each Site has its own set of employees and site-specific administrators. Site Admins can only view and manage data belonging to their assigned Site, while a Super Admin role has unrestricted access across all Sites. Shared master data (Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, MasterCutiKaryawan) remains global, while per-site data (MasterGroupShift, MasterUnit, MasterVendor, EmployeeTraining) is isolated by Site.

## Glossary

- **Site**: An operational location managed by Sankyu Indonesia (e.g., "CLC"). Each Site has its own employees and site-specific data.
- **MasterSite**: The database model representing a Site record, containing site name and metadata.
- **Site_Admin**: An administrator assigned to exactly one Site, with full CRUD privileges scoped to that Site's data only.
- **Super_Admin**: An administrator with unrestricted access to all Sites, all data, and all administrative functions including Site management and Admin-to-Site assignment.
- **Site_Isolation_Middleware**: Server middleware that filters data queries based on the authenticated admin's assigned Site.
- **Shared_Master_Data**: Master data tables (Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, MasterCutiKaryawan) accessible by all Sites without site filtering.
- **Per_Site_Data**: Data tables (MasterGroupShift, MasterUnit, MasterVendor, EmployeeTraining) that belong to a specific Site and are isolated from other Sites.
- **JWT_Payload**: The decoded content of the admin authentication token, containing admin identity, role, and site assignment.

## Requirements

### Requirement 1: MasterSite Data Model

**User Story:** As a Super Admin, I want a dedicated Site entity in the system, so that Sites can be created, managed, and referenced by other data models.

#### Acceptance Criteria

1. THE MasterSite SHALL store a site name (string, minimum 1 non-whitespace character, max 100 characters) and a createdAt/updatedAt timestamp pair.
2. WHEN a MasterSite record is created, THE System SHALL assign an auto-incrementing integer primary key.
3. THE MasterSite SHALL enforce uniqueness on the site name field (case-sensitive comparison).
4. IF a MasterSite record is created or updated with a site name that already exists, THEN THE System SHALL reject the operation and return an error message indicating the site name is already in use.
5. WHEN a MasterSite record is referenced by Employee, MasterGroupShift, MasterUnit, MasterVendor, or EmployeeTraining records via a required foreign key, THE System SHALL prevent deletion of that MasterSite record and return an error message indicating the record is still referenced.
6. IF a deletion attempt is made on a MasterSite record that has no referencing records, THEN THE System SHALL delete the record successfully.

### Requirement 2: Schema Migration for Site Foreign Keys

**User Story:** As a developer, I want existing models to reference MasterSite via a foreign key, so that site-based data isolation can be enforced at the database level.

#### Acceptance Criteria

1. THE Employee model SHALL replace the existing `siteDiv` string field with a required `siteId` integer foreign key referencing MasterSite, with ON DELETE Restrict and ON UPDATE Cascade behavior.
2. THE MasterGroupShift model SHALL contain a required `siteId` integer foreign key referencing MasterSite, with ON DELETE Restrict and ON UPDATE Cascade behavior.
3. THE MasterUnit model SHALL contain a required `siteId` integer foreign key referencing MasterSite, with ON DELETE Restrict and ON UPDATE Cascade behavior.
4. THE MasterVendor model SHALL contain a required `siteId` integer foreign key referencing MasterSite, with ON DELETE Restrict and ON UPDATE Cascade behavior.
5. THE EmployeeTraining model SHALL contain a required `siteId` integer foreign key referencing MasterSite, with ON DELETE Restrict and ON UPDATE Cascade behavior.
6. THE MasterAdmin model SHALL contain a nullable `siteId` integer foreign key referencing MasterSite with ON DELETE SetNull and ON UPDATE Cascade behavior, where null indicates Super Admin with access to all Sites.
7. WHEN the migration runs, THE System SHALL first create a MasterSite record with name "CLC", then assign all existing Employee, MasterGroupShift, MasterUnit, MasterVendor, EmployeeTraining, and MasterAdmin records to that Site's id, and then apply the NOT NULL constraint on the `siteId` column for all models except MasterAdmin.
8. WHEN the migration runs, THE System SHALL drop the `siteDiv` column from the Employee model only after all existing Employee records have been assigned a valid `siteId` value.
9. IF the MasterSite record referenced by a `siteId` foreign key is attempted to be deleted while dependent records exist, THEN THE System SHALL reject the deletion and preserve the dependent records unchanged.

### Requirement 3: Role System Expansion

**User Story:** As a Super Admin, I want a three-tier role system (super_admin, admin, user), so that access privileges can be differentiated between unrestricted administrators and site-scoped administrators.

#### Acceptance Criteria

1. THE MasterAdmin model SHALL support exactly three role values: "super_admin", "admin", and "user", stored in the existing `role` field (VarChar(20)).
2. WHEN a MasterAdmin has role "super_admin", THE System SHALL treat the admin's `siteId` as null and grant access to records across all Sites without restriction.
3. WHEN a MasterAdmin has role "admin", THE System SHALL require a non-null `siteId` referencing a valid Site record.
4. WHEN a MasterAdmin has role "user", THE System SHALL require a non-null `siteId` referencing a valid Site record.
5. IF a MasterAdmin with role "admin" or "user" is created or updated with a null or empty `siteId`, THEN THE System SHALL reject the request with a validation error indicating that Site wajib dipilih for the selected role.
6. IF a request attempts to assign a role value other than "super_admin", "admin", or "user", THEN THE System SHALL reject the request with a validation error indicating that the role is invalid.
7. WHEN a MasterAdmin with role "admin" or "user" queries data, THE System SHALL return only records associated with the admin's assigned `siteId`.
8. WHEN a MasterAdmin with role "super_admin" queries data, THE System SHALL return records from all Sites without site-based filtering.

### Requirement 4: JWT Token Site Context

**User Story:** As a developer, I want the authentication token to include site context, so that the middleware can determine the admin's site scope without additional database queries.

#### Acceptance Criteria

1. WHEN a Super_Admin logs in, THE System SHALL issue a JWT containing `role: "super_admin"` and `siteId: null`.
2. WHEN a Site_Admin logs in, THE System SHALL issue a JWT containing the admin's `role` value and `siteId` set to the integer ID of the admin's assigned Site record.
3. THE JWT_Payload SHALL include exactly the following fields: `sub` (string, admin ID), `employeeId` (integer), `role` (one of "super_admin", "admin", or "user"), `siteId` (integer or null), `tokenVersion` (integer), `type` (fixed value "admin-access"), `iat` (integer, Unix timestamp in seconds), and `exp` (integer, Unix timestamp in seconds equal to `iat` + 43200).
4. WHEN the Site_Isolation_Middleware decodes a valid token, THE System SHALL attach `siteId` and `role` from the token payload to the request object so that downstream route handlers can access them without additional database queries.
5. IF the Site_Isolation_Middleware receives a request with a missing, malformed, or expired token, THEN THE System SHALL reject the request with HTTP 401 status and an error message indicating authentication failure.
6. IF the token signature verification fails during Site_Isolation_Middleware decoding, THEN THE System SHALL reject the request with HTTP 401 status and an error message indicating an invalid token.
7. WHEN a Site_Admin's token is decoded, THE System SHALL ensure the `siteId` value is a non-null integer; IF `siteId` is null for a token with role "admin" or "user", THEN THE System SHALL reject the request with HTTP 401 status and an error message indicating invalid site context.

### Requirement 5: Site Isolation Middleware

**User Story:** As a Site Admin, I want the system to automatically filter all data queries to my assigned Site, so that I cannot accidentally view or modify data from other Sites.

#### Acceptance Criteria

1. WHEN a request is authenticated with role "admin" or "user", THE Site_Isolation_Middleware SHALL inject a site filter (`siteId` equals the admin's assigned Site) into all data queries for Employee, MasterGroupShift, MasterUnit, MasterVendor, and EmployeeTraining.
2. WHEN a request is authenticated with role "super_admin", THE Site_Isolation_Middleware SHALL bypass site filtering and allow access to data across all Sites without injecting a site filter.
3. IF an admin with role "admin" or "user" attempts to read an Employee record whose `siteId` value differs from the admin's assigned `siteId`, THEN THE System SHALL return HTTP 403 with message "Akses ditolak. Data tidak termasuk dalam site Anda."
4. IF an admin with role "admin" or "user" attempts to create or update an Employee record with a `siteId` value different from the admin's assigned `siteId`, THEN THE System SHALL reject the request with HTTP 403 and an error message indicating the site mismatch.
5. THE Site_Isolation_Middleware SHALL apply site filtering to all list, detail, create, update, and delete operations on Employee records and on per-site models (MasterGroupShift, MasterUnit, MasterVendor, EmployeeTraining).
6. WHEN a request targets a shared master data model (Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, MasterDokKaryawan, MasterCutiKaryawan, MasterHoliday), THE Site_Isolation_Middleware SHALL allow access without site filtering regardless of the admin's role.
7. IF `req.admin.siteId` is undefined and the admin's role is "admin" or "user", THEN THE Site_Isolation_Middleware SHALL reject the request with HTTP 403 and an error message indicating the admin has no assigned site.

### Requirement 6: Shared Master Data Access

**User Story:** As a Site Admin, I want to access shared master data (Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, MasterCutiKaryawan) regardless of my Site assignment, so that I can use global reference data when managing employees.

#### Acceptance Criteria

1. THE System SHALL allow all authenticated admins (role "super_admin", "admin", or "user") to read, create, update, and delete Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, and MasterCutiKaryawan records without applying any site-based filtering to queries or mutations.
2. WHEN an authenticated admin creates or updates an Employee record, THE System SHALL present all Department, JobRole, JobLevel, and WorkLocation records as selectable options regardless of the admin's site assignment.
3. IF an unauthenticated request is made to any shared master data endpoint under /api/master, THEN THE System SHALL reject the request with HTTP 401 and return an error message indicating authentication is required.
4. THE System SHALL store Department, JobRole, JobLevel, WorkLocation, MasterDokPkb, and MasterCutiKaryawan records without a siteId field, ensuring these tables remain globally accessible and are never partitioned by site.

### Requirement 7: Per-Site Data Isolation

**User Story:** As a Site Admin, I want MasterGroupShift, MasterUnit, MasterVendor, and EmployeeTraining data to be isolated per Site, so that each Site manages its own operational data independently.

#### Acceptance Criteria

1. WHEN a Site_Admin queries MasterGroupShift records, THE System SHALL return only records where `siteId` matches the admin's assigned Site.
2. WHEN a Site_Admin creates a MasterGroupShift record, THE System SHALL automatically set the `siteId` to the admin's assigned Site, ignoring any `siteId` value provided in the request payload.
3. WHEN a Site_Admin queries MasterUnit records, THE System SHALL return only records where `siteId` matches the admin's assigned Site.
4. WHEN a Site_Admin creates a MasterUnit record, THE System SHALL automatically set the `siteId` to the admin's assigned Site, ignoring any `siteId` value provided in the request payload.
5. WHEN a Site_Admin queries MasterVendor records, THE System SHALL return only records where `siteId` matches the admin's assigned Site.
6. WHEN a Site_Admin creates a MasterVendor record, THE System SHALL automatically set the `siteId` to the admin's assigned Site, ignoring any `siteId` value provided in the request payload.
7. WHEN a Site_Admin queries EmployeeTraining records, THE System SHALL return only records where `siteId` matches the admin's assigned Site.
8. WHEN a Site_Admin creates an EmployeeTraining record, THE System SHALL automatically set the `siteId` to the admin's assigned Site, ignoring any `siteId` value provided in the request payload.
9. WHEN a Super_Admin creates a MasterGroupShift, MasterUnit, MasterVendor, or EmployeeTraining record, THE System SHALL require an explicit `siteId` in the request payload that references an existing MasterSite record.
10. IF a Super_Admin submits a create request for a per-site record without a valid `siteId` or with a `siteId` that does not reference an existing MasterSite, THEN THE System SHALL reject the request with HTTP 400 and an error message indicating the siteId is required and must reference a valid Site.
11. WHEN a Site_Admin attempts to update or delete a MasterGroupShift, MasterUnit, MasterVendor, or EmployeeTraining record, THE System SHALL verify the record's `siteId` matches the admin's assigned Site before allowing the operation, and return HTTP 403 if the record belongs to a different Site.
12. WHEN a Site_Admin updates a per-site record, THE System SHALL preserve the original `siteId` value and ignore any `siteId` provided in the update payload.

### Requirement 8: Leave Approval Site Isolation

**User Story:** As a Site Admin, I want leave approvals to be restricted to the same Site, so that approvers from one Site cannot approve leave requests from another Site.

#### Acceptance Criteria

1. WHEN the leave approval workflow assigns approvers, THE System SHALL select approvers only from employees whose `siteId` value matches the leave requester's `siteId` value.
2. IF the leave approval workflow cannot find any eligible approver within the requester's Site at any required stage, THEN THE System SHALL reject the leave submission with an error message indicating that no approvers are available for the requester's site.
3. IF a leave approval request references an approver whose `siteId` value differs from the leave requester's `siteId` value, THEN THE System SHALL reject the assignment with a validation error message indicating a site mismatch.
4. WHEN an admin with role "admin" or "user" views leave requests, THE System SHALL display only leave requests from employees whose `siteId` value matches the admin's assigned `siteId`.
5. WHEN an admin with role "admin" or "user" attempts to approve or reject a leave request from an employee with a different `siteId` value, THEN THE System SHALL reject the action with a validation error message indicating insufficient site-level permission.
6. WHEN an admin with role "super_admin" views leave requests, THE System SHALL display leave requests from all Sites without site-based filtering.

### Requirement 9: Site CRUD Management (Super Admin)

**User Story:** As a Super Admin, I want to create, read, update, and delete Sites, so that I can manage the organizational structure of the company.

#### Acceptance Criteria

1. WHEN a Super_Admin sends a POST request to /api/master/sites, THE System SHALL validate that the site name is non-empty (minimum 1 non-whitespace character, max 100 characters) and unique, then create a new MasterSite record.
2. WHEN a Super_Admin sends a GET request to /api/master/sites, THE System SHALL return all MasterSite records with their associated admin count and employee count.
3. WHEN a Super_Admin sends a PUT request to /api/master/sites/:id, THE System SHALL validate the site name and update the specified MasterSite record.
4. WHEN a Super_Admin sends a DELETE request to /api/master/sites/:id for a Site with no associated records, THE System SHALL delete the MasterSite record and return HTTP 204.
5. IF a Site_Admin or user attempts to access any /api/master/sites endpoint, THEN THE System SHALL return HTTP 403 with message "Akses ditolak. Hanya Super Admin yang dapat mengelola Site."
6. IF a Super_Admin attempts to delete a MasterSite that has associated Employee, MasterAdmin, or per-site data records, THEN THE System SHALL return HTTP 409 with message "Site tidak dapat dihapus karena masih memiliki data terkait."
7. IF a Super_Admin sends a PUT or DELETE request to /api/master/sites/:id with an id that does not exist, THEN THE System SHALL return HTTP 404 with message "Site tidak ditemukan."

### Requirement 10: Admin-to-Site Assignment Management

**User Story:** As a Super Admin, I want to assign and reassign admins to Sites, so that I can control which administrators manage which operational locations.

#### Acceptance Criteria

1. WHEN a Super_Admin assigns a Site_Admin to a Site, THE System SHALL validate that the target `siteId` references an existing MasterSite record and update the MasterAdmin record's `siteId` to the target Site. IF the target `siteId` does not reference an existing MasterSite, THEN THE System SHALL return HTTP 400 with an error message indicating the Site is invalid.
2. WHEN a Super_Admin changes an admin's Site assignment, THE System SHALL increment the admin's `tokenVersion` to invalidate existing sessions.
3. IF a non-Super_Admin attempts to change admin Site assignments, THEN THE System SHALL return HTTP 403 with message "Akses ditolak. Hanya Super Admin yang dapat mengelola penugasan Site."
4. WHEN a Super_Admin creates a new admin with role "admin" or "user", THE System SHALL require a `siteId` in the request payload. IF the `siteId` is missing or null, THEN THE System SHALL return HTTP 400 with an error message indicating that Site assignment is required for the selected role.
5. WHEN a Super_Admin promotes an admin to "super_admin" role, THE System SHALL set the admin's `siteId` to null.
6. IF a Super_Admin attempts to change their own role from "super_admin" to a site-scoped role, THEN THE System SHALL reject the request with HTTP 400 and an error message indicating that a Super Admin cannot demote themselves.

### Requirement 11: Employee Data Site Filtering

**User Story:** As a Site Admin, I want to see only employees from my assigned Site in all employee-related views, so that I manage only the workforce under my responsibility.

#### Acceptance Criteria

1. WHEN a Site_Admin queries the employee list, THE System SHALL return only employees where `siteId` matches the admin's assigned Site.
2. WHEN a Site_Admin views employee detail, THE System SHALL verify the employee belongs to the admin's assigned Site before returning data.
3. IF a Site_Admin requests detail, update, or delete for an employee whose `siteId` does not match the admin's assigned Site, THEN THE System SHALL reject the request with HTTP 403 and an error message indicating insufficient site access.
4. WHEN a Site_Admin creates a new employee, THE System SHALL automatically set the employee's `siteId` to the admin's assigned Site.
5. WHEN a Site_Admin imports employees via Excel, THE System SHALL automatically assign the admin's `siteId` to every imported employee record.
6. WHEN a Super_Admin queries the employee list, THE System SHALL return employees from all Sites and include the Site name in each employee record in the response.
7. WHEN a Super_Admin creates or imports a new employee, THE System SHALL require an explicit `siteId` in the request payload.
8. IF a Super_Admin submits a create or import request with a missing or non-existent `siteId`, THEN THE System SHALL reject the request with HTTP 400 and an error message indicating the siteId is required or invalid.
9. WHEN a Site_Admin exports employees to Excel, THE System SHALL include only employees whose `siteId` matches the admin's assigned Site.

### Requirement 12: Frontend Site-Aware UI

**User Story:** As a Site Admin, I want the admin portal UI to reflect my site context, so that I have a clear understanding of which Site's data I am managing.

#### Acceptance Criteria

1. WHEN a Site_Admin logs in, THE System SHALL display the assigned Site name in the application header area adjacent to the logged-in user information.
2. WHEN a Super_Admin logs in, THE System SHALL display a Site selector component in the application header that contains an "All Sites" option and one option per existing MasterSite record.
3. WHEN a Super_Admin first logs in or refreshes the page, THE System SHALL default the Site selector to "All Sites" so that data views are unfiltered.
4. WHILE a Super_Admin has selected a specific Site in the Site selector, THE System SHALL persist that selection across page navigations within the same session until the admin changes it or logs out.
5. IF the authenticated admin's role is "admin" or "user", THEN THE System SHALL hide the Site management navigation menu item from the navigation bar.
6. WHEN a Super_Admin navigates to the Site management page, THE System SHALL display a data grid listing all MasterSite records with columns: Site name, associated admin count, and associated employee count.
7. IF the authenticated admin's role is "super_admin", THEN THE System SHALL display a "Site" column in the employee list data grid showing each employee's assigned Site name.

### Requirement 13: Data Migration

**User Story:** As a developer, I want existing data to be migrated to the new site-based structure, so that the system continues to function correctly after the schema change.

#### Acceptance Criteria

1. WHEN the migration executes, THE System SHALL create a MasterSite record with name "CLC" and a system-generated integer primary key.
2. WHEN the migration executes, THE System SHALL add a non-nullable `siteId` foreign key column to the Employee table and set its value to the "CLC" MasterSite id for all existing Employee records.
3. WHEN the migration executes, THE System SHALL add a non-nullable `siteId` foreign key column to the MasterGroupShift, MasterUnit, MasterVendor, and EmployeeTraining tables and set its value to the "CLC" MasterSite id for all existing records in each table.
4. WHEN the migration executes, THE System SHALL add a nullable `siteId` foreign key column to the MasterAdmin table and set its value to the "CLC" MasterSite id for all existing MasterAdmin records whose role is "admin".
5. WHEN the migration executes, THE System SHALL update exactly one existing MasterAdmin record to role "super_admin" with `siteId` set to null, selecting the MasterAdmin with the lowest id.
6. WHEN the migration completes successfully, THE System SHALL remove the legacy `siteDiv` column from the Employee table.
7. IF the migration is rolled back, THEN THE System SHALL restore the `siteDiv` column to the Employee table with its original values, remove all `siteId` foreign key columns added by this migration, revert any MasterAdmin role changes, and delete the MasterSite record created by this migration.
8. IF any step of the migration fails, THEN THE System SHALL abort the entire migration within a single transaction, leaving the database in its pre-migration state with zero data loss.
9. WHEN the migration executes, THE System SHALL complete all data updates within a single database transaction so that no intermediate state is observable.

### Requirement 14: Global Search Site Scoping

**User Story:** As a Site Admin, I want global search results to be limited to my Site's data, so that I do not see results from other Sites.

#### Acceptance Criteria

1. WHEN a Site_Admin performs a global search via /api/global-search, THE System SHALL filter all employee-related results (employees, guidance records, warning letters, leave records, license certifications) to only those where the employee's `siteId` matches the admin's assigned `siteId`.
2. WHEN a Site_Admin performs a global search, THE System SHALL return shared master data results (departments, job roles, job levels, work locations) without site filtering.
3. WHEN a Super_Admin performs a global search, THE System SHALL return results from all Sites without any site filtering.
4. WHEN a Super_Admin performs a global search, THE System SHALL include the Site name in the subtitle field of each employee-related search result item.
5. IF a Site_Admin's admin record has no assigned `siteId`, THEN THE System SHALL return an empty results array with zero items.

### Requirement 15: Notification Site Scoping

**User Story:** As a Site Admin, I want notifications to be scoped to my Site, so that I only receive alerts relevant to my Site's employees and data.

#### Acceptance Criteria

1. WHEN the notification system generates alerts for expiring certifications, pending leave approvals, rejected leave requests, email workflow failures, or employee profile changes, THE System SHALL include only records where the associated employee's `siteId` matches the requesting admin's assigned `siteId`.
2. WHEN a Site_Admin (role "admin" or "user") queries GET /api/notifications, THE System SHALL return only notifications related to employees whose `siteId` matches the admin's assigned `siteId`.
3. WHEN a Super_Admin (role "super_admin") queries GET /api/notifications, THE System SHALL return notifications from all Sites without filtering.
4. IF the requesting admin has no assigned `siteId` and role is "admin" or "user", THEN THE System SHALL return an empty notification list and respond with HTTP 200 containing zero items.
5. WHEN a Site_Admin marks notifications as read via POST /api/notifications/read or POST /api/notifications/read-all, THE System SHALL only allow marking notifications that belong to employees within the admin's assigned Site.
