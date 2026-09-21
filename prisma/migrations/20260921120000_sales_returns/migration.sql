ALTER TABLE "ServicePartItem" ADD COLUMN IF NOT EXISTS "returnedQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "SalesReturn" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "reason" TEXT,
  "totalAmount" DECIMAL(18,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "SalesReturnItem" (
  "id" TEXT NOT NULL,
  "salesReturnId" TEXT NOT NULL,
  "servicePartId" TEXT NOT NULL,
  "partId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(18,2) NOT NULL,
  CONSTRAINT "SalesReturnItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SalesReturn_serviceId_createdAt_idx" ON "SalesReturn"("serviceId", "createdAt");
CREATE INDEX IF NOT EXISTS "SalesReturnItem_servicePartId_idx" ON "SalesReturnItem"("servicePartId");
CREATE INDEX IF NOT EXISTS "SalesReturnItem_partId_idx" ON "SalesReturnItem"("partId");
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "WorkshopService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_servicePartId_fkey" FOREIGN KEY ("servicePartId") REFERENCES "ServicePartItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
