-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cancelRequestedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "cancelRequestedBy" TEXT;
