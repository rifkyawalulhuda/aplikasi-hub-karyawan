-- CreateTable
CREATE TABLE "master_group_shifts" (
    "id" SERIAL NOT NULL,
    "groupShiftName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_group_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_shift_foremen" (
    "id" SERIAL NOT NULL,
    "masterGroupShiftId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_shift_foremen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_shift_foremen_masterGroupShiftId_idx" ON "group_shift_foremen"("masterGroupShiftId");

-- CreateIndex
CREATE INDEX "group_shift_foremen_employeeId_idx" ON "group_shift_foremen"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "group_shift_foremen_masterGroupShiftId_employeeId_key" ON "group_shift_foremen"("masterGroupShiftId", "employeeId");

-- AddForeignKey
ALTER TABLE "group_shift_foremen" ADD CONSTRAINT "group_shift_foremen_masterGroupShiftId_fkey" FOREIGN KEY ("masterGroupShiftId") REFERENCES "master_group_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_shift_foremen" ADD CONSTRAINT "group_shift_foremen_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
