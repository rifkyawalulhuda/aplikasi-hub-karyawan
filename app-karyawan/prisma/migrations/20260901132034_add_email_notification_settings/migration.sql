-- CreateTable
CREATE TABLE "email_notification_settings" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sendHour" INTEGER NOT NULL DEFAULT 7,
    "unitThresholds" INTEGER[] DEFAULT ARRAY[90, 60, 30, 0]::INTEGER[],
    "employeeThresholds" INTEGER[] DEFAULT ARRAY[90, 60, 30, 0]::INTEGER[],
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_settings_siteId_key" ON "email_notification_settings"("siteId");

-- CreateIndex
CREATE INDEX "email_notification_settings_siteId_idx" ON "email_notification_settings"("siteId");

-- AddForeignKey
ALTER TABLE "email_notification_settings" ADD CONSTRAINT "email_notification_settings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "master_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
