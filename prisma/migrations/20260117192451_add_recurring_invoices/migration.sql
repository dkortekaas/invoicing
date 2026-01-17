-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurringLogAction" AS ENUM ('CREATED', 'ACTIVATED', 'PAUSED', 'RESUMED', 'CANCELLED', 'ENDED', 'INVOICE_GENERATED', 'PRICE_CHANGED', 'SCHEDULE_UPDATED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "recurringInvoiceId" TEXT;

-- CreateTable
CREATE TABLE "RecurringInvoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "frequency" "RecurringFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextDate" TIMESTAMP(3) NOT NULL,
    "lastDate" TIMESTAMP(3),
    "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
    "dayOfMonth" INTEGER,
    "autoSend" BOOLEAN NOT NULL DEFAULT false,
    "sendDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "contract" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoiceItem" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringPriceChange" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "oldAmount" DECIMAL(10,2) NOT NULL,
    "newAmount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringPriceChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoiceLog" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "action" "RecurringLogAction" NOT NULL,
    "invoiceId" TEXT,
    "details" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringInvoiceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringInvoice_userId_idx" ON "RecurringInvoice"("userId");

-- CreateIndex
CREATE INDEX "RecurringInvoice_customerId_idx" ON "RecurringInvoice"("customerId");

-- CreateIndex
CREATE INDEX "RecurringInvoice_status_idx" ON "RecurringInvoice"("status");

-- CreateIndex
CREATE INDEX "RecurringInvoice_nextDate_idx" ON "RecurringInvoice"("nextDate");

-- CreateIndex
CREATE INDEX "RecurringInvoiceItem_recurringInvoiceId_idx" ON "RecurringInvoiceItem"("recurringInvoiceId");

-- CreateIndex
CREATE INDEX "RecurringPriceChange_recurringInvoiceId_idx" ON "RecurringPriceChange"("recurringInvoiceId");

-- CreateIndex
CREATE INDEX "RecurringPriceChange_effectiveDate_idx" ON "RecurringPriceChange"("effectiveDate");

-- CreateIndex
CREATE INDEX "RecurringInvoiceLog_recurringInvoiceId_idx" ON "RecurringInvoiceLog"("recurringInvoiceId");

-- CreateIndex
CREATE INDEX "RecurringInvoiceLog_createdAt_idx" ON "RecurringInvoiceLog"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_recurringInvoiceId_idx" ON "Invoice"("recurringInvoiceId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoiceItem" ADD CONSTRAINT "RecurringInvoiceItem_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPriceChange" ADD CONSTRAINT "RecurringPriceChange_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoiceLog" ADD CONSTRAINT "RecurringInvoiceLog_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
