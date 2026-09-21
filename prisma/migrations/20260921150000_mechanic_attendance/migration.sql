CREATE TABLE IF NOT EXISTS "MechanicAttendance" (
    "id" TEXT NOT NULL,
    "mechanicId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Present',
    "notes" TEXT,
    CONSTRAINT "MechanicAttendance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MechanicAttendance_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MechanicAttendance_mechanicId_date_key"
ON "MechanicAttendance"("mechanicId", "date");

CREATE INDEX IF NOT EXISTS "MechanicAttendance_date_idx"
ON "MechanicAttendance"("date");
