CREATE TABLE "admin_notification_records" (
    "id" SERIAL NOT NULL,
    "notificationId" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "targetPath" VARCHAR(255),
    "targetSearch" VARCHAR(255),
    "href" VARCHAR(500),
    "dateLabel" VARCHAR(255),
    "sortDate" TIMESTAMP(3) NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notification_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_notification_records_notificationId_key" ON "admin_notification_records"("notificationId");
CREATE INDEX "admin_notification_records_category_idx" ON "admin_notification_records"("category");
CREATE INDEX "admin_notification_records_severity_idx" ON "admin_notification_records"("severity");
CREATE INDEX "admin_notification_records_sortDate_idx" ON "admin_notification_records"("sortDate");
CREATE INDEX "admin_notification_records_lastDetectedAt_idx" ON "admin_notification_records"("lastDetectedAt");
CREATE INDEX "admin_notification_records_isActive_idx" ON "admin_notification_records"("isActive");
