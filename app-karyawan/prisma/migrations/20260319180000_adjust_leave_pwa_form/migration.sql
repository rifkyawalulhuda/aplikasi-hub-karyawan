ALTER TABLE "employee_leaves"
ADD COLUMN "leaveAddress" TEXT,
ADD COLUMN "leaveReason" TEXT,
ADD COLUMN "replacementEmployeeId" INTEGER;

ALTER TABLE "employee_leave_revisions"
ADD COLUMN "masterCutiKaryawanId" INTEGER,
ADD COLUMN "leaveAddress" TEXT,
ADD COLUMN "leaveReason" TEXT,
ADD COLUMN "replacementEmployeeId" INTEGER;

UPDATE "employee_leave_revisions" AS "revision"
SET "masterCutiKaryawanId" = "leave"."masterCutiKaryawanId",
    "leaveAddress" = "leave"."leaveAddress",
    "leaveReason" = "leave"."leaveReason",
    "replacementEmployeeId" = "leave"."replacementEmployeeId"
FROM "employee_leaves" AS "leave"
WHERE "leave"."id" = "revision"."employeeLeaveId";

ALTER TABLE "employee_leave_revisions"
ALTER COLUMN "masterCutiKaryawanId" SET NOT NULL;

CREATE INDEX "employee_leaves_replacementEmployeeId_idx" ON "employee_leaves"("replacementEmployeeId");
CREATE INDEX "employee_leave_revisions_masterCutiKaryawanId_idx" ON "employee_leave_revisions"("masterCutiKaryawanId");
CREATE INDEX "employee_leave_revisions_replacementEmployeeId_idx" ON "employee_leave_revisions"("replacementEmployeeId");

ALTER TABLE "employee_leaves"
ADD CONSTRAINT "employee_leaves_replacementEmployeeId_fkey"
FOREIGN KEY ("replacementEmployeeId") REFERENCES "employees"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "employee_leave_revisions"
ADD CONSTRAINT "employee_leave_revisions_masterCutiKaryawanId_fkey"
FOREIGN KEY ("masterCutiKaryawanId") REFERENCES "master_cuti_karyawan"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "employee_leave_revisions"
ADD CONSTRAINT "employee_leave_revisions_replacementEmployeeId_fkey"
FOREIGN KEY ("replacementEmployeeId") REFERENCES "employees"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
