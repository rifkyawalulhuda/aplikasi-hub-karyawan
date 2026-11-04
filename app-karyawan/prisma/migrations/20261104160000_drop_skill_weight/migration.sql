-- Weighting was removed to keep the skill model simple: every required skill
-- counts equally towards readiness. Only the per-grade target level remains.

-- AlterTable
ALTER TABLE "job_requirement_skills" DROP COLUMN "weight";

-- DropEnum
DROP TYPE "SkillWeight";
