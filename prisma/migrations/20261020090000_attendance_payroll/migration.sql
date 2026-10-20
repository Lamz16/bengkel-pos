ALTER TABLE "CompanySettings"
  ADD COLUMN IF NOT EXISTS "payrollPresentFactor" DECIMAL(5,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "payrollSickFactor" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payrollLeaveFactor" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payrollOwnerLeaveFactor" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payrollAutoAbsencePenalty" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "payrollAbsencePenaltyAmount" DECIMAL(18,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "MechanicAttendance_date_mechanicId_idx" ON "MechanicAttendance"("date", "mechanicId");
CREATE INDEX IF NOT EXISTS "MechanicDeduction_mechanicId_date_idx" ON "MechanicDeduction"("mechanicId", "date");

CREATE TABLE IF NOT EXISTS "PayrollPeriod" (
  "id" TEXT NOT NULL, "mechanicId" TEXT NOT NULL, "mechanicName" TEXT NOT NULL,
  "fromDate" TEXT NOT NULL, "toDate" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'Finalized',
  "dailyRateSnapshot" DECIMAL(18,2) NOT NULL, "paidDays" DECIMAL(8,2) NOT NULL,
  "baseSalary" DECIMAL(18,2) NOT NULL, "serviceBonus" DECIMAL(18,2) NOT NULL,
  "manualDeductions" DECIMAL(18,2) NOT NULL, "absenceDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "totalDeductions" DECIMAL(18,2) NOT NULL, "netSalary" DECIMAL(18,2) NOT NULL,
  "policySnapshot" JSONB NOT NULL, "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalizedById" TEXT NOT NULL, "finalizedByName" TEXT NOT NULL,
  "reopenedAt" TIMESTAMP(3), "reopenedById" TEXT, "reopenedByName" TEXT, "reopenReason" TEXT,
  CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayrollPeriod_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollPeriod_mechanicId_fromDate_toDate_key" ON "PayrollPeriod"("mechanicId", "fromDate", "toDate");
CREATE INDEX IF NOT EXISTS "PayrollPeriod_fromDate_toDate_status_idx" ON "PayrollPeriod"("fromDate", "toDate", "status");

CREATE TABLE IF NOT EXISTS "PayrollAttendanceDetail" (
  "id" TEXT NOT NULL, "payrollId" TEXT NOT NULL, "date" TEXT NOT NULL, "status" TEXT NOT NULL,
  "paidDayFactor" DECIMAL(5,2) NOT NULL, "dailyRate" DECIMAL(18,2) NOT NULL,
  "dailySalary" DECIMAL(18,2) NOT NULL, "notes" TEXT,
  CONSTRAINT "PayrollAttendanceDetail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayrollAttendanceDetail_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollAttendanceDetail_payrollId_date_key" ON "PayrollAttendanceDetail"("payrollId", "date");
CREATE INDEX IF NOT EXISTS "PayrollAttendanceDetail_payrollId_date_idx" ON "PayrollAttendanceDetail"("payrollId", "date");
