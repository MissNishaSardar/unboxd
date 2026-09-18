-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cancelNote" TEXT;
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "cancelledBy" TEXT;
