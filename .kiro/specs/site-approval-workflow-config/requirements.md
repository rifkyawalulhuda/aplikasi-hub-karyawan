# Requirements Document

## Introduction

This feature replaces the hardcoded leave approval workflow (based on Job Level names like Foreman → General Foreman → Section Chief → Dept Manager) with a per-site configurable approval hierarchy. Each site can define its own approval chain by assigning `approvalRank` values to Job Levels and configuring `maxApprovalRank` thresholds per requester job level. This enables different sites to have different approval depths and hierarchies without code changes.

## Glossary

- **Approval_Rank**: An integer value assigned to a Job Level in the `SiteApprovalConfig` table that determines the position of that Job Level in the approval hierarchy for a specific site. A higher rank means a higher position in the approval chain.
- **Max_Approval_Rank**: An integer value in the `SiteApprovalConfig` table that determines the highest approval rank the approval chain should reach for a requester at a given job level and site combination.
- **SiteApprovalConfig**: A database table that maps a combination of `siteId` and `jobLevelId` to an `approvalRank` (nullable) and `maxApprovalRank`, defining the per-site approval workflow configuration.
- **Approval_Workflow_Engine**: The server-side logic in `server/lib/leaveWorkflow.js` that resolves the approval chain for a leave request based on the requester's site and job level.
- **Requester**: The employee who submits a leave request and whose site + job level determines the approval chain configuration.
- **Approver**: An employee in the same site and department whose job level has an `approvalRank` higher than the requester's rank, up to the configured `maxApprovalRank`.
- **Super_Admin**: An administrator with role "super_admin" who has unrestricted access to configure approval workflows for all sites.
- **JobLevel**: The shared master data model representing organizational hierarchy levels (e.g., Staff, Foreman, General Foreman, Section Chief, Dy. Dept. Manager, Dept. Manager, Site/Div. Manager).
- **MasterSite**: The database model representing an operational site location.

## Requirements

### Requirement 1: Add approvalRank Column to Master Job Level

**User Story:** As a Super Admin, I want each Job Level to have an optional `approvalRank` field, so that the system can determine the hierarchical position of each Job Level in the approval workflow.

#### Acceptance Criteria

1. THE JobLevel model SHALL include an `approvalRank` column of type nullable integer.
2. WHEN a JobLevel record has `approvalRank` set to null, THE Approval_Workflow_Engine SHALL treat that Job Level as unable to act as an approver.
3. WHEN a JobLevel record has `approvalRank` set to a non-null integer, THE Approval_Workflow_Engine SHALL use that value to determine the Job Level's position in the approval hierarchy.
4. THE JobLevel model SHALL allow multiple records to have the same `approvalRank` value (no uniqueness constraint on `approvalRank`).
5. WHEN a Super_Admin creates or updates a JobLevel record, THE System SHALL accept an `approvalRank` value that is either null or a positive integer (1 or greater).
6. IF a Super_Admin provides an `approvalRank` value that is zero, negative, or non-integer, THEN THE System SHALL reject the request with a validation error message "approvalRank harus berupa bilangan bulat positif atau kosong."

### Requirement 2: SiteApprovalConfig Data Model

**User Story:** As a Super Admin, I want a configuration table that maps each site + job level combination to an approval rank and maximum approval rank, so that each site can have its own approval workflow hierarchy.

#### Acceptance Criteria

1. THE SiteApprovalConfig model SHALL store the following fields: an auto-incrementing integer primary key, a required `siteId` integer foreign key referencing MasterSite, a required `jobLevelId` integer foreign key referencing JobLevel, a nullable `approvalRank` integer, a required `maxApprovalRank` positive integer, and createdAt/updatedAt timestamps.
2. THE SiteApprovalConfig model SHALL enforce a unique constraint on the combination of `siteId` and `jobLevelId`.
3. WHEN a SiteApprovalConfig record has `approvalRank` set to null, THE Approval_Workflow_Engine SHALL treat employees at that job level as non-approvers (requesters only) for that site.
4. WHEN a SiteApprovalConfig record has `approvalRank` set to a non-null positive integer, THE Approval_Workflow_Engine SHALL treat employees at that job level as potential approvers at that rank for that site.
5. THE SiteApprovalConfig model SHALL use ON DELETE Restrict and ON UPDATE Cascade for the `siteId` foreign key referencing MasterSite.
6. THE SiteApprovalConfig model SHALL use ON DELETE Restrict and ON UPDATE Cascade for the `jobLevelId` foreign key referencing JobLevel.
7. IF a MasterSite or JobLevel record is deleted while referenced by a SiteApprovalConfig record, THEN THE System SHALL reject the deletion and preserve the SiteApprovalConfig record unchanged.

