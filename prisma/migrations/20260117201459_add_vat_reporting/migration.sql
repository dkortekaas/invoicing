-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('OFFICE', 'TRAVEL', 'EQUIPMENT', 'SOFTWARE', 'MARKETING', 'EDUCATION', 'INSURANCE', 'ACCOUNTANT', 'TELECOM', 'UTILITIES', 'RENT', 'MAINTENANCE', 'PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "VATReportStatus" AS ENUM ('DRAFT', 'FINAL', 'FILED');

-- CreateEnum
CREATE TYPE "VATScheme" AS ENUM ('REGULAR', 'SMALL', 'MARGIN');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "vatCountry" TEXT,
ADD COLUMN     "vatReversed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "vatRegistered" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vatScheme" "VATScheme" NOT NULL DEFAULT 'REGULAR';

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "vatAmount" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "invoiceNumber" TEXT,
    "deductible" BOOLEAN NOT NULL DEFAULT true,
    "deductiblePerc" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "receipt" TEXT,
    "customerId" TEXT,
    "projectId" TEXT,
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoiceItemId" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VATReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "revenueHighRate" DECIMAL(10,2) NOT NULL,
    "revenueHighVAT" DECIMAL(10,2) NOT NULL,
    "revenueLowRate" DECIMAL(10,2) NOT NULL,
    "revenueLowVAT" DECIMAL(10,2) NOT NULL,
    "revenueZeroRate" DECIMAL(10,2) NOT NULL,
    "revenueReversed" DECIMAL(10,2) NOT NULL,
    "revenueEU" DECIMAL(10,2) NOT NULL,
    "revenueExport" DECIMAL(10,2) NOT NULL,
    "totalRevenue" DECIMAL(10,2) NOT NULL,
    "totalRevenueVAT" DECIMAL(10,2) NOT NULL,
    "expensesHighRate" DECIMAL(10,2) NOT NULL,
    "expensesHighVAT" DECIMAL(10,2) NOT NULL,
    "expensesLowRate" DECIMAL(10,2) NOT NULL,
    "expensesLowVAT" DECIMAL(10,2) NOT NULL,
    "expensesReversed" DECIMAL(10,2) NOT NULL,
    "totalExpenses" DECIMAL(10,2) NOT NULL,
    "totalExpensesVAT" DECIMAL(10,2) NOT NULL,
    "vatOwed" DECIMAL(10,2) NOT NULL,
    "vatDeductible" DECIMAL(10,2) NOT NULL,
    "vatBalance" DECIMAL(10,2) NOT NULL,
    "status" "VATReportStatus" NOT NULL DEFAULT 'DRAFT',
    "filedDate" TIMESTAMP(3),
    "notes" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VATReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VATAdjustment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VATAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICPEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "invoiceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ICPEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expense_invoiceItemId_key" ON "Expense"("invoiceItemId");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_deductible_idx" ON "Expense"("deductible");

-- CreateIndex
CREATE INDEX "VATReport_userId_idx" ON "VATReport"("userId");

-- CreateIndex
CREATE INDEX "VATReport_year_quarter_idx" ON "VATReport"("year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "VATReport_userId_year_quarter_key" ON "VATReport"("userId", "year", "quarter");

-- CreateIndex
CREATE INDEX "VATAdjustment_reportId_idx" ON "VATAdjustment"("reportId");

-- CreateIndex
CREATE INDEX "ICPEntry_userId_idx" ON "ICPEntry"("userId");

-- CreateIndex
CREATE INDEX "ICPEntry_year_quarter_idx" ON "ICPEntry"("year", "quarter");

-- CreateIndex
CREATE INDEX "ICPEntry_customerId_idx" ON "ICPEntry"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ICPEntry_userId_year_quarter_customerId_key" ON "ICPEntry"("userId", "year", "quarter", "customerId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VATReport" ADD CONSTRAINT "VATReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VATAdjustment" ADD CONSTRAINT "VATAdjustment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "VATReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICPEntry" ADD CONSTRAINT "ICPEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICPEntry" ADD CONSTRAINT "ICPEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
