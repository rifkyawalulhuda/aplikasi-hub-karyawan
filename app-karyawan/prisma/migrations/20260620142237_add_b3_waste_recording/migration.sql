-- CreateTable
CREATE TABLE "b3_waste_types" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b3_waste_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b3_waste_records" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "jenisLimbahId" INTEGER NOT NULL,
    "tanggalMasuk" DATE NOT NULL,
    "sumberLimbah" VARCHAR(200) NOT NULL,
    "jumlahMasuk" DECIMAL(10,2) NOT NULL,
    "maksimalPenyimpanan" INTEGER NOT NULL,
    "tanggalBatas" DATE NOT NULL,
    "petugasPenanggungJawab" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b3_waste_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b3_waste_out_records" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "wasteRecordId" INTEGER NOT NULL,
    "tanggalKeluar" DATE NOT NULL,
    "jumlahKeluar" DECIMAL(10,2) NOT NULL,
    "tujuanPenyerahan" VARCHAR(200) NOT NULL,
    "nomorDokumen" VARCHAR(100) NOT NULL,
    "petugasPenanggungJawab" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b3_waste_out_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "b3_waste_types_siteId_kode_key" ON "b3_waste_types"("siteId", "kode");

-- AddForeignKey
ALTER TABLE "b3_waste_records" ADD CONSTRAINT "b3_waste_records_jenisLimbahId_fkey" FOREIGN KEY ("jenisLimbahId") REFERENCES "b3_waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b3_waste_out_records" ADD CONSTRAINT "b3_waste_out_records_wasteRecordId_fkey" FOREIGN KEY ("wasteRecordId") REFERENCES "b3_waste_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
