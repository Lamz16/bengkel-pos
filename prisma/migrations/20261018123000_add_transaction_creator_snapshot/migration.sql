ALTER TABLE "WorkshopService"
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "createdByNameSnapshot" TEXT,
  ADD COLUMN "createdByRoleSnapshot" TEXT;

ALTER TABLE "WorkshopService"
  ADD CONSTRAINT "WorkshopService_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "WorkshopService_createdByUserId_completedAt_idx"
  ON "WorkshopService"("createdByUserId", "completedAt");
