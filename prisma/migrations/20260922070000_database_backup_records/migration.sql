CREATE TABLE "DatabaseBackupRecord" (
  "id" TEXT NOT NULL,
  "databaseName" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DatabaseBackupRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DatabaseBackupRecord_completedAt_idx" ON "DatabaseBackupRecord"("completedAt");
CREATE INDEX "DatabaseBackupRecord_createdById_completedAt_idx" ON "DatabaseBackupRecord"("createdById", "completedAt");
