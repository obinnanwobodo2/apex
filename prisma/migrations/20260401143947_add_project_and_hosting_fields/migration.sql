-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "milestones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "businessName" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "invoiceNumber" TEXT,
    "paystackReference" TEXT,
    "nextBillingDate" DATETIME,
    "hostingPlan" TEXT,
    "hostingAmount" REAL NOT NULL DEFAULT 0,
    "projectType" TEXT,
    "features" TEXT,
    "budget" TEXT,
    "timeline" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("amount", "amountPaid", "businessName", "contactPerson", "createdAt", "description", "id", "invoiceNumber", "nextBillingDate", "package", "paid", "paystackReference", "phone", "status", "updatedAt", "userId") SELECT "amount", "amountPaid", "businessName", "contactPerson", "createdAt", "description", "id", "invoiceNumber", "nextBillingDate", "package", "paid", "paystackReference", "phone", "status", "updatedAt", "userId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_paystackReference_key" ON "Subscription"("paystackReference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
