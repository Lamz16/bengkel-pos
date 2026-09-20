CREATE TABLE "RackLevel" (
  "id" TEXT NOT NULL,
  "rackId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "slotCount" INTEGER NOT NULL,
  CONSTRAINT "RackLevel_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StorageLocation" (
  "id" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rackId" TEXT,
  "levelId" TEXT,
  "slotCode" TEXT,
  "positionNote" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PartLocationStock" (
  "id" TEXT NOT NULL,
  "partId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartLocationStock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RackLevel_rackId_code_key" ON "RackLevel"("rackId", "code");
CREATE UNIQUE INDEX "StorageLocation_code_key" ON "StorageLocation"("code");
CREATE UNIQUE INDEX "PartLocationStock_partId_locationId_key" ON "PartLocationStock"("partId", "locationId");
CREATE INDEX "StorageLocation_zoneId_idx" ON "StorageLocation"("zoneId");
CREATE INDEX "StorageLocation_rackId_levelId_idx" ON "StorageLocation"("rackId", "levelId");
CREATE INDEX "PartLocationStock_locationId_idx" ON "PartLocationStock"("locationId");
ALTER TABLE "RackLevel" ADD CONSTRAINT "RackLevel_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "WarehouseRack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "WarehouseZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "WarehouseRack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "RackLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartLocationStock" ADD CONSTRAINT "PartLocationStock_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartLocationStock" ADD CONSTRAINT "PartLocationStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StorageLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;