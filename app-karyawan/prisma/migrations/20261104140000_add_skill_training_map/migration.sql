-- CreateTable
CREATE TABLE "skill_training_map" (
    "id" SERIAL NOT NULL,
    "masterSkillId" INTEGER NOT NULL,
    "masterTrainingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_training_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_training_map_masterSkillId_idx" ON "skill_training_map"("masterSkillId");

-- CreateIndex
CREATE INDEX "skill_training_map_masterTrainingId_idx" ON "skill_training_map"("masterTrainingId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_training_map_masterSkillId_masterTrainingId_key" ON "skill_training_map"("masterSkillId", "masterTrainingId");

-- AddForeignKey
ALTER TABLE "skill_training_map" ADD CONSTRAINT "skill_training_map_masterSkillId_fkey" FOREIGN KEY ("masterSkillId") REFERENCES "master_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_training_map" ADD CONSTRAINT "skill_training_map_masterTrainingId_fkey" FOREIGN KEY ("masterTrainingId") REFERENCES "master_trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
