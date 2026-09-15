-- Normalize category, warehouse, and rack values that were previously duplicated
-- as free text on every SparePart row.
CREATE TABLE "PartCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skuPrefix" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WarehouseZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WarehouseZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WarehouseRack" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WarehouseRack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartCategory_name_key" ON "PartCategory"("name");
CREATE UNIQUE INDEX "PartCategory_skuPrefix_key" ON "PartCategory"("skuPrefix");
CREATE UNIQUE INDEX "WarehouseZone_name_key" ON "WarehouseZone"("name");
CREATE UNIQUE INDEX "WarehouseRack_code_key" ON "WarehouseRack"("code");
CREATE INDEX "WarehouseRack_zoneId_idx" ON "WarehouseRack"("zoneId");

INSERT INTO "PartCategory" ("id", "name", "skuPrefix", "updatedAt")
SELECT md5('category:' || "category"), "category",
       upper(substr(regexp_replace("category", '[^[:alnum:]]', '', 'g'), 1, 3)), CURRENT_TIMESTAMP
FROM "SparePart"
GROUP BY "category";

INSERT INTO "WarehouseZone" ("id", "name", "updatedAt")
SELECT md5('zone:' || COALESCE(NULLIF("rackZone", ''), 'Tanpa Gudang')),
       COALESCE(NULLIF("rackZone", ''), 'Tanpa Gudang'), CURRENT_TIMESTAMP
FROM "SparePart"
WHERE "rackCode" IS NOT NULL AND "rackCode" <> ''
GROUP BY COALESCE(NULLIF("rackZone", ''), 'Tanpa Gudang');

INSERT INTO "WarehouseRack" ("id", "code", "name", "zoneId", "updatedAt")
SELECT md5('rack:' || "rackCode"), "rackCode", "rackCode",
       md5('zone:' || COALESCE(NULLIF(min("rackZone"), ''), 'Tanpa Gudang')), CURRENT_TIMESTAMP
FROM "SparePart"
WHERE "rackCode" IS NOT NULL AND "rackCode" <> ''
GROUP BY "rackCode";

ALTER TABLE "SparePart" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "SparePart" ADD COLUMN "rackId" TEXT;

UPDATE "SparePart" SET "categoryId" = md5('category:' || "category");
UPDATE "SparePart" SET "rackId" = md5('rack:' || "rackCode")
WHERE "rackCode" IS NOT NULL AND "rackCode" <> '';

ALTER TABLE "SparePart" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "SparePart" DROP COLUMN "category";
ALTER TABLE "SparePart" DROP COLUMN "rackCode";
ALTER TABLE "SparePart" DROP COLUMN "rackLocation";
ALTER TABLE "SparePart" DROP COLUMN "rackZone";

CREATE INDEX "SparePart_categoryId_idx" ON "SparePart"("categoryId");
CREATE INDEX "SparePart_rackId_idx" ON "SparePart"("rackId");
CREATE INDEX "SparePart_supplierId_idx" ON "SparePart"("supplierId");
ALTER TABLE "WarehouseRack" ADD CONSTRAINT "WarehouseRack_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "WarehouseZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_rackId_fkey"
  FOREIGN KEY ("rackId") REFERENCES "WarehouseRack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
