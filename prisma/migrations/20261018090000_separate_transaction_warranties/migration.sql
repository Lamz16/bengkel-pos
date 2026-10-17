c-- Additive only: existing service-warranty snapshots remain untouched and old sales
-- retain their historic no-sale-warranty semantics.
ALTER TABLE "WorkshopService"
  ADD COLUMN "saleWarrantyEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "saleWarrantyDurationDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "saleWarrantyTermsSnapshot" TEXT,
  ADD COLUMN "saleWarrantyStartedAt" TIMESTAMP(3),
  ADD COLUMN "saleWarrantyExpiresAt" TIMESTAMP(3),
  ADD COLUMN "serviceWarrantyEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "serviceWarrantyStartedAt" TIMESTAMP(3);

ALTER TABLE "ServicePartItem" ADD COLUMN "warrantyStartedAt" TIMESTAMP(3);
CREATE INDEX "WorkshopService_saleWarrantyExpiresAt_idx" ON "WorkshopService"("saleWarrantyExpiresAt");
