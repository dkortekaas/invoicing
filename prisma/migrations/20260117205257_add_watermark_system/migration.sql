-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPERUSER');

-- CreateEnum
CREATE TYPE "WatermarkPosition" AS ENUM ('DIAGONAL', 'CENTER', 'BOTTOM', 'TOP', 'FOOTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "watermarkText" TEXT NOT NULL DEFAULT 'GRATIS VERSIE - Upgrade naar Pro op app.yoursite.com',
    "watermarkOpacity" DECIMAL(3,2) NOT NULL DEFAULT 0.15,
    "watermarkRotation" INTEGER NOT NULL DEFAULT -45,
    "watermarkFontSize" INTEGER NOT NULL DEFAULT 40,
    "watermarkColor" TEXT NOT NULL DEFAULT '#999999',
    "watermarkPosition" "WatermarkPosition" NOT NULL DEFAULT 'DIAGONAL',
    "freeUserWatermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_id_key" ON "SystemSettings"("id");
