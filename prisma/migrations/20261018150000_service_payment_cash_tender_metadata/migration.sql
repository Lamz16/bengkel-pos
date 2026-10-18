-- Additive nullable columns preserve every historical payment unchanged.
ALTER TABLE "ServicePayment"
  ADD COLUMN IF NOT EXISTS "cashReceived" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "changeAmount" DECIMAL(18,2);
