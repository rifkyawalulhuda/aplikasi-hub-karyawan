-- CreateTable
CREATE TABLE "employee_leave_database" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "masterCutiKaryawanId" INTEGER NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "remainingLeave" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leave_database_pkey" PRIMARY KEY ("id")
);

-- Backfill approved workflow records into admin leave database
INSERT INTO "employee_leave_database" (
    "employeeId",
    "masterCutiKaryawanId",
    "leaveDays",
    "periodStart",
    "periodEnd",
    "remainingLeave",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    "employeeId",
    "masterCutiKaryawanId",
    "leaveDays",
    "periodStart",
    "periodEnd",
    "remainingLeave",
    CASE
        WHEN "notes" IS NOT NULL AND BTRIM("notes") <> '' THEN CONCAT("notes", E'\n\n', 'Ref Workflow: ', "requestNumber")
        ELSE CONCAT('Ref Workflow: ', "requestNumber")
    END,
    COALESCE("approvedAt", "createdAt"),
    COALESCE("approvedAt", "updatedAt")
FROM "employee_leaves"
WHERE "status" = 'APPROVED'::"LeaveRequestStatus";

-- CreateIndex
CREATE INDEX "employee_leave_database_employeeId_idx" ON "employee_leave_database"("employeeId");

-- CreateIndex
CREATE INDEX "employee_leave_database_masterCutiKaryawanId_idx" ON "employee_leave_database"("masterCutiKaryawanId");

-- CreateIndex
CREATE INDEX "employee_leave_database_periodStart_idx" ON "employee_leave_database"("periodStart");

-- AddForeignKey
ALTER TABLE "employee_leave_database" ADD CONSTRAINT "employee_leave_database_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_database" ADD CONSTRAINT "employee_leave_database_masterCutiKaryawanId_fkey" FOREIGN KEY ("masterCutiKaryawanId") REFERENCES "master_cuti_karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
