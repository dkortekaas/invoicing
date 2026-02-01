-- CreateEnum
CREATE TYPE "SymbolPosition" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "RateSource" AS ENUM ('ECB', 'MANUAL');

-- CreateEnum
CREATE TYPE "RateLockTiming" AS ENUM ('CREATE', 'SEND', 'MANUAL');

-- AlterTable
ALTER TABLE "CreditNote" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(12,6),
ADD COLUMN     "exchangeRateDate" DATE,
ADD COLUMN     "exchangeRateSource" "RateSource",
ADD COLUMN     "subtotalEur" DECIMAL(10,2),
ADD COLUMN     "totalEur" DECIMAL(10,2),
ADD COLUMN     "vatAmountEur" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "currencyId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "exchangeRate" DECIMAL(12,6),
ADD COLUMN     "exchangeRateDate" DATE,
ADD COLUMN     "exchangeRateLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "exchangeRateSource" "RateSource",
ADD COLUMN     "subtotalEur" DECIMAL(10,2),
ADD COLUMN     "totalEur" DECIMAL(10,2),
ADD COLUMN     "vatAmountEur" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameDutch" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "symbolPosition" "SymbolPosition" NOT NULL DEFAULT 'BEFORE',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "inverseRate" DECIMAL(12,6) NOT NULL,
    "source" "RateSource" NOT NULL DEFAULT 'ECB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseCurrencyId" TEXT NOT NULL,
    "autoFetchRates" BOOLEAN NOT NULL DEFAULT true,
    "lockRateOn" "RateLockTiming" NOT NULL DEFAULT 'SEND',
    "showBaseEquivalent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EnabledCurrencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EnabledCurrencies_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "ExchangeRate_currencyCode_idx" ON "ExchangeRate"("currencyCode");

-- CreateIndex
CREATE INDEX "ExchangeRate_date_idx" ON "ExchangeRate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currencyCode_date_key" ON "ExchangeRate"("currencyCode", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencySettings_userId_key" ON "CurrencySettings"("userId");

-- CreateIndex
CREATE INDEX "_EnabledCurrencies_B_index" ON "_EnabledCurrencies"("B");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencySettings" ADD CONSTRAINT "CurrencySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencySettings" ADD CONSTRAINT "CurrencySettings_baseCurrencyId_fkey" FOREIGN KEY ("baseCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnabledCurrencies" ADD CONSTRAINT "_EnabledCurrencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnabledCurrencies" ADD CONSTRAINT "_EnabledCurrencies_B_fkey" FOREIGN KEY ("B") REFERENCES "CurrencySettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
