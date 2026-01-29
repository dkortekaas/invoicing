-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "ocrConfidence" DECIMAL(3,2),
ADD COLUMN     "ocrError" TEXT,
ADD COLUMN     "ocrExtractedAt" TIMESTAMP(3),
ADD COLUMN     "ocrRawData" JSONB,
ADD COLUMN     "ocrStatus" "OcrStatus";
