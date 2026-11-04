-- Every assessment must belong to a period so historical snapshots stay meaningful.
ALTER TABLE "employee_skill_assessments" ALTER COLUMN "periodId" SET NOT NULL;

-- AlterForeignKey: deleting a period should never silently orphan assessments
ALTER TABLE "employee_skill_assessments" DROP CONSTRAINT "employee_skill_assessments_periodId_fkey";

ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "skill_assessment_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
