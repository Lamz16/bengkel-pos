ALTER TABLE "ServicePartItem"
  ADD COLUMN IF NOT EXISTS "purchasePriceAtTime" DECIMAL(18,2);