-- CreateTable
CREATE TABLE "non_b3_waste_types" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_b3_waste_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_b3_waste_records" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "jenisLimbahId" INTEGER NOT NULL,
    "tanggalMasuk" DATE NOT NULL,
    "tanggalKeluar" DATE NOT NULL,
    "jumlahKg" DECIMAL(10,2) NOT NULL,
    "nopolKendaraan" VARCHAR(20),
    "nomorDokumen" VARCHAR(100),
    "nomorSuratJalan" VARCHAR(100) NOT NULL,
    "petugasPenanggungJawab" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" INTEGER,

    CONSTRAINT "non_b3_waste_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "non_b3_waste_types_siteId_kode_key" ON "non_b3_waste_types"("siteId", "kode");

-- CreateIndex
CREATE INDEX "non_b3_waste_records_siteId_tanggalMasuk_idx" ON "non_b3_waste_records"("siteId", "tanggalMasuk");

-- AddForeignKey
ALTER TABLE "non_b3_waste_records" ADD CONSTRAINT "non_b3_waste_records_jenisLimbahId_fkey" FOREIGN KEY ("jenisLimbahId") REFERENCES "non_b3_waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_b3_waste_records" ADD CONSTRAINT "non_b3_waste_records_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "master_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
