-- CreateTable
CREATE TABLE "StoreSettings" (
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
    "updatedAt" DATETIME NOT NULL
);

-- Seed the single store row mirroring the previous hardcoded behavior.
INSERT INTO "StoreSettings" ("id", "updatedAt") VALUES ('store', CURRENT_TIMESTAMP);
