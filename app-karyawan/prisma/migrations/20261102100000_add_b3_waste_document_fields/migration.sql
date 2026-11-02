-- Rename nomorDokumen ke nomorSuratJalan (dokumen cetak memisahkan e-Manifest dan Surat Jalan)
ALTER TABLE "b3_waste_out_records" RENAME COLUMN "nomorDokumen" TO "nomorSuratJalan";

-- Tambah kolom dokumen tambahan
ALTER TABLE "b3_waste_out_records" ADD COLUMN "nomorEManifest" VARCHAR(100);
ALTER TABLE "b3_waste_out_records" ADD COLUMN "nopolKendaraan" VARCHAR(20);
