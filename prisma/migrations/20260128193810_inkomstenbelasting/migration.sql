-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('EENMANSZAAK', 'VOF', 'MAATSCHAP', 'BV');

-- CreateEnum
CREATE TYPE "HomeOfficeType" AS ENUM ('INDEPENDENT', 'NON_INDEPENDENT');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('EQUIPMENT', 'VEHICLE', 'FURNITURE', 'SOFTWARE', 'BUILDING', 'INTANGIBLE', 'OTHER');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('LINEAR', 'DEGRESSIVE');

-- CreateEnum
CREATE TYPE "TaxReportStatus" AS ENUM ('DRAFT', 'PROVISIONAL', 'FINAL', 'FILED');

-- CreateTable
CREATE TABLE "FiscalSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL DEFAULT 'EENMANSZAAK',
    "hoursTracked" BOOLEAN NOT NULL DEFAULT false,
    "manualHoursPerYear" INTEGER,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "starterYearsUsed" INTEGER NOT NULL DEFAULT 0,
    "firstStarterYear" INTEGER,
    "hasHomeOffice" BOOLEAN NOT NULL DEFAULT false,
    "homeOfficeType" "HomeOfficeType",
    "homeOfficePercentage" DECIMAL(5,2),
    "hasBusinessCar" BOOLEAN NOT NULL DEFAULT false,
    "carPrivateUsage" DECIMAL(5,2),
    "useFOR" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AssetCategory" NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "usefulLifeYears" INTEGER NOT NULL,
    "residualValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "depreciationMethod" "DepreciationMethod" NOT NULL DEFAULT 'LINEAR',
    "bookValue" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "disposalDate" TIMESTAMP(3),
    "disposalPrice" DECIMAL(10,2),
    "kiaApplied" BOOLEAN NOT NULL DEFAULT false,
    "kiaYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepreciationEntry" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "bookValueStart" DECIMAL(10,2) NOT NULL,
    "bookValueEnd" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepreciationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "TaxReportStatus" NOT NULL DEFAULT 'DRAFT',
    "revenueGross" DECIMAL(10,2) NOT NULL,
    "creditNotesTotal" DECIMAL(10,2) NOT NULL,
    "revenueNet" DECIMAL(10,2) NOT NULL,
    "expensesTransport" DECIMAL(10,2) NOT NULL,
    "expensesHousing" DECIMAL(10,2) NOT NULL,
    "expensesGeneral" DECIMAL(10,2) NOT NULL,
    "expensesOffice" DECIMAL(10,2) NOT NULL,
    "expensesOutsourced" DECIMAL(10,2) NOT NULL,
    "expensesRepresentation" DECIMAL(10,2) NOT NULL,
    "expensesOther" DECIMAL(10,2) NOT NULL,
    "expensesTotal" DECIMAL(10,2) NOT NULL,
    "depreciationTotal" DECIMAL(10,2) NOT NULL,
    "grossProfit" DECIMAL(10,2) NOT NULL,
    "kiaAmount" DECIMAL(10,2) NOT NULL,
    "kiaInvestments" DECIMAL(10,2) NOT NULL,
    "zelfstandigenaftrek" DECIMAL(10,2) NOT NULL,
    "startersaftrek" DECIMAL(10,2) NOT NULL,
    "forDotation" DECIMAL(10,2) NOT NULL,
    "profitBeforeMKB" DECIMAL(10,2) NOT NULL,
    "mkbVrijstelling" DECIMAL(10,2) NOT NULL,
    "taxableProfit" DECIMAL(10,2) NOT NULL,
    "estimatedTaxBox1" DECIMAL(10,2) NOT NULL,
    "hoursWorked" INTEGER,
    "meetsHoursCriterion" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalSettings_userId_key" ON "FiscalSettings"("userId");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "Asset"("category");

-- CreateIndex
CREATE INDEX "Asset_isActive_idx" ON "Asset"("isActive");

-- CreateIndex
CREATE INDEX "DepreciationEntry_year_idx" ON "DepreciationEntry"("year");

-- CreateIndex
CREATE UNIQUE INDEX "DepreciationEntry_assetId_year_key" ON "DepreciationEntry"("assetId", "year");

-- CreateIndex
CREATE INDEX "TaxReport_userId_idx" ON "TaxReport"("userId");

-- CreateIndex
CREATE INDEX "TaxReport_year_idx" ON "TaxReport"("year");

-- CreateIndex
CREATE UNIQUE INDEX "TaxReport_userId_year_key" ON "TaxReport"("userId", "year");

-- AddForeignKey
ALTER TABLE "FiscalSettings" ADD CONSTRAINT "FiscalSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationEntry" ADD CONSTRAINT "DepreciationEntry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReport" ADD CONSTRAINT "TaxReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
