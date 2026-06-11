-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuchanProduct" (
    "productId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "price" REAL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "weightVolume" TEXT,
    "packSize" TEXT,
    "ean" TEXT,
    "category" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AuchanProduct" ("brand", "category", "currency", "description", "ean", "imageUrl", "name", "packSize", "price", "productId", "scrapedAt", "sourceUrl", "updatedAt", "weightVolume") SELECT "brand", "category", "currency", "description", "ean", "imageUrl", "name", "packSize", "price", "productId", "scrapedAt", "sourceUrl", "updatedAt", "weightVolume" FROM "AuchanProduct";
DROP TABLE "AuchanProduct";
ALTER TABLE "new_AuchanProduct" RENAME TO "AuchanProduct";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
