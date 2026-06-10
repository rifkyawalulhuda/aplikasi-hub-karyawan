-- Migration: Add Multi-Tenant Site Isolation
-- This migration creates the master_sites table, adds siteId foreign keys to
-- per-site models, migrates existing data to the initial "CLC" site, promotes
-- the lowest-id admin to super_admin, and drops the legacy siteDiv column.

BEGIN;

-- 1. Create MasterSite table
CREATE TABLE "master_sites" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_sites_name_key" ON "master_sites"("name");

-- 2. Seed initial site
INSERT INTO "master_sites" ("name", "updatedAt") VALUES ('CLC', CURRENT_TIMESTAMP);

-- 3. Add siteId columns (nullable initially)
ALTER TABLE "employees" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "master_group_shifts" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "master_units" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "master_vendors" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "employee_trainings" ADD COLUMN "siteId" INTEGER;
ALTER TABLE "master_admins" ADD COLUMN "siteId" INTEGER;

-- 4. Assign all existing records to CLC
UPDATE "employees" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC');
UPDATE "master_group_shifts" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC');
UPDATE "master_units" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC');
UPDATE "master_vendors" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC');
UPDATE "employee_trainings" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC');
UPDATE "master_admins" SET "siteId" = (SELECT "id" FROM "master_sites" WHERE "name" = 'CLC');

-- 5. Set lowest-id admin as super_admin with null siteId
UPDATE "master_admins" SET "role" = 'super_admin', "siteId" = NULL
    WHERE "id" = (SELECT MIN("id") FROM "master_admins");

-- 6. Apply NOT NULL constraints (except MasterAdmin which stays nullable)
ALTER TABLE "employees" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "master_group_shifts" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "master_units" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "master_vendors" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "employee_trainings" ALTER COLUMN "siteId" SET NOT NULL;

-- 7. Add foreign key constraints
ALTER TABLE "employees" ADD CONSTRAINT "employees_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "master_group_shifts" ADD CONSTRAINT "master_group_shifts_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "master_units" ADD CONSTRAINT "master_units_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "master_vendors" ADD CONSTRAINT "master_vendors_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_trainings" ADD CONSTRAINT "employee_trainings_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "master_admins" ADD CONSTRAINT "master_admins_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Drop legacy column
ALTER TABLE "employees" DROP COLUMN "siteDiv";

-- 9. Add indexes
CREATE INDEX "employees_siteId_idx" ON "employees"("siteId");
CREATE INDEX "master_group_shifts_siteId_idx" ON "master_group_shifts"("siteId");
CREATE INDEX "master_units_siteId_idx" ON "master_units"("siteId");
CREATE INDEX "master_vendors_siteId_idx" ON "master_vendors"("siteId");
CREATE INDEX "employee_trainings_siteId_idx" ON "employee_trainings"("siteId");
CREATE INDEX "master_admins_siteId_idx" ON "master_admins"("siteId");

COMMIT;
