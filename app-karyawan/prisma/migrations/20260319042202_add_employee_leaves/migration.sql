-- CreateTable
CREATE TABLE "employee_leaves" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "masterCutiKaryawanId" INTEGER NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "remainingLeave" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_leaves_employeeId_idx" ON "employee_leaves"("employeeId");

-- CreateIndex
CREATE INDEX "employee_leaves_masterCutiKaryawanId_idx" ON "employee_leaves"("masterCutiKaryawanId");

-- AddForeignKey
ALTER TABLE "employee_leaves" ADD CONSTRAINT "employee_leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_leaves" ADD CONSTRAINT "employee_leaves_masterCutiKaryawanId_fkey" FOREIGN KEY ("masterCutiKaryawanId") REFERENCES "master_cuti_karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
