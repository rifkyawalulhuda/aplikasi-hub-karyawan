-- CreateTable
CREATE TABLE "unit_license_certifications" (
    "id" SERIAL NOT NULL,
    "masterUnitId" INTEGER NOT NULL,
    "assetNo" VARCHAR(255) NOT NULL,
    "documentNumber" VARCHAR(255) NOT NULL,
    "issuedBy" VARCHAR(255) NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "expiryDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_license_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unit_license_certifications_masterUnitId_idx" ON "unit_license_certifications"("masterUnitId");

-- CreateIndex
CREATE INDEX "unit_license_certifications_vendorId_idx" ON "unit_license_certifications"("vendorId");

-- AddForeignKey
ALTER TABLE "unit_license_certifications" ADD CONSTRAINT "unit_license_certifications_masterUnitId_fkey" FOREIGN KEY ("masterUnitId") REFERENCES "master_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_license_certifications" ADD CONSTRAINT "unit_license_certifications_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "master_vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
