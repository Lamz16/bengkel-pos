-- Fast filtering, sorting, and reporting on growing operational data.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "WorkshopService_createdAt_idx" ON "WorkshopService"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WorkshopService_status_createdAt_idx" ON "WorkshopService"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WorkshopService_paymentStatus_createdAt_idx" ON "WorkshopService"("paymentStatus", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WorkshopService_customerId_createdAt_idx" ON "WorkshopService"("customerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ServicePartItem_serviceId_partId_idx" ON "ServicePartItem"("serviceId", "partId");
CREATE INDEX IF NOT EXISTS "ServicePartItem_partId_idx" ON "ServicePartItem"("partId");
CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date" DESC);
CREATE INDEX IF NOT EXISTS "PurchaseRecord_date_idx" ON "PurchaseRecord"("date" DESC);
CREATE INDEX IF NOT EXISTS "StockHistory_date_idx" ON "StockHistory"("date" DESC);
CREATE INDEX IF NOT EXISTS "Vehicle_customerId_idx" ON "Vehicle"("customerId");
CREATE INDEX IF NOT EXISTS "Vehicle_plateNumber_trgm_idx" ON "Vehicle" USING GIN ("plateNumber" gin_trgm_ops);

-- Prisma `contains` with insensitive mode is translated to ILIKE by PostgreSQL.
CREATE INDEX IF NOT EXISTS "WorkshopService_customerName_trgm_idx" ON "WorkshopService" USING GIN ("customerName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "WorkshopService_vehiclePlate_trgm_idx" ON "WorkshopService" USING GIN ("vehiclePlate" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "WorkshopService_vehicleModel_trgm_idx" ON "WorkshopService" USING GIN ("vehicleModel" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SparePart_name_trgm_idx" ON "SparePart" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SparePart_sku_trgm_idx" ON "SparePart" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "SparePart_barcode_trgm_idx" ON "SparePart" USING GIN ("barcode" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Customer_name_trgm_idx" ON "Customer" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Customer_phone_trgm_idx" ON "Customer" USING GIN ("phone" gin_trgm_ops);

ALTER TABLE "IdempotencyRecord"
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');
CREATE INDEX IF NOT EXISTS "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");
