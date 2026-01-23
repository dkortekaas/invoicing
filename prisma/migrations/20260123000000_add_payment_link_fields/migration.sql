-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paymentLinkToken" TEXT,
ADD COLUMN     "paymentLinkExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentLinkToken_key" ON "Invoice"("paymentLinkToken");

-- CreateIndex
CREATE INDEX "Invoice_paymentLinkToken_idx" ON "Invoice"("paymentLinkToken");
