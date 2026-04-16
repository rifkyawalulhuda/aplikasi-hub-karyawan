-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateTable
CREATE TABLE "employee_trainings" (
    "id" SERIAL NOT NULL,
    "trainingType" "TrainingType" NOT NULL,
    "material" TEXT NOT NULL,
    "trainerInstitution" VARCHAR(255) NOT NULL,
    "trainerName" VARCHAR(255) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "dayCount" INTEGER NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_training_participants" (
    "id" SERIAL NOT NULL,
    "employeeTrainingId" INTEGER NOT NULL,
    "participantName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_training_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_trainings_trainingType_idx" ON "employee_trainings"("trainingType");

-- CreateIndex
CREATE INDEX "employee_trainings_startDate_idx" ON "employee_trainings"("startDate");

-- CreateIndex
CREATE INDEX "employee_trainings_endDate_idx" ON "employee_trainings"("endDate");

-- CreateIndex
CREATE INDEX "employee_training_participants_employeeTrainingId_idx" ON "employee_training_participants"("employeeTrainingId");

-- AddForeignKey
ALTER TABLE "employee_training_participants" ADD CONSTRAINT "employee_training_participants_employeeTrainingId_fkey" FOREIGN KEY ("employeeTrainingId") REFERENCES "employee_trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