### Requirement 3: SiteApprovalConfig CRUD API

**User Story:** As a Super Admin, I want to create, read, update, and delete approval workflow configurations per site, so that I can customize the approval chain for each operational location.

#### Acceptance Criteria

1. WHEN a Super_Admin sends a GET request to /api/master/site-approval-configs with a `siteId` query parameter, THE System SHALL return all SiteApprovalConfig records for that site, including the associated JobLevel name for each record.
2. WHEN a Super_Admin sends a POST request to /api/master/site-approval-configs with valid `siteId`, `jobLevelId`, `approvalRank` (nullable), and `maxApprovalRank`, THE System SHALL create a new SiteApprovalConfig record.
3. WHEN a Super_Admin sends a PUT request to /api/master/site-approval-configs/:id with valid `approvalRank` and `maxApprovalRank` values, THE System SHALL update the specified record.
4. WHEN a Super_Admin sends a DELETE request to /api/master/site-approval-configs/:id, THE System SHALL delete the specified record.
5. IF a non-Super_Admin attempts to access any /api/master/site-approval-configs endpoint, THEN THE System SHALL return HTTP 403 with message "Akses ditolak. Hanya Super Admin yang dapat mengelola konfigurasi approval."
6. IF a POST request contains a `siteId` and `jobLevelId` combination that already exists, THEN THE System SHALL return HTTP 409 with message "Konfigurasi approval untuk site dan job level ini sudah ada."
7. IF a POST or PUT request contains a `maxApprovalRank` value that is zero, negative, or non-integer, THEN THE System SHALL return HTTP 400 with message "maxApprovalRank harus berupa bilangan bulat positif."
8. IF a POST or PUT request contains an `approvalRank` value that is not null and is zero, negative, or non-integer, THEN THE System SHALL return HTTP 400 with message "approvalRank harus berupa bilangan bulat positif atau kosong."
9. IF a POST request references a `siteId` that does not exist in MasterSite, THEN THE System SHALL return HTTP 400 with message "Site tidak ditemukan."
10. IF a POST request references a `jobLevelId` that does not exist in JobLevel, THEN THE System SHALL return HTTP 400 with message "Job Level tidak ditemukan."
11. WHEN a Super_Admin sends a GET request to /api/master/site-approval-configs/:id, THE System SHALL return the specified SiteApprovalConfig record with associated JobLevel and MasterSite names.
12. IF a GET, PUT, or DELETE request references an id that does not exist, THEN THE System SHALL return HTTP 404 with message "Konfigurasi approval tidak ditemukan."

### Requirement 4: Bulk Configuration API

**User Story:** As a Super Admin, I want to save the entire approval workflow configuration for a site in a single operation, so that I can efficiently set up or modify the complete approval hierarchy.

#### Acceptance Criteria

1. WHEN a Super_Admin sends a PUT request to /api/master/site-approval-configs/bulk with a `siteId` and an array of configuration entries (each containing `jobLevelId`, `approvalRank`, and `maxApprovalRank`), THE System SHALL replace all existing SiteApprovalConfig records for that site with the provided entries within a single database transaction.
2. IF the bulk request contains duplicate `jobLevelId` values within the entries array, THEN THE System SHALL return HTTP 400 with message "Terdapat duplikasi Job Level dalam konfigurasi."
3. IF any entry in the bulk request contains invalid `approvalRank` or `maxApprovalRank` values, THEN THE System SHALL reject the entire request with HTTP 400 and a message indicating which entry has the validation error.
4. IF the bulk request references a `siteId` that does not exist, THEN THE System SHALL return HTTP 400 with message "Site tidak ditemukan."
5. WHEN the bulk operation completes successfully, THE System SHALL return the complete list of SiteApprovalConfig records for that site.

### Requirement 5: Approval Workflow Engine — Config Lookup

**User Story:** As a developer, I want the approval workflow engine to look up the SiteApprovalConfig for the requester's site and job level, so that the approval chain is determined dynamically based on configuration.

#### Acceptance Criteria

