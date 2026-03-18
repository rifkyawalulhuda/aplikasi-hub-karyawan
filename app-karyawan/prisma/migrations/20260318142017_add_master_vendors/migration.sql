-- CreateTable
CREATE TABLE "master_vendors" (
    "id" SERIAL NOT NULL,
    "vendorName" VARCHAR(255) NOT NULL,
    "vendorType" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "picName" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "detailLainnya" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_vendors_pkey" PRIMARY KEY ("id")
);
