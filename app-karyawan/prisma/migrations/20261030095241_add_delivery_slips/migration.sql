-- AlterTable
ALTER TABLE "email_workflow_failure_logs" ALTER COLUMN "recipientName" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "delivery_slips" (
    "id" SERIAL NOT NULL,
    "slipNumber" VARCHAR(100) NOT NULL,
    "slipDate" DATE NOT NULL,
    "recipientName" VARCHAR(255) NOT NULL,
    "recipientAddress" TEXT,
    "recipientAttention" VARCHAR(255),
    "recipientPosition" VARCHAR(255),
    "senderName" VARCHAR(255) NOT NULL,
    "senderPosition" VARCHAR(255),
    "senderAddress" TEXT,
    "senderEmployeeId" INTEGER,
    "slipTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slipTypeOther" VARCHAR(255),
    "documentConfidentiality" VARCHAR(50),
    "documentConfidentialityOther" VARCHAR(255),
    "goodsTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goodsTypeOther" VARCHAR(255),
    "handlingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "handlingTypeOther" VARCHAR(255),
    "purposes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "purposeOther" VARCHAR(255),
    "confirmationMode" VARCHAR(50),
    "confirmationEmail" TEXT,
    "returnAddress" TEXT,
    "senderDate" DATE,
    "receiverName" VARCHAR(255) NOT NULL,
    "receiverPosition" VARCHAR(255) NOT NULL,
    "receiverDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" INTEGER NOT NULL,

    CONSTRAINT "delivery_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_slip_items" (
    "id" SERIAL NOT NULL,
    "deliverySlipId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "note" TEXT,

    CONSTRAINT "delivery_slip_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_slips_siteId_idx" ON "delivery_slips"("siteId");

-- CreateIndex
CREATE INDEX "delivery_slips_slipDate_idx" ON "delivery_slips"("slipDate");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_slips_siteId_slipNumber_key" ON "delivery_slips"("siteId", "slipNumber");

-- CreateIndex
CREATE INDEX "delivery_slip_items_deliverySlipId_idx" ON "delivery_slip_items"("deliverySlipId");

-- AddForeignKey
ALTER TABLE "delivery_slips" ADD CONSTRAINT "delivery_slips_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_slip_items" ADD CONSTRAINT "delivery_slip_items_deliverySlipId_fkey" FOREIGN KEY ("deliverySlipId") REFERENCES "delivery_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
