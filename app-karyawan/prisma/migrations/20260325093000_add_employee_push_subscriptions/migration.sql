-- CreateTable
CREATE TABLE "employee_push_subscriptions" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expirationTime" TIMESTAMP(3),
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_push_subscriptions_employeeId_idx" ON "employee_push_subscriptions"("employeeId");

-- CreateIndex
CREATE INDEX "employee_push_subscriptions_isActive_idx" ON "employee_push_subscriptions"("isActive");

-- CreateIndex
CREATE INDEX "employee_push_subscriptions_lastUsedAt_idx" ON "employee_push_subscriptions"("lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "employee_push_subscriptions_employeeId_endpoint_key" ON "employee_push_subscriptions"("employeeId", "endpoint");

-- AddForeignKey
ALTER TABLE "employee_push_subscriptions" ADD CONSTRAINT "employee_push_subscriptions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
