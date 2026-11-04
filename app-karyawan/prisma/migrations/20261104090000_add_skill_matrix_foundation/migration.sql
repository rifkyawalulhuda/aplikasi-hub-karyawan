-- CreateEnum
CREATE TYPE "SkillWeight" AS ENUM ('CRITICAL', 'IMPORTANT', 'DESIRABLE');

-- AlterTable
ALTER TABLE "job_requirement_skills" ADD COLUMN     "targetLevel" INTEGER DEFAULT 3,
ADD COLUMN     "weight" "SkillWeight" NOT NULL DEFAULT 'IMPORTANT';

-- CreateTable
CREATE TABLE "skill_assessment_periods" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_assessment_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_assessment_periods_name_key" ON "skill_assessment_periods"("name");

-- CreateIndex
CREATE INDEX "skill_assessment_periods_isActive_idx" ON "skill_assessment_periods"("isActive");

-- Seed the initial active period so legacy assessments have a home
INSERT INTO "skill_assessment_periods" ("name", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES ('2026-S1', DATE '2026-01-01', DATE '2026-06-30', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "employee_skill_assessments" ADD COLUMN     "masterSkillId" INTEGER,
ADD COLUMN     "periodId" INTEGER;

-- Attach every existing assessment to the initial period
UPDATE "employee_skill_assessments"
SET "periodId" = (SELECT "id" FROM "skill_assessment_periods" WHERE "name" = '2026-S1')
WHERE "periodId" IS NULL;

-- Backfill masterSkillId from the master catalog when the name matches
UPDATE "employee_skill_assessments" AS a
SET "masterSkillId" = m."id"
FROM "master_skills" AS m
WHERE a."masterSkillId" IS NULL
  AND a."category" = m."category"
  AND lower(trim(a."skillName")) = lower(trim(m."name"));

-- DropIndex
DROP INDEX "employee_skill_assessments_employeeId_category_skillName_key";

-- CreateIndex
CREATE INDEX "employee_skill_assessments_masterSkillId_idx" ON "employee_skill_assessments"("masterSkillId");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_periodId_idx" ON "employee_skill_assessments"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skill_assessments_employeeId_category_skillName_periodId_key" ON "employee_skill_assessments"("employeeId", "category", "skillName", "periodId");

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_masterSkillId_fkey" FOREIGN KEY ("masterSkillId") REFERENCES "master_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "skill_assessment_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
