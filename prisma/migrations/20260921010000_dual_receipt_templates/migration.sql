-- Separate service/sale receipt templates and persist the warranty/template used by every transaction.
ALTER TABLE "CompanySettings"
  ADD COLUMN IF NOT EXISTS "serviceReceiptHeader" TEXT NOT NULL DEFAULT 'NOTA TRANSAKSI SERVIS',
  ADD COLUMN IF NOT EXISTS "saleReceiptHeader" TEXT NOT NULL DEFAULT 'NOTA PEMBELIAN BARANG',
  ADD COLUMN IF NOT EXISTS "serviceReceiptFooter" TEXT DEFAULT 'Terima kasih telah mempercayakan kendaraan Anda kepada kami.',
  ADD COLUMN IF NOT EXISTS "saleReceiptFooter" TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat ditukar kecuali perjanjian.',
  ADD COLUMN IF NOT EXISTS "defaultServiceWarrantyDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "serviceWarrantyTerms" TEXT DEFAULT 'Garansi hanya berlaku untuk pengerjaan servis yang sama dengan menunjukkan nota ini.';

ALTER TABLE "WorkshopService"
  ADD COLUMN IF NOT EXISTS "receiptType" TEXT NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN IF NOT EXISTS "receiptHeaderSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptFooterSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "serviceWarrantyDurationDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "serviceWarrantyTermsSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "serviceWarrantyExpiresAt" TIMESTAMP(3);
