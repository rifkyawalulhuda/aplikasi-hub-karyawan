-- CreateTable
CREATE TABLE "master_admins" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_admins_employeeId_key" ON "master_admins"("employeeId");

-- CreateIndex
CREATE INDEX "master_admins_employeeId_idx" ON "master_admins"("employeeId");

-- AddForeignKey
ALTER TABLE "master_admins" ADD CONSTRAINT "master_admins_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
