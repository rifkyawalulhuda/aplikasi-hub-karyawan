-- CreateTable
CREATE TABLE "master_cuti_karyawan" (
    "id" SERIAL NOT NULL,
    "leaveType" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_cuti_karyawan_pkey" PRIMARY KEY ("id")
);