1. WHEN a leave request is submitted, THE Approval_Workflow_Engine SHALL query the SiteApprovalConfig table for the requester's `siteId` and `jobLevelId` combination to determine the requester's `approvalRank` and `maxApprovalRank`.
2. IF no SiteApprovalConfig record exists for the requester's `siteId` and `jobLevelId` combination, THEN THE Approval_Workflow_Engine SHALL reject the leave submission with HTTP 400 and message "Konfigurasi approval belum diatur untuk site dan job level Anda. Hubungi administrator."
3. WHEN the requester's SiteApprovalConfig record is found, THE Approval_Workflow_Engine SHALL use the `approvalRank` value (which may be null for non-approver levels like Staff) and the `maxApprovalRank` value to determine the approval chain boundaries.

### Requirement 6: Approval Workflow Engine — Approver Resolution

**User Story:** As a developer, I want the workflow engine to find approvers based on the site approval configuration, so that the correct approval chain is built dynamically for each leave request.

#### Acceptance Criteria

1. WHEN resolving approvers, THE Approval_Workflow_Engine SHALL find employees in the same site and department as the requester whose job level has a SiteApprovalConfig `approvalRank` value strictly greater than the requester's `approvalRank` value (treating null requester rank as rank 0).
2. WHEN resolving approvers, THE Approval_Workflow_Engine SHALL exclude employees whose job level has a SiteApprovalConfig `approvalRank` value greater than the requester's `maxApprovalRank`.
3. WHEN resolving approvers, THE Approval_Workflow_Engine SHALL order approval stages by ascending `approvalRank` value, creating one stage per distinct `approvalRank` level.
4. WHEN multiple employees share the same `approvalRank` at a given stage, THE Approval_Workflow_Engine SHALL include all of them as approvers for that stage (parallel approval within a stage).
5. WHEN resolving approvers, THE Approval_Workflow_Engine SHALL exclude the requester from the list of potential approvers.
6. IF no eligible approvers are found within the configured rank range for the requester's site, THEN THE Approval_Workflow_Engine SHALL reject the leave submission with HTTP 400 and message "Tidak ada approver yang tersedia untuk site karyawan."
7. WHEN the Foreman Group Shift approval stage applies (requester has a group shift and requester's approvalRank is null), THE Approval_Workflow_Engine SHALL retain the existing Foreman Group Shift logic as the first stage before the rank-based stages.

### Requirement 7: Approval Workflow Engine — Stage Type Assignment

**User Story:** As a developer, I want each approval stage to have a meaningful stage type identifier, so that the system can display and track approval progress correctly.

#### Acceptance Criteria

1. WHEN the Approval_Workflow_Engine creates approval stages from the SiteApprovalConfig, THE System SHALL assign the `stageType` based on the approver's Job Level name mapped to the existing LeaveStageType enum values (FOREMAN, GENERAL_FOREMAN, SECTION_CHIEF, DY_DEPT_MANAGER, DEPT_MANAGER, SITE_DIV_MANAGER).
2. IF an approver's Job Level name does not match any existing LeaveStageType enum value, THEN THE System SHALL use a fallback stage type derived from the Job Level name or a generic identifier.
3. THE Approval_Workflow_Engine SHALL preserve the existing FOREMAN_GROUP_SHIFT stage type for the group shift foreman approval stage.

### Requirement 8: Remove Hardcoded Approval Stage Sequence

**User Story:** As a developer, I want the hardcoded `APPROVAL_STAGE_SEQUENCE` array to be replaced by the dynamic configuration lookup, so that the approval flow is fully driven by the SiteApprovalConfig table.

#### Acceptance Criteria

1. WHEN the Approval_Workflow_Engine resolves approval stages, THE System SHALL use the SiteApprovalConfig table as the source of truth for determining the approval hierarchy, instead of the hardcoded `APPROVAL_STAGE_SEQUENCE` constant.
2. THE System SHALL remove or deprecate the `APPROVAL_STAGE_SEQUENCE` constant from `server/lib/leaveWorkflow.js` after the migration to config-based workflow is complete.
3. THE System SHALL remove or deprecate the `getApprovalRank` function that relies on the hardcoded sequence.
4. WHEN the config-based workflow is active, THE Approval_Workflow_Engine SHALL produce equivalent approval chains to the previous hardcoded logic when the SiteApprovalConfig is populated with equivalent rank values.

### Requirement 9: Super Admin Configuration UI

**User Story:** As a Super Admin, I want a dedicated UI page to configure the approval workflow per site, so that I can visually manage the approval hierarchy for each operational location.

#### Acceptance Criteria

1. WHEN a Super_Admin navigates to the approval workflow configuration page, THE System SHALL display a site selector dropdown to choose which site's configuration to manage.
2. WHEN a site is selected, THE System SHALL display a table showing all Job Levels with their configured `approvalRank` and `maxApprovalRank` values for that site, including Job Levels that have no configuration yet.
3. WHEN a Super_Admin edits the configuration table, THE System SHALL allow setting `approvalRank` to either empty (null) or a positive integer for each Job Level row.
4. WHEN a Super_Admin edits the configuration table, THE System SHALL require `maxApprovalRank` to be a positive integer for each Job Level row that is included in the configuration.
5. WHEN a Super_Admin clicks the save button, THE System SHALL submit the entire configuration for the selected site using the bulk API endpoint.
6. IF the save operation succeeds, THEN THE System SHALL display a success notification with message "Konfigurasi approval berhasil disimpan."
7. IF the save operation fails due to validation errors, THEN THE System SHALL display the error message returned by the API.
8. THE System SHALL display a visual representation (e.g., numbered list or diagram) showing the resulting approval chain order based on the configured ranks.
9. IF a non-Super_Admin attempts to access the approval workflow configuration page, THEN THE System SHALL redirect to the dashboard or display an access denied message.

### Requirement 10: Data Migration — Seed Initial Configuration

**User Story:** As a developer, I want the migration to seed SiteApprovalConfig records that replicate the current hardcoded approval flow, so that existing sites continue to work correctly after the migration.

#### Acceptance Criteria

1. WHEN the migration executes, THE System SHALL add the `approvalRank` column (nullable integer) to the `job_levels` table.
2. WHEN the migration executes, THE System SHALL create the `site_approval_configs` table with columns: id (serial primary key), site_id (integer, not null, FK to master_sites), job_level_id (integer, not null, FK to job_levels), approval_rank (integer, nullable), max_approval_rank (integer, not null), created_at (timestamp), updated_at (timestamp), with a unique constraint on (site_id, job_level_id).
3. WHEN the migration executes, THE System SHALL seed SiteApprovalConfig records for each existing MasterSite that replicate the current hardcoded approval hierarchy: Staff (approvalRank: null, maxApprovalRank: 5), Foreman (approvalRank: 1, maxApprovalRank: 5), General Foreman (approvalRank: 2, maxApprovalRank: 5), Section Chief (approvalRank: 3, maxApprovalRank: 5), Dy. Dept. Manager (approvalRank: 4, maxApprovalRank: 5), Dept. Manager (approvalRank: 5, maxApprovalRank: 6), Site/Div. Manager (approvalRank: 6, maxApprovalRank: 6).
4. WHEN the migration executes, THE System SHALL update the `approvalRank` column on the JobLevel table to match the seeded values: Foreman=1, General Foreman=2, Section Chief=3, Dy. Dept. Manager=4, Dept. Manager=5, Site/Div. Manager=6, and null for all other Job Levels.
5. IF the migration is rolled back, THEN THE System SHALL drop the `site_approval_configs` table, remove the `approvalRank` column from the `job_levels` table, and leave all other tables unchanged.
6. WHEN the migration executes, THE System SHALL complete all operations within a single database transaction.

### Requirement 11: Backward Compatibility

**User Story:** As a developer, I want the new config-based workflow to produce identical results to the old hardcoded workflow when configured with equivalent values, so that existing leave requests are not disrupted.

#### Acceptance Criteria

1. WHEN the SiteApprovalConfig for a site is populated with the default seeded values from Requirement 10, THE Approval_Workflow_Engine SHALL produce the same approval stage sequence as the previous hardcoded `APPROVAL_STAGE_SEQUENCE` for all requester job levels.
2. WHEN existing leave requests with status SUBMITTED or IN_APPROVAL are processed after the migration, THE Approval_Workflow_Engine SHALL continue to use the existing approval records without re-resolving the approval chain.
3. THE System SHALL preserve the existing `LeaveStageType` enum values and the `EmployeeLeaveApproval.stageType` column to maintain compatibility with existing approval records.
4. THE System SHALL preserve the existing `getStageLabel` function behavior for displaying stage names in the UI.

