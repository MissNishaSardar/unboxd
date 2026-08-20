-- AlterTable
ALTER TABLE "category" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "category_deletedAt_idx" ON "category"("deletedAt");
