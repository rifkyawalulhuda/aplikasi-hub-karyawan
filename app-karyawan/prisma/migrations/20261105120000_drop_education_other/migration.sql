-- Education is now a fixed master list (SMA/D3/S1/S2). The free-text variant was
-- never used by any profile row, so the column is dropped instead of kept as a
-- dead alternative path.

-- AlterTable
ALTER TABLE "job_requirement_profiles" DROP COLUMN "educationOther";
