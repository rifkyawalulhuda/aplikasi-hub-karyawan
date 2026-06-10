-- Migration: Add Site Approval Config
-- This migration adds the approval_rank column to job_levels, creates the
-- site_approval_configs table, seeds approval configs for all existing sites
-- using the hardcoded hierarchy values, and updates job_levels.approval_rank.

BEGIN;

-- 1. Add approval_rank column to job_levels
ALTER TABLE "job_levels" ADD COLUMN "approvalRank" INTEGER;

-- 2. Create site_approval_configs table
CREATE TABLE "site_approval_configs" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "jobLevelId" INTEGER NOT NULL,
    "approvalRank" INTEGER,
    "maxApprovalRank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_approval_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on (siteId, jobLevelId)
CREATE UNIQUE INDEX "site_approval_configs_siteId_jobLevelId_key" ON "site_approval_configs"("siteId", "jobLevelId");

-- CreateIndex: index on siteId
CREATE INDEX "site_approval_configs_siteId_idx" ON "site_approval_configs"("siteId");

-- CreateIndex: index on jobLevelId
CREATE INDEX "site_approval_configs_jobLevelId_idx" ON "site_approval_configs"("jobLevelId");

-- AddForeignKey: siteId -> master_sites
ALTER TABLE "site_approval_configs" ADD CONSTRAINT "site_approval_configs_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: jobLevelId -> job_levels
ALTER TABLE "site_approval_configs" ADD CONSTRAINT "site_approval_configs_jobLevelId_fkey"
    FOREIGN KEY ("jobLevelId") REFERENCES "job_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Seed site_approval_configs for each existing MasterSite
-- Cross join all sites with the hardcoded hierarchy values
INSERT INTO "site_approval_configs" ("siteId", "jobLevelId", "approvalRank", "maxApprovalRank", "updatedAt")
SELECT
    s."id",
    jl."id",
    CASE jl."name"
        WHEN 'Foreman' THEN 1
        WHEN 'General Foreman' THEN 2
        WHEN 'Section Chief' THEN 3
        WHEN 'Dy. Dept. Manager' THEN 4
        WHEN 'Dept. Manager' THEN 5
        WHEN 'Site/Div. Manager' THEN 6
        ELSE NULL
    END,
    CASE jl."name"
        WHEN 'Staff' THEN 5
        WHEN 'Foreman' THEN 5
        WHEN 'General Foreman' THEN 5
        WHEN 'Section Chief' THEN 5
        WHEN 'Dy. Dept. Manager' THEN 5
        WHEN 'Dept. Manager' THEN 6
        WHEN 'Site/Div. Manager' THEN 6
        ELSE 5
    END,
    CURRENT_TIMESTAMP
FROM "master_sites" s
CROSS JOIN "job_levels" jl
WHERE jl."name" IN ('Staff', 'Foreman', 'General Foreman', 'Section Chief', 'Dy. Dept. Manager', 'Dept. Manager', 'Site/Div. Manager');

-- 4. Update job_levels.approval_rank for known job level names
UPDATE "job_levels" SET "approvalRank" = 1 WHERE "name" = 'Foreman';
UPDATE "job_levels" SET "approvalRank" = 2 WHERE "name" = 'General Foreman';
UPDATE "job_levels" SET "approvalRank" = 3 WHERE "name" = 'Section Chief';
UPDATE "job_levels" SET "approvalRank" = 4 WHERE "name" = 'Dy. Dept. Manager';
UPDATE "job_levels" SET "approvalRank" = 5 WHERE "name" = 'Dept. Manager';
UPDATE "job_levels" SET "approvalRank" = 6 WHERE "name" = 'Site/Div. Manager';

COMMIT;
