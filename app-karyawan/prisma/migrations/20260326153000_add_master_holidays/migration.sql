-- CreateTable
CREATE TABLE "master_holidays" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "holidayDate" DATE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_holidays_pkey" PRIMARY KEY ("id")
);
