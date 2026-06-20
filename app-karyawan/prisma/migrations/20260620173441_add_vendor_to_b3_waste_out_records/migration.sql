-- AlterTable
ALTER TABLE "b3_waste_out_records" ADD COLUMN     "vendorId" INTEGER;

-- AddForeignKey
ALTER TABLE "b3_waste_out_records" ADD CONSTRAINT "b3_waste_out_records_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "master_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
