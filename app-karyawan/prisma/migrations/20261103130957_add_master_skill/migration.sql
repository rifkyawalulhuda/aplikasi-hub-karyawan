-- AlterTable
ALTER TABLE "job_requirement_skills" ADD COLUMN     "masterSkillId" INTEGER;

-- CreateTable
CREATE TABLE "master_skills" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "master_skills_category_idx" ON "master_skills"("category");

-- CreateIndex
CREATE UNIQUE INDEX "master_skills_category_name_key" ON "master_skills"("category", "name");

-- CreateIndex
CREATE INDEX "job_requirement_skills_masterSkillId_idx" ON "job_requirement_skills"("masterSkillId");

-- Backfill master_skills from existing requirement rows
INSERT INTO "master_skills" ("category", "name", "createdAt", "updatedAt")
SELECT DISTINCT "category", "name", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "job_requirement_skills"
ON CONFLICT ("category", "name") DO NOTHING;

UPDATE "job_requirement_skills" AS s
SET "masterSkillId" = m."id"
FROM "master_skills" AS m
WHERE s."category" = m."category" AND s."name" = m."name";

-- AddForeignKey
ALTER TABLE "job_requirement_skills" ADD CONSTRAINT "job_requirement_skills_masterSkillId_fkey" FOREIGN KEY ("masterSkillId") REFERENCES "master_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
