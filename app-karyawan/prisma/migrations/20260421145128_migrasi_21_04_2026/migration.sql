-- AlterTable
ALTER TABLE "admin_notification_read_states" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "admin_notification_records" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "email_workflow_failure_logs" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "employee_leave_replacement_assignees" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "employee_self_service_change_logs" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameForeignKey
ALTER TABLE "employee_leave_replacement_assignees" RENAME CONSTRAINT "employee_leave_replacement_assignees_employee_leave_id_fkey" TO "employee_leave_replacement_assignees_employeeLeaveId_fkey";

-- RenameForeignKey
ALTER TABLE "employee_leave_replacement_assignees" RENAME CONSTRAINT "employee_leave_replacement_assignees_employee_leave_id_revision" TO "employee_leave_replacement_assignees_employeeLeaveId_revis_fkey";

-- RenameForeignKey
ALTER TABLE "employee_leave_replacement_assignees" RENAME CONSTRAINT "employee_leave_replacement_assignees_replacement_employee_id_fk" TO "employee_leave_replacement_assignees_replacementEmployeeId_fkey";

-- RenameIndex
ALTER INDEX "employee_leave_database_employeeId_masterCutiKaryawanId_year_ke" RENAME TO "employee_leave_database_employeeId_masterCutiKaryawanId_yea_key";

-- RenameIndex
ALTER INDEX "employee_leave_replacement_assignees_employee_leave_id_idx" RENAME TO "employee_leave_replacement_assignees_employeeLeaveId_idx";

-- RenameIndex
ALTER INDEX "employee_leave_replacement_assignees_employee_leave_id_revision" RENAME TO "employee_leave_replacement_assignees_employeeLeaveId_revisi_idx";

-- RenameIndex
ALTER INDEX "employee_leave_replacement_assignees_replacement_employee_id_id" RENAME TO "employee_leave_replacement_assignees_replacementEmployeeId_idx";
