DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveDatabaseHistorySourceType') THEN
		CREATE TYPE "LeaveDatabaseHistorySourceType" AS ENUM (
			'WORKFLOW_APPROVED',
			'ADMIN_CREATE',
			'ADMIN_UPDATE',
			'ADMIN_IMPORT'
		);
	END IF;
END $$;

ALTER TABLE "employee_leave_database"
ADD COLUMN "year" INTEGER;

UPDATE "employee_leave_database"
SET "year" = EXTRACT(YEAR FROM "periodStart")::INTEGER
WHERE "year" IS NULL;

CREATE TABLE "employee_leave_database_histories" (
	"id" SERIAL NOT NULL,
	"employeeLeaveDatabaseId" INTEGER NOT NULL,
	"employeeLeaveId" INTEGER,
	"sourceType" "LeaveDatabaseHistorySourceType" NOT NULL,
	"changeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"leaveDays" INTEGER NOT NULL,
	"periodStart" DATE NOT NULL,
	"periodEnd" DATE NOT NULL,
	"balanceBefore" INTEGER NOT NULL,
	"balanceAfter" INTEGER NOT NULL,
	"notes" TEXT,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "employee_leave_database_histories_pkey" PRIMARY KEY ("id")
);

WITH ranked AS (
	SELECT
		eld."id",
		eld."employeeId",
		eld."masterCutiKaryawanId",
		eld."year",
		eld."leaveDays",
		eld."periodStart",
		eld."periodEnd",
		eld."remainingLeave",
		eld."notes",
		COALESCE(eld."updatedAt", eld."createdAt") AS "changeDate",
		FIRST_VALUE(eld."id") OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
			ORDER BY eld."createdAt" ASC, eld."id" ASC
		) AS "keeperId",
		ROW_NUMBER() OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
			ORDER BY eld."createdAt" ASC, eld."id" ASC
		) AS "sequenceNo"
	FROM "employee_leave_database" eld
)
INSERT INTO "employee_leave_database_histories" (
	"employeeLeaveDatabaseId",
	"employeeLeaveId",
	"sourceType",
	"changeDate",
	"leaveDays",
	"periodStart",
	"periodEnd",
	"balanceBefore",
	"balanceAfter",
	"notes"
)
SELECT
	ranked."keeperId",
	NULL,
	CASE
		WHEN ranked."notes" ILIKE '%Ref Workflow:%' THEN 'WORKFLOW_APPROVED'::"LeaveDatabaseHistorySourceType"
		WHEN ranked."sequenceNo" = 1 THEN 'ADMIN_CREATE'::"LeaveDatabaseHistorySourceType"
		ELSE 'ADMIN_IMPORT'::"LeaveDatabaseHistorySourceType"
	END,
	ranked."changeDate",
	ranked."leaveDays",
	ranked."periodStart",
	ranked."periodEnd",
	CASE
		WHEN ranked."notes" ILIKE '%Ref Workflow:%' THEN ranked."remainingLeave" + ranked."leaveDays"
		ELSE ranked."remainingLeave"
	END,
	ranked."remainingLeave",
	ranked."notes"
FROM ranked;

WITH normalized AS (
	SELECT
		eld."id",
		ROW_NUMBER() OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
			ORDER BY eld."createdAt" ASC, eld."id" ASC
		) AS "sequenceNo",
		MAX(GREATEST(eld."leaveDays", eld."remainingLeave")) OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
		) AS "openingBalance",
		MIN(eld."periodStart") OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
		) AS "normalizedPeriodStart",
		MAX(eld."periodEnd") OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
		) AS "normalizedPeriodEnd",
		FIRST_VALUE(eld."remainingLeave") OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
			ORDER BY COALESCE(eld."updatedAt", eld."createdAt") DESC, eld."id" DESC
		) AS "currentRemainingLeave",
		FIRST_VALUE(eld."notes") OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
			ORDER BY eld."createdAt" ASC, eld."id" ASC
		) AS "normalizedNotes"
	FROM "employee_leave_database" eld
)
UPDATE "employee_leave_database" AS target
SET
	"leaveDays" = normalized."openingBalance",
	"periodStart" = normalized."normalizedPeriodStart",
	"periodEnd" = normalized."normalizedPeriodEnd",
	"remainingLeave" = normalized."currentRemainingLeave",
	"notes" = normalized."normalizedNotes",
	"updatedAt" = CURRENT_TIMESTAMP
FROM normalized
WHERE target."id" = normalized."id"
  AND normalized."sequenceNo" = 1;

WITH ranked AS (
	SELECT
		eld."id",
		ROW_NUMBER() OVER (
			PARTITION BY eld."employeeId", eld."masterCutiKaryawanId", eld."year"
			ORDER BY eld."createdAt" ASC, eld."id" ASC
		) AS "sequenceNo"
	FROM "employee_leave_database" eld
)
DELETE FROM "employee_leave_database" AS target
USING ranked
WHERE target."id" = ranked."id"
  AND ranked."sequenceNo" > 1;

ALTER TABLE "employee_leave_database"
ALTER COLUMN "year" SET NOT NULL;

CREATE INDEX "employee_leave_database_year_idx" ON "employee_leave_database"("year");
CREATE UNIQUE INDEX "employee_leave_database_employeeId_masterCutiKaryawanId_year_key"
ON "employee_leave_database"("employeeId", "masterCutiKaryawanId", "year");

CREATE INDEX "employee_leave_database_histories_employeeLeaveDatabaseId_idx"
ON "employee_leave_database_histories"("employeeLeaveDatabaseId");

CREATE INDEX "employee_leave_database_histories_employeeLeaveId_idx"
ON "employee_leave_database_histories"("employeeLeaveId");

CREATE INDEX "employee_leave_database_histories_sourceType_idx"
ON "employee_leave_database_histories"("sourceType");

CREATE INDEX "employee_leave_database_histories_changeDate_idx"
ON "employee_leave_database_histories"("changeDate");

ALTER TABLE "employee_leave_database_histories"
ADD CONSTRAINT "employee_leave_database_histories_employeeLeaveDatabaseId_fkey"
FOREIGN KEY ("employeeLeaveDatabaseId") REFERENCES "employee_leave_database"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_leave_database_histories"
ADD CONSTRAINT "employee_leave_database_histories_employeeLeaveId_fkey"
FOREIGN KEY ("employeeLeaveId") REFERENCES "employee_leaves"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
