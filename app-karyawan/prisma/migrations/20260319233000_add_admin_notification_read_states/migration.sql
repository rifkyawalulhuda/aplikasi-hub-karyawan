CREATE TABLE "admin_notification_read_states" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "notificationId" VARCHAR(255) NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notification_read_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_notification_read_states_employeeId_notificationId_key"
ON "admin_notification_read_states"("employeeId", "notificationId");

CREATE INDEX "admin_notification_read_states_employeeId_idx"
ON "admin_notification_read_states"("employeeId");

CREATE INDEX "admin_notification_read_states_readAt_idx"
ON "admin_notification_read_states"("readAt");

ALTER TABLE "admin_notification_read_states"
ADD CONSTRAINT "admin_notification_read_states_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employees"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
