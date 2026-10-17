ALTER TABLE "WorkshopService" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "WorkshopService_status_completedAt_idx"
  ON "WorkshopService"("status", "completedAt");
