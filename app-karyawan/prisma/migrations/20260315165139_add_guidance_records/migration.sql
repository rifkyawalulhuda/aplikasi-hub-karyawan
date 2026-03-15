-- CreateTable
CREATE TABLE "guidance_records" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "meetingNumber" INTEGER NOT NULL,
    "meetingDate" DATE NOT NULL,
    "meetingTime" VARCHAR(10) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "problemFaced" TEXT NOT NULL,
    "problemCause" TEXT NOT NULL,
    "problemSolving" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guidance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guidance_records_employeeId_idx" ON "guidance_records"("employeeId");

-- AddForeignKey
ALTER TABLE "guidance_records" ADD CONSTRAINT "guidance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
