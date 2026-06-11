-- CreateTable
CREATE TABLE "AuchanCategory" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "auchanUrl" TEXT NOT NULL,
    "iconUrl" TEXT,
    "group" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
