-- Notification history is tenant-scoped: records created from a site's live
-- items carry that site's id, so reads and archival can be constrained to it.
ALTER TABLE "admin_notification_records" ADD COLUMN "siteId" INTEGER;

CREATE INDEX "admin_notification_records_siteId_isActive_idx"
    ON "admin_notification_records"("siteId", "isActive");