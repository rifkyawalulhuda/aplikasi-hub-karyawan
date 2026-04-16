-- AlterTable
ALTER TABLE "employee_training_participants" ADD COLUMN     "employeeId" INTEGER;

-- CreateIndex
CREATE INDEX "employee_training_participants_employeeId_idx" ON "employee_training_participants"("employeeId");

-- AddForeignKey
ALTER TABLE "employee_training_participants" ADD CONSTRAINT "employee_training_participants_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
