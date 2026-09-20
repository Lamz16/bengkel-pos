CREATE TABLE "ServiceLaborItem" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(18,2) NOT NULL,
  CONSTRAINT "ServiceLaborItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceLaborItem_serviceId_idx" ON "ServiceLaborItem"("serviceId");

ALTER TABLE "ServiceLaborItem"
  ADD CONSTRAINT "ServiceLaborItem_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "WorkshopService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
