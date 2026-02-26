-- CreateEnum
CREATE TYPE "AccountingProvider" AS ENUM ('MONEYBIRD', 'EBOEKHOUDEN', 'EXACT', 'YUKI');

-- CreateEnum
CREATE TYPE "LedgerSourceType" AS ENUM ('DEFAULT', 'PRODUCT_CATEGORY', 'PRODUCT');

-- CreateEnum
CREATE TYPE "SyncEntityType" AS ENUM ('CUSTOMER', 'INVOICE', 'CREDIT_NOTE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "SyncAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AccountingConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AccountingProvider" NOT NULL,
    "providerName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "externalAdminId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "autoSyncInvoices" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncCreditNotes" BOOLEAN NOT NULL DEFAULT false,
    "autoSyncCustomers" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerMapping" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "sourceType" "LedgerSourceType" NOT NULL,
    "sourceId" TEXT,
    "externalLedgerId" TEXT NOT NULL,
    "externalLedgerCode" TEXT,
    "externalLedgerName" TEXT,

    CONSTRAINT "LedgerMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatMapping" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "externalVatId" TEXT NOT NULL,
    "externalVatCode" TEXT,
    "externalVatName" TEXT,

    CONSTRAINT "VatMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedCustomer" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncHash" TEXT,

    CONSTRAINT "SyncedCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedInvoice" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalNumber" TEXT,
    "externalUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "syncedStatus" TEXT,

    CONSTRAINT "SyncedInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedCreditNote" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalNumber" TEXT,
    "externalUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedCreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingSyncLog" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "entityType" "SyncEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "SyncAction" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "externalId" TEXT,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "errorDetails" JSONB,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingConnection_userId_idx" ON "AccountingConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingConnection_userId_provider_key" ON "AccountingConnection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerMapping_connectionId_sourceType_sourceId_key" ON "LedgerMapping"("connectionId", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "VatMapping_connectionId_vatRate_key" ON "VatMapping"("connectionId", "vatRate");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedCustomer_connectionId_customerId_key" ON "SyncedCustomer"("connectionId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedInvoice_connectionId_invoiceId_key" ON "SyncedInvoice"("connectionId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedCreditNote_connectionId_creditNoteId_key" ON "SyncedCreditNote"("connectionId", "creditNoteId");

-- CreateIndex
CREATE INDEX "AccountingSyncLog_connectionId_idx" ON "AccountingSyncLog"("connectionId");

-- CreateIndex
CREATE INDEX "AccountingSyncLog_entityType_entityId_idx" ON "AccountingSyncLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AccountingSyncLog_status_idx" ON "AccountingSyncLog"("status");

-- CreateIndex
CREATE INDEX "AccountingSyncLog_createdAt_idx" ON "AccountingSyncLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AccountingConnection" ADD CONSTRAINT "AccountingConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerMapping" ADD CONSTRAINT "LedgerMapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AccountingConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatMapping" ADD CONSTRAINT "VatMapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AccountingConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedCustomer" ADD CONSTRAINT "SyncedCustomer_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AccountingConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedCustomer" ADD CONSTRAINT "SyncedCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedInvoice" ADD CONSTRAINT "SyncedInvoice_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AccountingConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedInvoice" ADD CONSTRAINT "SyncedInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedCreditNote" ADD CONSTRAINT "SyncedCreditNote_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AccountingConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedCreditNote" ADD CONSTRAINT "SyncedCreditNote_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingSyncLog" ADD CONSTRAINT "AccountingSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AccountingConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
