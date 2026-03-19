-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('SUBMITTED', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveApprovalStatus" AS ENUM ('WAITING', 'PENDING', 'APPROVED', 'REJECTED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveStageType" AS ENUM ('FOREMAN_GROUP_SHIFT', 'FOREMAN', 'GENERAL_FOREMAN', 'SECTION_CHIEF', 'DY_DEPT_MANAGER', 'DEPT_MANAGER', 'SITE_DIV_MANAGER');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "employee_leaves"
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "balanceBefore" INTEGER,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "currentStageOrder" INTEGER,
ADD COLUMN     "leaveYear" INTEGER,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "requestNumber" VARCHAR(50),
ADD COLUMN     "revisionNo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "status" "LeaveRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "employee_leave_revisions" (
    "id" SERIAL NOT NULL,
    "employeeLeaveId" INTEGER NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "remainingLeave" INTEGER NOT NULL,
    "notes" TEXT,
    "rejectionNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leave_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_leave_approvals" (
    "id" SERIAL NOT NULL,
    "employeeLeaveId" INTEGER NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "stageType" "LeaveStageType" NOT NULL,
    "approverEmployeeId" INTEGER NOT NULL,
    "status" "LeaveApprovalStatus" NOT NULL DEFAULT 'WAITING',
    "actionNote" TEXT,
    "actedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leave_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_leave_balance_seeds" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "openingBalance" INTEGER NOT NULL,
    "currentBalance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leave_balance_seeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" SERIAL NOT NULL,
    "employeeLeaveId" INTEGER,
    "employeeLeaveApprovalId" INTEGER,
    "revisionNo" INTEGER,
    "recipientEmail" VARCHAR(255) NOT NULL,
    "recipientName" VARCHAR(255),
    "subject" VARCHAR(255) NOT NULL,
    "htmlBody" TEXT,
    "textBody" TEXT,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- Backfill legacy leave records into workflow shape
UPDATE "employee_leaves"
SET
    "requestNumber" = COALESCE("requestNumber", CONCAT('CT-LEGACY-', LPAD("id"::text, 6, '0'))),
    "leaveYear" = COALESCE("leaveYear", EXTRACT(YEAR FROM "periodStart")::INTEGER),
    "balanceBefore" = COALESCE("balanceBefore", GREATEST(COALESCE("remainingLeave", 0) + COALESCE("leaveDays", 0), COALESCE("remainingLeave", 0))),
    "status" = CASE
        WHEN "status" IS NULL THEN 'APPROVED'::"LeaveRequestStatus"
        ELSE "status"
    END,
    "submittedAt" = COALESCE("submittedAt", "createdAt"),
    "approvedAt" = COALESCE("approvedAt", "updatedAt"),
    "currentStageOrder" = NULL,
    "rejectionNote" = NULL,
    "rejectedAt" = NULL,
    "cancelledAt" = NULL,
    "revisionNo" = COALESCE("revisionNo", 1);

-- Seed yearly balances from legacy request data if not already present
INSERT INTO "employee_leave_balance_seeds" (
    "employeeId",
    "year",
    "openingBalance",
    "currentBalance",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT ON ("employeeId", "leaveYear")
    "employeeId",
    "leaveYear",
    "balanceBefore",
    "remainingLeave",
    "createdAt",
    "updatedAt"
FROM "employee_leaves"
WHERE NOT EXISTS (
    SELECT 1
    FROM "employee_leave_balance_seeds" AS seeds
    WHERE seeds."employeeId" = "employee_leaves"."employeeId"
      AND seeds."year" = "employee_leaves"."leaveYear"
)
ORDER BY "employeeId", "leaveYear", "updatedAt" DESC, "id" DESC
;

-- Capture revision history for legacy rows
INSERT INTO "employee_leave_revisions" (
    "employeeLeaveId",
    "revisionNo",
    "status",
    "leaveDays",
    "periodStart",
    "periodEnd",
    "balanceBefore",
    "remainingLeave",
    "notes",
    "rejectionNote",
    "submittedAt",
    "approvedAt",
    "rejectedAt",
    "cancelledAt",
    "createdAt",
    "updatedAt"
)
SELECT
    leaves."id",
    leaves."revisionNo",
    leaves."status",
    leaves."leaveDays",
    leaves."periodStart",
    leaves."periodEnd",
    leaves."balanceBefore",
    leaves."remainingLeave",
    leaves."notes",
    leaves."rejectionNote",
    leaves."submittedAt",
    leaves."approvedAt",
    leaves."rejectedAt",
    leaves."cancelledAt",
    leaves."createdAt",
    leaves."updatedAt"
FROM "employee_leaves" AS leaves
WHERE NOT EXISTS (
    SELECT 1
    FROM "employee_leave_revisions" AS revisions
    WHERE revisions."employeeLeaveId" = leaves."id"
      AND revisions."revisionNo" = leaves."revisionNo"
);

-- Make new workflow fields required after backfill
ALTER TABLE "employee_leaves"
ALTER COLUMN "balanceBefore" SET NOT NULL,
ALTER COLUMN "leaveYear" SET NOT NULL,
ALTER COLUMN "requestNumber" SET NOT NULL;

-- CreateIndex
CREATE INDEX "employee_leave_revisions_employeeLeaveId_idx" ON "employee_leave_revisions"("employeeLeaveId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_leave_revisions_employeeLeaveId_revisionNo_key" ON "employee_leave_revisions"("employeeLeaveId", "revisionNo");

-- CreateIndex
CREATE INDEX "employee_leave_approvals_employeeLeaveId_idx" ON "employee_leave_approvals"("employeeLeaveId");

-- CreateIndex
CREATE INDEX "employee_leave_approvals_approverEmployeeId_idx" ON "employee_leave_approvals"("approverEmployeeId");

-- CreateIndex
CREATE INDEX "employee_leave_approvals_status_idx" ON "employee_leave_approvals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_leave_approvals_employeeLeaveId_revisionNo_stageOr_key" ON "employee_leave_approvals"("employeeLeaveId", "revisionNo", "stageOrder", "approverEmployeeId");

-- CreateIndex
CREATE INDEX "employee_leave_balance_seeds_employeeId_idx" ON "employee_leave_balance_seeds"("employeeId");

-- CreateIndex
CREATE INDEX "employee_leave_balance_seeds_year_idx" ON "employee_leave_balance_seeds"("year");

-- CreateIndex
CREATE UNIQUE INDEX "employee_leave_balance_seeds_employeeId_year_key" ON "employee_leave_balance_seeds"("employeeId", "year");

-- CreateIndex
CREATE INDEX "email_outbox_employeeLeaveId_idx" ON "email_outbox"("employeeLeaveId");

-- CreateIndex
CREATE INDEX "email_outbox_employeeLeaveApprovalId_idx" ON "email_outbox"("employeeLeaveApprovalId");

-- CreateIndex
CREATE INDEX "email_outbox_status_idx" ON "email_outbox"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_leaves_requestNumber_key" ON "employee_leaves"("requestNumber");

-- CreateIndex
CREATE INDEX "employee_leaves_status_idx" ON "employee_leaves"("status");

-- CreateIndex
CREATE INDEX "employee_leaves_leaveYear_idx" ON "employee_leaves"("leaveYear");

-- AddForeignKey
ALTER TABLE "employee_leave_revisions" ADD CONSTRAINT "employee_leave_revisions_employeeLeaveId_fkey" FOREIGN KEY ("employeeLeaveId") REFERENCES "employee_leaves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_approvals" ADD CONSTRAINT "employee_leave_approvals_employeeLeaveId_fkey" FOREIGN KEY ("employeeLeaveId") REFERENCES "employee_leaves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_approvals" ADD CONSTRAINT "employee_leave_approvals_approverEmployeeId_fkey" FOREIGN KEY ("approverEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leave_balance_seeds" ADD CONSTRAINT "employee_leave_balance_seeds_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_employeeLeaveId_fkey" FOREIGN KEY ("employeeLeaveId") REFERENCES "employee_leaves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_employeeLeaveApprovalId_fkey" FOREIGN KEY ("employeeLeaveApprovalId") REFERENCES "employee_leave_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
