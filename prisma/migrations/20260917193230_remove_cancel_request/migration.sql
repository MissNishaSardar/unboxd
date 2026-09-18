/*
  Warnings:

  - You are about to drop the column `cancelRequestedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cancelRequestedBy` on the `Order` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "subtotal" DECIMAL NOT NULL,
    "shipping" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statusUpdatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "cancelReason" TEXT,
    "cancelNote" TEXT,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("cancelNote", "cancelReason", "cancelledAt", "cancelledBy", "createdAt", "id", "orderNumber", "paymentMethod", "shipping", "status", "statusUpdatedAt", "subtotal", "total", "updatedAt", "userId") SELECT "cancelNote", "cancelReason", "cancelledAt", "cancelledBy", "createdAt", "id", "orderNumber", "paymentMethod", "shipping", "status", "statusUpdatedAt", "subtotal", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
