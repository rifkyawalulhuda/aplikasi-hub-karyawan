-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "groupShiftId" INTEGER;

-- CreateIndex
CREATE INDEX "employees_groupShiftId_idx" ON "employees"("groupShiftId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_groupShiftId_fkey" FOREIGN KEY ("groupShiftId") REFERENCES "master_group_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
