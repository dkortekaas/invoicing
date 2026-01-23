-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mollieApiKey" TEXT,
ADD COLUMN     "mollieEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mollieProfileId" TEXT,
ADD COLUMN     "mollieTestMode" BOOLEAN NOT NULL DEFAULT true;
