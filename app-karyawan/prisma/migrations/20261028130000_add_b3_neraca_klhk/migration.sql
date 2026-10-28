-- Migration: Neraca Limbah B3 (format KLHK)
-- 1. Treatment category per out record + environmental approval flag per waste type.
-- 2. Per-site company profile for document headers.
-- 3. Per-site/period storage for residu and notes.

BEGIN;

-- ============================================================
-- 1. Treatment category + environmental approval
-- ============================================================
CREATE TYPE "B3WasteTreatment" AS ENUM (
    'DISIMPAN',
    'DIMANFAATKAN',
    'DIOLAH',
    'DITIMBUN',
    'DISERAHKAN_KE_PIHAK_KETIGA',
    'EKSPOR',
    'PERLAKUAN_LAINNYA'
);

ALTER TABLE "b3_waste_types" ADD COLUMN "hasEnvironmentalApproval" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "b3_waste_out_records" ADD COLUMN "perlakuan" "B3WasteTreatment" NOT NULL DEFAULT 'DISERAHKAN_KE_PIHAK_KETIGA';

-- Backfill existing rows from the free-text destination
UPDATE "b3_waste_out_records"
SET "perlakuan" = 'DIOLAH'
WHERE UPPER("tujuanPenyerahan") LIKE '%PENGOLAHAN%';

UPDATE "b3_waste_out_records"
SET "perlakuan" = 'DISERAHKAN_KE_PIHAK_KETIGA'
WHERE UPPER("tujuanPenyerahan") LIKE '%PENGUMPULAN%';

-- ============================================================
-- 2. Site profile
-- ============================================================
CREATE TABLE "site_profiles" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "businessField" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phoneNumber" VARCHAR(100),
    "responsibleName" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_profiles_siteId_key" ON "site_profiles"("siteId");

ALTER TABLE "site_profiles" ADD CONSTRAINT "site_profiles_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 3. Neraca period data
-- ============================================================
CREATE TABLE "b3_waste_neraca_periods" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "triwulan" INTEGER NOT NULL,
    "residu" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b3_waste_neraca_periods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "b3_waste_neraca_periods_siteId_tahun_triwulan_key"
    ON "b3_waste_neraca_periods"("siteId", "tahun", "triwulan");
CREATE INDEX "b3_waste_neraca_periods_siteId_idx" ON "b3_waste_neraca_periods"("siteId");

ALTER TABLE "b3_waste_neraca_periods" ADD CONSTRAINT "b3_waste_neraca_periods_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;