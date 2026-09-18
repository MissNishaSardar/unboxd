-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" DECIMAL NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "brand" TEXT NOT NULL DEFAULT 'Unknown',
    "brandSlug" TEXT NOT NULL DEFAULT 'unknown',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("basePrice", "brand", "brandSlug", "categoryId", "createdAt", "description", "featured", "id", "isActive", "name", "slug", "updatedAt") SELECT "basePrice", "brand", "brandSlug", "categoryId", "createdAt", "description", "featured", "id", "isActive", "name", "slug", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brandSlug_idx" ON "Product"("brandSlug");
CREATE INDEX "Product_brand_isActive_idx" ON "Product"("brand", "isActive");
CREATE INDEX "Product_isActive_featured_idx" ON "Product"("isActive", "featured");
CREATE TABLE "new_StoreSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'store',
    "storeName" TEXT NOT NULL DEFAULT 'Unboxd',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@unboxd.com',
    "supportPhone" TEXT NOT NULL DEFAULT '',
    "codEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryDays" INTEGER NOT NULL DEFAULT 5,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "returnWindowDays" INTEGER NOT NULL DEFAULT 7,
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcementText" TEXT NOT NULL DEFAULT '',
    "freeShippingThreshold" DECIMAL NOT NULL DEFAULT 999,
    "shippingFlatRate" DECIMAL NOT NULL DEFAULT 99,
    "maxDiscountPercent" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StoreSettings" ("announcementEnabled", "announcementText", "codEnabled", "deliveryDays", "freeShippingThreshold", "id", "lowStockThreshold", "returnWindowDays", "shippingFlatRate", "storeName", "supportEmail", "supportPhone", "updatedAt") SELECT "announcementEnabled", "announcementText", "codEnabled", "deliveryDays", "freeShippingThreshold", "id", "lowStockThreshold", "returnWindowDays", "shippingFlatRate", "storeName", "supportEmail", "supportPhone", "updatedAt" FROM "StoreSettings";
DROP TABLE "StoreSettings";
ALTER TABLE "new_StoreSettings" RENAME TO "StoreSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
