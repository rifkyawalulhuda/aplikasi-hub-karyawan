-- CreateTable
CREATE TABLE "warning_letters" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "superiorEmployeeId" INTEGER NOT NULL,
    "masterDokPkbId" INTEGER NOT NULL,
    "warningLevel" INTEGER NOT NULL,
    "letterNumber" VARCHAR(25) NOT NULL,
    "letterDate" DATE NOT NULL,
    "violation" TEXT NOT NULL,
    "articleLabel" VARCHAR(255) NOT NULL,
    "articleContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warning_letters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warning_letters_employeeId_idx" ON "warning_letters"("employeeId");

-- CreateIndex
CREATE INDEX "warning_letters_superiorEmployeeId_idx" ON "warning_letters"("superiorEmployeeId");

-- CreateIndex
CREATE INDEX "warning_letters_masterDokPkbId_idx" ON "warning_letters"("masterDokPkbId");

-- AddForeignKey
ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_superiorEmployeeId_fkey" FOREIGN KEY ("superiorEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_masterDokPkbId_fkey" FOREIGN KEY ("masterDokPkbId") REFERENCES "master_dok_pkb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
