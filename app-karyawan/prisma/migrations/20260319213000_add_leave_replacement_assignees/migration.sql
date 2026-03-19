CREATE TABLE "employee_leave_replacement_assignees" (
    "id" SERIAL NOT NULL,
    "employeeLeaveId" INTEGER NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "replacementEmployeeId" INTEGER NOT NULL,
    "sequenceNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_leave_replacement_assignees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "elra_leave_rev_seq_key"
ON "employee_leave_replacement_assignees"("employeeLeaveId", "revisionNo", "sequenceNo");

CREATE UNIQUE INDEX "elra_leave_rev_emp_key"
ON "employee_leave_replacement_assignees"("employeeLeaveId", "revisionNo", "replacementEmployeeId");

CREATE INDEX "employee_leave_replacement_assignees_employee_leave_id_idx"
ON "employee_leave_replacement_assignees"("employeeLeaveId");

CREATE INDEX "employee_leave_replacement_assignees_employee_leave_id_revision_no_idx"
ON "employee_leave_replacement_assignees"("employeeLeaveId", "revisionNo");

CREATE INDEX "employee_leave_replacement_assignees_replacement_employee_id_idx"
ON "employee_leave_replacement_assignees"("replacementEmployeeId");

ALTER TABLE "employee_leave_replacement_assignees"
ADD CONSTRAINT "employee_leave_replacement_assignees_employee_leave_id_fkey"
FOREIGN KEY ("employeeLeaveId") REFERENCES "employee_leaves"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_leave_replacement_assignees"
ADD CONSTRAINT "employee_leave_replacement_assignees_employee_leave_id_revision_no_fkey"
FOREIGN KEY ("employeeLeaveId", "revisionNo") REFERENCES "employee_leave_revisions"("employeeLeaveId", "revisionNo")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_leave_replacement_assignees"
ADD CONSTRAINT "employee_leave_replacement_assignees_replacement_employee_id_fkey"
FOREIGN KEY ("replacementEmployeeId") REFERENCES "employees"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "employee_leave_replacement_assignees" (
    "employeeLeaveId",
    "revisionNo",
    "replacementEmployeeId",
    "sequenceNo",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "revisionNo",
    "replacementEmployeeId",
    1,
    "createdAt",
    "updatedAt"
FROM "employee_leaves"
WHERE "replacementEmployeeId" IS NOT NULL
ON CONFLICT ("employeeLeaveId", "revisionNo", "replacementEmployeeId") DO NOTHING;

INSERT INTO "employee_leave_replacement_assignees" (
    "employeeLeaveId",
    "revisionNo",
    "replacementEmployeeId",
    "sequenceNo",
    "createdAt",
    "updatedAt"
)
SELECT
    "employeeLeaveId",
    "revisionNo",
    "replacementEmployeeId",
    1,
    "createdAt",
    "updatedAt"
FROM "employee_leave_revisions"
WHERE "replacementEmployeeId" IS NOT NULL
ON CONFLICT ("employeeLeaveId", "revisionNo", "replacementEmployeeId") DO NOTHING;
