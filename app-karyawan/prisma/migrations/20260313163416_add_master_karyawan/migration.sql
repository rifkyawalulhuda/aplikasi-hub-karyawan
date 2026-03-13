-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('SMA', 'D3', 'S1', 'S2');

-- CreateEnum
CREATE TYPE "GradeRank" AS ENUM ('RANK_1', 'RANK_2', 'RANK_3', 'RANK_4', 'RANK_5', 'RANK_6', 'RANK_7', 'RANK_8', 'RANK_9');

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "employeeNo" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "siteDiv" VARCHAR(100) NOT NULL DEFAULT 'CLC',
    "departmentId" INTEGER NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "workLocationId" INTEGER NOT NULL,
    "jobRoleId" INTEGER NOT NULL,
    "jobLevelId" INTEGER NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "grade" "GradeRank" NOT NULL,
    "joinDate" DATE NOT NULL,
    "phoneNumber" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeNo_key" ON "employees"("employeeNo");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_workLocationId_idx" ON "employees"("workLocationId");

-- CreateIndex
CREATE INDEX "employees_jobRoleId_idx" ON "employees"("jobRoleId");

-- CreateIndex
CREATE INDEX "employees_jobLevelId_idx" ON "employees"("jobLevelId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "work_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_jobLevelId_fkey" FOREIGN KEY ("jobLevelId") REFERENCES "job_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
