-- CreateTable
CREATE TABLE "master_dok_karyawan" (
    "id" SERIAL NOT NULL,
    "documentName" VARCHAR(255) NOT NULL,
    "documentType" VARCHAR(100) NOT NULL,
    "issuer" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_dok_karyawan_pkey" PRIMARY KEY ("id")
);
