-- CreateEnum
CREATE TYPE "GuidanceRecordCategory" AS ENUM ('GUIDANCE', 'DIRECTION');

-- AlterTable
ALTER TABLE "guidance_records" ADD COLUMN     "category" "GuidanceRecordCategory" NOT NULL DEFAULT 'GUIDANCE',
ADD COLUMN     "problemFacedSecondary" TEXT;
