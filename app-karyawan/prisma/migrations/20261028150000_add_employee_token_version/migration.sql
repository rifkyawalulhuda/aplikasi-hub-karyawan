-- Employee sessions need a revocation dimension, mirroring
-- master_admins.tokenVersion: rotating a credential increments the counter so
-- every outstanding bearer token stops matching requireEmployeeAuth.
ALTER TABLE "employees" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;