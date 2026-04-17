CREATE TYPE "EmployeeSelfServiceChangeType" AS ENUM ('PASSWORD', 'CONTACT', 'EMAIL', 'CONTACT_EMAIL');

CREATE TABLE "employee_self_service_change_logs" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "changeType" "EmployeeSelfServiceChangeType" NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_self_service_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "employee_self_service_change_logs_employeeId_idx" ON "employee_self_service_change_logs"("employeeId");
CREATE INDEX "employee_self_service_change_logs_changeType_idx" ON "employee_self_service_change_logs"("changeType");
CREATE INDEX "employee_self_service_change_logs_createdAt_idx" ON "employee_self_service_change_logs"("createdAt");

ALTER TABLE "employee_self_service_change_logs"
ADD CONSTRAINT "employee_self_service_change_logs_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
