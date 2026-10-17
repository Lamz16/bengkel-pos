-- Additive operational queue. Historical WorkshopService rows are untouched.
CREATE TABLE "ServiceQueue" (
  "id" TEXT NOT NULL,
  "queueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "queueDay" TEXT NOT NULL,
  "queueNumber" INTEGER NOT NULL,
  "queueCode" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "vehicleId" TEXT,
  "vehiclePlate" TEXT NOT NULL,
  "vehicleModel" TEXT NOT NULL,
  "kilometers" INTEGER,
  "complaint" TEXT NOT NULL,
  "estimateNote" TEXT,
  "diagnosis" TEXT,
  "internalNotes" TEXT,
  "mechanicId" TEXT,
  "mechanicName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Waiting',
  "calledAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "readyAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceQueue_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "WorkshopService" ADD COLUMN "originQueueId" TEXT;
CREATE UNIQUE INDEX "WorkshopService_originQueueId_key" ON "WorkshopService"("originQueueId");
CREATE UNIQUE INDEX "ServiceQueue_queueDay_queueNumber_key" ON "ServiceQueue"("queueDay", "queueNumber");
CREATE UNIQUE INDEX "ServiceQueue_queueDay_queueCode_key" ON "ServiceQueue"("queueDay", "queueCode");
CREATE INDEX "ServiceQueue_status_queueDay_idx" ON "ServiceQueue"("status", "queueDay");
CREATE INDEX "ServiceQueue_vehiclePlate_idx" ON "ServiceQueue"("vehiclePlate");
CREATE INDEX "ServiceQueue_customerName_idx" ON "ServiceQueue"("customerName");
ALTER TABLE "ServiceQueue" ADD CONSTRAINT "ServiceQueue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceQueue" ADD CONSTRAINT "ServiceQueue_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceQueue" ADD CONSTRAINT "ServiceQueue_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkshopService" ADD CONSTRAINT "WorkshopService_originQueueId_fkey" FOREIGN KEY ("originQueueId") REFERENCES "ServiceQueue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
