-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StoreSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'store',
    "storeName" TEXT NOT NULL DEFAULT 'unboxd',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@unboxd.com',
    "supportPhone" TEXT NOT NULL DEFAULT '',
    "codEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryDays" INTEGER NOT NULL DEFAULT 5,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "returnWindowDays" INTEGER NOT NULL DEFAULT 7,
    "freeShippingThreshold" DECIMAL NOT NULL DEFAULT 999,
    "shippingFlatRate" DECIMAL NOT NULL DEFAULT 99,
    "maxDiscountPercent" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StoreSettings" ("codEnabled", "deliveryDays", "freeShippingThreshold", "id", "lowStockThreshold", "maxDiscountPercent", "returnWindowDays", "shippingFlatRate", "storeName", "supportEmail", "supportPhone", "updatedAt") SELECT "codEnabled", "deliveryDays", "freeShippingThreshold", "id", "lowStockThreshold", "maxDiscountPercent", "returnWindowDays", "shippingFlatRate", "storeName", "supportEmail", "supportPhone", "updatedAt" FROM "StoreSettings";
DROP TABLE "StoreSettings";
ALTER TABLE "new_StoreSettings" RENAME TO "StoreSettings";
UPDATE "StoreSettings" SET storeName = 'unboxd' WHERE id = 'store' AND storeName = 'Unboxd';
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
