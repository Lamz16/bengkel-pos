ALTER TABLE "WorkshopService"
  ADD COLUMN IF NOT EXISTS "paymentDueDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "WorkshopService_paymentStatus_paymentDueDate_idx"
  ON "WorkshopService"("paymentStatus", "paymentDueDate");
