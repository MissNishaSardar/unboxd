-- RedefineIndex
DROP INDEX "category_deletedAt_idx";
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");
