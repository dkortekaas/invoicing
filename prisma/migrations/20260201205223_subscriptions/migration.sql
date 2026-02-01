/*
  Warnings:

  - The values [PRO] on the enum `SubscriptionTier` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- Add Invitation subscription columns before AlterEnum (Invitation had no subscriptionTier yet)
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "subscriptionDuration" INTEGER;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "subscriptionTier" "SubscriptionTier";

-- AlterEnum (DiscountCode does not exist yet; it is created below with the new enum)
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS');
ALTER TABLE "public"."User" ALTER COLUMN "subscriptionTier" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new" USING ("subscriptionTier"::text::"SubscriptionTier_new");
ALTER TABLE "Invitation" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new" USING ("subscriptionTier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "public"."SubscriptionTier_old";
ALTER TABLE "User" ALTER COLUMN "subscriptionTier" SET DEFAULT 'FREE';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isManualSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manualSubscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "manualSubscriptionNote" TEXT;

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minTier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "validForTiers" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "campaign" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCodeUsage" (
    "id" TEXT NOT NULL,
    "discountCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discountAmount" INTEGER NOT NULL,
    "originalAmount" INTEGER NOT NULL,
    "finalAmount" INTEGER NOT NULL,
    "stripeInvoiceId" TEXT,

    CONSTRAINT "DiscountCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "DiscountCode_code_idx" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "DiscountCode_isActive_idx" ON "DiscountCode"("isActive");

-- CreateIndex
CREATE INDEX "DiscountCode_validFrom_idx" ON "DiscountCode"("validFrom");

-- CreateIndex
CREATE INDEX "DiscountCode_validUntil_idx" ON "DiscountCode"("validUntil");

-- CreateIndex
CREATE INDEX "DiscountCode_campaign_idx" ON "DiscountCode"("campaign");

-- CreateIndex
CREATE INDEX "DiscountCodeUsage_discountCodeId_idx" ON "DiscountCodeUsage"("discountCodeId");

-- CreateIndex
CREATE INDEX "DiscountCodeUsage_userId_idx" ON "DiscountCodeUsage"("userId");

-- CreateIndex
CREATE INDEX "DiscountCodeUsage_appliedAt_idx" ON "DiscountCodeUsage"("appliedAt");

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeUsage" ADD CONSTRAINT "DiscountCodeUsage_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
