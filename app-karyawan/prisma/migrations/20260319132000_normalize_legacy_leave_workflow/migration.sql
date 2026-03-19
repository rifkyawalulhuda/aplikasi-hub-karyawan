UPDATE "employee_leaves"
SET
    "status" = 'APPROVED'::"LeaveRequestStatus",
    "submittedAt" = "createdAt",
    "approvedAt" = COALESCE("approvedAt", "updatedAt")
WHERE "requestNumber" LIKE 'CT-LEGACY-%'
  AND "status" = 'SUBMITTED'::"LeaveRequestStatus"
  AND "currentStageOrder" IS NULL;

UPDATE "employee_leave_revisions" AS revisions
SET
    "status" = 'APPROVED'::"LeaveRequestStatus",
    "submittedAt" = revisions."createdAt",
    "approvedAt" = COALESCE(revisions."approvedAt", revisions."updatedAt")
FROM "employee_leaves" AS leaves
WHERE revisions."employeeLeaveId" = leaves."id"
  AND leaves."requestNumber" LIKE 'CT-LEGACY-%'
  AND revisions."status" = 'SUBMITTED'::"LeaveRequestStatus";
