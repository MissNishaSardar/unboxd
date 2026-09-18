/*
  Warnings:

  - Added the required column `orderNumber` to the `Order` table without a default value. Pre-existing rows are backfilled below with ROW_NUMBER() starting at 1001, so this runs on non-empty tables.

*/
-- CreateTable
CREATE TABLE "OrderCounter" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'orders',
    "nextValue" INTEGER NOT NULL DEFAULT 1001
);

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
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "paymentMethod", "shipping", "status", "statusUpdatedAt", "subtotal", "total", "updatedAt", "userId", "orderNumber") SELECT "createdAt", "id", "paymentMethod", "shipping", "status", "statusUpdatedAt", "subtotal", "total", "updatedAt", "userId", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") + 1000 FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Seed the friendly order number sequence, continuing past any backfilled rows.
INSERT INTO "OrderCounter" ("id", "nextValue") SELECT 'orders', COALESCE(MAX("orderNumber"), 1000) + 1 FROM "Order";
