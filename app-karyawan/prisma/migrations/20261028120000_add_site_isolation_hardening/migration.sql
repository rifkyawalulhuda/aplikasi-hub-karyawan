-- Migration: Site isolation hardening
-- 1. Organization masters (departments, work_locations, job_roles) become per-site.
-- 2. Transactional tables get a denormalized siteId for defense-in-depth filtering.
-- 3. All existing rows are backfilled to the initial CLC site (id = 1).
-- 4. Global name uniqueness becomes per-site uniqueness.

BEGIN;

-- ============================================================
-- 1. Organization masters: add siteId (nullable first)
-- ============================================================
ALTER TABLE "departments" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "work_locations" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "job_roles" ADD COLUMN "siteId" INTEGER;

UPDATE "departments" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC') WHERE "siteId" IS NULL;
UPDATE "work_locations" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC') WHERE "siteId" IS NULL;
UPDATE "job_roles" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC') WHERE "siteId" IS NULL;

ALTER TABLE "departments" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "work_locations" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "job_roles" ALTER COLUMN "siteId" SET NOT NULL;

-- Replace global unique name with per-site unique name
DROP INDEX IF EXISTS "departments_name_key";
DROP INDEX IF EXISTS "work_locations_name_key";
DROP INDEX IF EXISTS "job_roles_name_key";

CREATE UNIQUE INDEX "departments_siteId_name_key" ON "departments"("siteId", "name");
CREATE UNIQUE INDEX "work_locations_siteId_name_key" ON "work_locations"("siteId", "name");
CREATE UNIQUE INDEX "job_roles_siteId_name_key" ON "job_roles"("siteId", "name");

CREATE INDEX "departments_siteId_idx" ON "departments"("siteId");
CREATE INDEX "work_locations_siteId_idx" ON "work_locations"("siteId");
CREATE INDEX "job_roles_siteId_idx" ON "job_roles"("siteId");

ALTER TABLE "departments" ADD CONSTRAINT "departments_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_locations" ADD CONSTRAINT "work_locations_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 2. Transactional tables: add siteId and backfill from owner
-- ============================================================

-- warning_letters -> employees.siteId
ALTER TABLE "warning_letters" ADD COLUMN "siteId" INTEGER;
UPDATE "warning_letters" AS w
SET "siteId" = e."siteId"
FROM "employees" AS e
WHERE e."id" = w."employeeId";
ALTER TABLE "warning_letters" ALTER COLUMN "siteId" SET NOT NULL;

-- guidance_records -> employees.siteId
ALTER TABLE "guidance_records" ADD COLUMN "siteId" INTEGER;
UPDATE "guidance_records" AS g
SET "siteId" = e."siteId"
FROM "employees" AS e
WHERE e."id" = g."employeeId";
ALTER TABLE "guidance_records" ALTER COLUMN "siteId" SET NOT NULL;

-- employee_license_certifications -> employees.siteId
ALTER TABLE "employee_license_certifications" ADD COLUMN "siteId" INTEGER;
UPDATE "employee_license_certifications" AS c
SET "siteId" = e."siteId"
FROM "employees" AS e
WHERE e."id" = c."employeeId";
ALTER TABLE "employee_license_certifications" ALTER COLUMN "siteId" SET NOT NULL;

-- employee_leave_database -> employees.siteId
ALTER TABLE "employee_leave_database" ADD COLUMN "siteId" INTEGER;
UPDATE "employee_leave_database" AS d
SET "siteId" = e."siteId"
FROM "employees" AS e
WHERE e."id" = d."employeeId";
ALTER TABLE "employee_leave_database" ALTER COLUMN "siteId" SET NOT NULL;

-- employee_leave_balance_seeds -> employees.siteId
ALTER TABLE "employee_leave_balance_seeds" ADD COLUMN "siteId" INTEGER;
UPDATE "employee_leave_balance_seeds" AS s
SET "siteId" = e."siteId"
FROM "employees" AS e
WHERE e."id" = s."employeeId";
ALTER TABLE "employee_leave_balance_seeds" ALTER COLUMN "siteId" SET NOT NULL;

-- unit_license_certifications -> master_units.siteId
ALTER TABLE "unit_license_certifications" ADD COLUMN "siteId" INTEGER;
UPDATE "unit_license_certifications" AS c
SET "siteId" = u."siteId"
FROM "master_units" AS u
WHERE u."id" = c."masterUnitId";
ALTER TABLE "unit_license_certifications" ALTER COLUMN "siteId" SET NOT NULL;

-- email_workflow_failure_logs -> employee_leaves.employee.siteId (nullable, fail-closed)
ALTER TABLE "email_workflow_failure_logs" ADD COLUMN "siteId" INTEGER;
UPDATE "email_workflow_failure_logs" AS l
SET "siteId" = COALESCE(
    (
        SELECT e."siteId"
        FROM "employee_leaves" AS el
        JOIN "employees" AS e ON e."id" = el."employeeId"
        WHERE el."id" = l."employeeLeaveId"
    ),
    (
        SELECT e."siteId"
        FROM "employee_leave_approvals" AS a
        JOIN "employee_leaves" AS el ON el."id" = a."employeeLeaveId"
        JOIN "employees" AS e ON e."id" = el."employeeId"
        WHERE a."id" = l."employeeLeaveApprovalId"
    )
);

-- ============================================================
-- 3. Indexes and foreign keys for transactional tables
-- ============================================================
CREATE INDEX "warning_letters_siteId_idx" ON "warning_letters"("siteId");
CREATE INDEX "guidance_records_siteId_idx" ON "guidance_records"("siteId");
CREATE INDEX "employee_license_certifications_siteId_idx" ON "employee_license_certifications"("siteId");
CREATE INDEX "unit_license_certifications_siteId_idx" ON "unit_license_certifications"("siteId");
CREATE INDEX "employee_leave_database_siteId_idx" ON "employee_leave_database"("siteId");
CREATE INDEX "employee_leave_balance_seeds_siteId_idx" ON "employee_leave_balance_seeds"("siteId");
CREATE INDEX "email_workflow_failure_logs_siteId_idx" ON "email_workflow_failure_logs"("siteId");

ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guidance_records" ADD CONSTRAINT "guidance_records_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_license_certifications" ADD CONSTRAINT "employee_license_certifications_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "unit_license_certifications" ADD CONSTRAINT "unit_license_certifications_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_leave_database" ADD CONSTRAINT "employee_leave_database_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_leave_balance_seeds" ADD CONSTRAINT "employee_leave_balance_seeds_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_workflow_failure_logs" ADD CONSTRAINT "email_workflow_failure_logs_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
