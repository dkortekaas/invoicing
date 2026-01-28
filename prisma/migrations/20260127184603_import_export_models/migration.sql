-- CreateEnum
CREATE TYPE "ImportExportType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "ImportExportEntityType" AS ENUM ('CUSTOMERS', 'INVOICES', 'EXPENSES', 'PRODUCTS', 'TIME_ENTRIES');

-- CreateEnum
CREATE TYPE "ImportExportJobStatus" AS ENUM ('PENDING', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ImportExportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ImportExportType" NOT NULL,
    "entityType" "ImportExportEntityType" NOT NULL,
    "status" "ImportExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "columnMapping" JSONB,
    "importOptions" JSONB,
    "exportOptions" JSONB,
    "exportFilters" JSONB,
    "totalRows" INTEGER,
    "processedRows" INTEGER,
    "successRows" INTEGER,
    "errorRows" INTEGER,
    "skippedRows" INTEGER,
    "errors" JSONB,
    "warnings" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" "ImportExportEntityType" NOT NULL,
    "columnMapping" JSONB NOT NULL,
    "options" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportExportJob_userId_idx" ON "ImportExportJob"("userId");

-- CreateIndex
CREATE INDEX "ImportExportJob_status_idx" ON "ImportExportJob"("status");

-- CreateIndex
CREATE INDEX "ImportExportJob_createdAt_idx" ON "ImportExportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportTemplate_userId_idx" ON "ImportTemplate"("userId");

-- CreateIndex
CREATE INDEX "ImportTemplate_entityType_idx" ON "ImportTemplate"("entityType");

-- AddForeignKey
ALTER TABLE "ImportExportJob" ADD CONSTRAINT "ImportExportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportTemplate" ADD CONSTRAINT "ImportTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
