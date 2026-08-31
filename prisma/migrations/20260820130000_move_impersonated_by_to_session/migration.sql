-- AlterTable
ALTER TABLE "account" DROP COLUMN "impersonatedBy";

-- AlterTable
ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;
