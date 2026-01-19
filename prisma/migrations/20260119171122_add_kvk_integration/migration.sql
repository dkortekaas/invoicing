/*
  Warnings:

  - A unique constraint covering the columns `[kvkNumber]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "kvkData" JSONB,
ADD COLUMN     "kvkLastSync" TIMESTAMP(3),
ADD COLUMN     "kvkNumber" TEXT,
ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "tradeNames" TEXT[];

-- CreateTable
CREATE TABLE "SbiCode" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SbiCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KvkCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KvkCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SbiCode_customerId_idx" ON "SbiCode"("customerId");

-- CreateIndex
CREATE INDEX "SbiCode_code_idx" ON "SbiCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KvkCache_cacheKey_key" ON "KvkCache"("cacheKey");

-- CreateIndex
CREATE INDEX "KvkCache_expiresAt_idx" ON "KvkCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_kvkNumber_key" ON "Customer"("kvkNumber");

-- CreateIndex
CREATE INDEX "Customer_kvkNumber_idx" ON "Customer"("kvkNumber");

-- AddForeignKey
ALTER TABLE "SbiCode" ADD CONSTRAINT "SbiCode_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
