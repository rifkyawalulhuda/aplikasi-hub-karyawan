-- CreateTable
CREATE TABLE "employee_license_certifications" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "masterDokKaryawanId" INTEGER NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "documentNumber" VARCHAR(255) NOT NULL,
    "issuerSnapshot" VARCHAR(255) NOT NULL,
    "expiryDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_license_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_license_certifications_employeeId_idx" ON "employee_license_certifications"("employeeId");

-- CreateIndex
CREATE INDEX "employee_license_certifications_masterDokKaryawanId_idx" ON "employee_license_certifications"("masterDokKaryawanId");

-- AddForeignKey
ALTER TABLE "employee_license_certifications" ADD CONSTRAINT "employee_license_certifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_license_certifications" ADD CONSTRAINT "employee_license_certifications_masterDokKaryawanId_fkey" FOREIGN KEY ("masterDokKaryawanId") REFERENCES "master_dok_karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
