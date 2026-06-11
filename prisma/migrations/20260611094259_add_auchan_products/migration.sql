-- CreateTable
CREATE TABLE "AuchanProduct" (
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
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
