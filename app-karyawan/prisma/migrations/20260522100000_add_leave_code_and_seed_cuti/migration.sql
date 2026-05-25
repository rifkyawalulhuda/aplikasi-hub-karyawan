-- Migration: Add leaveCode column to master_cuti_karyawan and seed leave types

BEGIN;

-- 1. Add leaveCode column
ALTER TABLE "master_cuti_karyawan" ADD COLUMN "leaveCode" VARCHAR(10);

-- 2. Update existing records if they match known leave types
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'C1' WHERE LOWER(TRIM("leaveType")) = 'cuti tahunan';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'C2' WHERE LOWER(TRIM("leaveType")) IN ('cuti 10 tahunan', 'cuti 10 tahun');
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'C3' WHERE LOWER(TRIM("leaveType")) IN ('cuti spesial', 'cuti special');
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'H1' WHERE LOWER(TRIM("leaveType")) = 'cuti haid';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'H2' WHERE LOWER(TRIM("leaveType")) = 'cuti melahirkan';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'DP' WHERE LOWER(TRIM("leaveType")) = 'dispensasi';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'S1' WHERE LOWER(TRIM("leaveType")) = 'sakit ijin dokter';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'S2' WHERE LOWER(TRIM("leaveType")) = 'sakit karena kecelakaan';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'SC' WHERE LOWER(TRIM("leaveType")) = 'skorsing';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'A' WHERE LOWER(TRIM("leaveType")) = 'absen';
UPDATE "master_cuti_karyawan" SET "leaveCode" = 'B' WHERE LOWER(TRIM("leaveType")) = 'ijin';

-- 3. Seed all standard leave types (skip if already exists by leaveType name)
INSERT INTO "master_cuti_karyawan" ("leaveType", "leaveCode", "updatedAt")
SELECT v."leaveType", v."leaveCode", CURRENT_TIMESTAMP
FROM (VALUES
    ('Cuti Tahunan', 'C1'),
    ('Cuti 10 Tahunan', 'C2'),
    ('Cuti Spesial', 'C3'),
    ('Cuti Haid', 'H1'),
    ('Cuti Melahirkan', 'H2'),
    ('Dispensasi', 'DP'),
    ('Sakit Ijin Dokter', 'S1'),
    ('Sakit Karena Kecelakaan', 'S2'),
    ('Skorsing', 'SC'),
    ('Absen', 'A'),
    ('Ijin', 'B')
) AS v("leaveType", "leaveCode")
WHERE NOT EXISTS (
    SELECT 1 FROM "master_cuti_karyawan" m
    WHERE LOWER(TRIM(m."leaveType")) = LOWER(TRIM(v."leaveType"))
);

COMMIT;
