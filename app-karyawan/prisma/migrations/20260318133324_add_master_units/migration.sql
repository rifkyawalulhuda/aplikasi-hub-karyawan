-- CreateTable
CREATE TABLE "master_units" (
    "id" SERIAL NOT NULL,
    "unitName" VARCHAR(255) NOT NULL,
    "unitType" VARCHAR(100) NOT NULL,
    "capacity" VARCHAR(255) NOT NULL,
    "unitSerialNumber" VARCHAR(255) NOT NULL,
    "detailLainnya" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_units_pkey" PRIMARY KEY ("id")
);
