-- CreateEnum
CREATE TYPE "CategorySource" AS ENUM ('MANUAL', 'VENDOR_MATCH', 'KEYWORD_MATCH', 'AI_PREDICTION');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "categorySource" "CategorySource",
ADD COLUMN     "predictedCategory" "ExpenseCategory",
ADD COLUMN     "vendorId" TEXT,
ADD COLUMN     "wasAutoCategorized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wasCorrected" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliases" TEXT[],
    "defaultCategory" "ExpenseCategory" NOT NULL,
    "website" TEXT,
    "vatNumber" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseTrainingData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supplierName" TEXT,
    "normalizedSupplier" TEXT,
    "predictedCategory" "ExpenseCategory" NOT NULL,
    "actualCategory" "ExpenseCategory" NOT NULL,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vendor_userId_idx" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_normalizedName_idx" ON "Vendor"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_normalizedName_key" ON "Vendor"("userId", "normalizedName");

-- CreateIndex
CREATE INDEX "ExpenseTrainingData_userId_idx" ON "ExpenseTrainingData"("userId");

-- CreateIndex
CREATE INDEX "ExpenseTrainingData_normalizedSupplier_idx" ON "ExpenseTrainingData"("normalizedSupplier");

-- CreateIndex
CREATE INDEX "Expense_vendorId_idx" ON "Expense"("vendorId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseTrainingData" ADD CONSTRAINT "ExpenseTrainingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
