-- CreateEnum
CREATE TYPE "DisciplineLetterCategory" AS ENUM ('WARNING_LETTER', 'REPRIMAND');

-- AlterTable
ALTER TABLE "warning_letters" ADD COLUMN     "category" "DisciplineLetterCategory" NOT NULL DEFAULT 'WARNING_LETTER',
ADD COLUMN     "departmentName" VARCHAR(255),
ADD COLUMN     "jobLevelName" VARCHAR(255),
ALTER COLUMN "masterDokPkbId" DROP NOT NULL,
ALTER COLUMN "warningLevel" DROP NOT NULL,
ALTER COLUMN "articleLabel" DROP NOT NULL,
ALTER COLUMN "articleContent" DROP NOT NULL;
