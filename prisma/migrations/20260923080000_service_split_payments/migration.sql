CREATE TABLE IF NOT EXISTS "ServicePayment" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "referenceNo" TEXT,
  "notes" TEXT,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServicePayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServicePayment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "WorkshopService"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ServicePayment_serviceId_paymentDate_idx" ON "ServicePayment"("serviceId", "paymentDate");
CREATE INDEX IF NOT EXISTS "ServicePayment_paymentMethod_paymentDate_idx" ON "ServicePayment"("paymentMethod", "paymentDate");
