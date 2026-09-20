-- Garansi disimpan per varian stok; snapshotnya disimpan di item transaksi
-- supaya nota lama tidak berubah jika konfigurasi master barang diubah.
ALTER TABLE "SparePart"
  ADD COLUMN "hasProductWarranty" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "warrantyDurationDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "warrantyTerms" TEXT;

ALTER TABLE "ServicePartItem"
  ADD COLUMN "hasProductWarranty" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "warrantyDurationDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "warrantyTerms" TEXT,
  ADD COLUMN "warrantyExpiresAt" TIMESTAMP(3);

CREATE INDEX "ServicePartItem_warrantyExpiresAt_idx" ON "ServicePartItem"("warrantyExpiresAt");
