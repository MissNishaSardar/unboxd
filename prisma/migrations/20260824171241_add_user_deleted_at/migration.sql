-- AlterTable
ALTER TABLE "user" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "user_deletedAt_idx" ON "user"("deletedAt");
