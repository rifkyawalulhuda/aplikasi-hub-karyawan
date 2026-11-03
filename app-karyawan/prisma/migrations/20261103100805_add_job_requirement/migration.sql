-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GradeRank" ADD VALUE 'RANK_10';
ALTER TYPE "GradeRank" ADD VALUE 'RANK_11';

-- AlterTable
ALTER TABLE "employee_trainings" ADD COLUMN     "masterTrainingId" INTEGER;

-- CreateTable
CREATE TABLE "master_trainings" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requirement_profiles" (
    "id" SERIAL NOT NULL,
    "grade" "GradeRank" NOT NULL,
    "minEducation" "EducationLevel",
    "educationOther" VARCHAR(255),
    "minExperienceYears" INTEGER,
    "allowedEmploymentTypes" "EmploymentType"[],
    "allowedGenders" "Gender"[],
    "sourceFormNo" VARCHAR(100),
    "sourceRev" VARCHAR(20),
    "effectiveDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requirement_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requirement_skills" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requirement_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requirement_trainings" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "masterTrainingId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requirement_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skill_assessments" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "skillName" VARCHAR(255) NOT NULL,
    "level" INTEGER NOT NULL,
    "assessedByAdminId" INTEGER,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_trainings_name_key" ON "master_trainings"("name");

-- CreateIndex
CREATE INDEX "master_trainings_category_idx" ON "master_trainings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "job_requirement_profiles_grade_key" ON "job_requirement_profiles"("grade");

-- CreateIndex
CREATE INDEX "job_requirement_skills_profileId_idx" ON "job_requirement_skills"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "job_requirement_skills_profileId_category_name_key" ON "job_requirement_skills"("profileId", "category", "name");

-- CreateIndex
CREATE INDEX "job_requirement_trainings_profileId_idx" ON "job_requirement_trainings"("profileId");

-- CreateIndex
CREATE INDEX "job_requirement_trainings_masterTrainingId_idx" ON "job_requirement_trainings"("masterTrainingId");

-- CreateIndex
CREATE UNIQUE INDEX "job_requirement_trainings_profileId_masterTrainingId_key" ON "job_requirement_trainings"("profileId", "masterTrainingId");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_employeeId_idx" ON "employee_skill_assessments"("employeeId");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_assessedByAdminId_idx" ON "employee_skill_assessments"("assessedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skill_assessments_employeeId_category_skillName_key" ON "employee_skill_assessments"("employeeId", "category", "skillName");

-- CreateIndex
CREATE INDEX "employee_trainings_masterTrainingId_idx" ON "employee_trainings"("masterTrainingId");

-- AddForeignKey
ALTER TABLE "employee_trainings" ADD CONSTRAINT "employee_trainings_masterTrainingId_fkey" FOREIGN KEY ("masterTrainingId") REFERENCES "master_trainings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirement_skills" ADD CONSTRAINT "job_requirement_skills_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_requirement_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirement_trainings" ADD CONSTRAINT "job_requirement_trainings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_requirement_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requirement_trainings" ADD CONSTRAINT "job_requirement_trainings_masterTrainingId_fkey" FOREIGN KEY ("masterTrainingId") REFERENCES "master_trainings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_assessedByAdminId_fkey" FOREIGN KEY ("assessedByAdminId") REFERENCES "master_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
