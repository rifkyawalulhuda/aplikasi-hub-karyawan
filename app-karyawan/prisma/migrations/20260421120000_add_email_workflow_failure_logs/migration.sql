CREATE TYPE "EmailWorkflowFailureStatus" AS ENUM ('OPEN', 'RESOLVED');

CREATE TABLE "email_workflow_failure_logs" (
    "id" SERIAL NOT NULL,
    "event" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "employeeLeaveId" INTEGER,
    "employeeLeaveApprovalId" INTEGER,
    "recipientEmail" VARCHAR(255) NOT NULL,
    "recipientName" VARCHAR(255),
    "subject" VARCHAR(255) NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "status" "EmailWorkflowFailureStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedByEmployeeId" INTEGER,
    "resolvedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_workflow_failure_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_workflow_failure_logs_event_idx" ON "email_workflow_failure_logs"("event");
CREATE INDEX "email_workflow_failure_logs_entityType_idx" ON "email_workflow_failure_logs"("entityType");
CREATE INDEX "email_workflow_failure_logs_employeeLeaveId_idx" ON "email_workflow_failure_logs"("employeeLeaveId");
CREATE INDEX "email_workflow_failure_logs_employeeLeaveApprovalId_idx" ON "email_workflow_failure_logs"("employeeLeaveApprovalId");
CREATE INDEX "email_workflow_failure_logs_status_idx" ON "email_workflow_failure_logs"("status");
CREATE INDEX "email_workflow_failure_logs_resolvedAt_idx" ON "email_workflow_failure_logs"("resolvedAt");

ALTER TABLE "email_workflow_failure_logs"
ADD CONSTRAINT "email_workflow_failure_logs_employeeLeaveId_fkey"
FOREIGN KEY ("employeeLeaveId") REFERENCES "employee_leaves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_workflow_failure_logs"
ADD CONSTRAINT "email_workflow_failure_logs_employeeLeaveApprovalId_fkey"
FOREIGN KEY ("employeeLeaveApprovalId") REFERENCES "employee_leave_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_workflow_failure_logs"
ADD CONSTRAINT "email_workflow_failure_logs_resolvedByEmployeeId_fkey"
FOREIGN KEY ("resolvedByEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
