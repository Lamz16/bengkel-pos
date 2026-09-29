-- Align the historical SQL migration with the Prisma datamodel.
ALTER TABLE "LoyaltyTier" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "DistributorInvoice_issueDate_idx" ON "DistributorInvoice"("issueDate");
CREATE INDEX IF NOT EXISTS "DistributorPayment_paymentDate_idx" ON "DistributorPayment"("paymentDate");
