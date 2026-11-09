CREATE TABLE IF NOT EXISTS "TransactionDraft" (
  "id" TEXT NOT NULL,
  "draftCode" TEXT NOT NULL,
  "receiptType" TEXT NOT NULL DEFAULT 'SERVICE',
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "customerId" TEXT,
  "vehiclePlate" TEXT,
  "vehicleModel" TEXT,
  "vehicleId" TEXT,
  "kilometers" INTEGER DEFAULT 0,
  "complaint" TEXT,
  "diagnosis" TEXT,
  "laborFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(18,2) DEFAULT 0,
  "discountReason" TEXT,
  "mechanicId" TEXT,
  "mechanicName" TEXT,
  "mechanicBonusPercent" DOUBLE PRECISION DEFAULT 0,
  "originQueueId" TEXT,
  "note" TEXT,
  "itemsPayload" JSONB NOT NULL,
  "createdById" TEXT,
  "createdByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransactionDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TransactionDraft_draftCode_key" ON "TransactionDraft"("draftCode");
CREATE INDEX IF NOT EXISTS "TransactionDraft_createdAt_idx" ON "TransactionDraft"("createdAt");
CREATE INDEX IF NOT EXISTS "TransactionDraft_receiptType_idx" ON "TransactionDraft"("receiptType");
CREATE INDEX IF NOT EXISTS "TransactionDraft_customerName_idx" ON "TransactionDraft"("customerName");
