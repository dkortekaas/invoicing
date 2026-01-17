-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('INVOICE', 'REMINDER_FRIENDLY', 'REMINDER_FIRST', 'REMINDER_SECOND', 'REMINDER_FINAL', 'PAYMENT_RECEIVED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED', 'BOUNCED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "emailsSentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastEmailSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "resendId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "autoSendInvoice" BOOLEAN NOT NULL DEFAULT false,
    "autoSendReminders" BOOLEAN NOT NULL DEFAULT false,
    "autoSendPaymentConfirm" BOOLEAN NOT NULL DEFAULT true,
    "friendlyReminderDays" INTEGER NOT NULL DEFAULT -3,
    "firstReminderDays" INTEGER NOT NULL DEFAULT 7,
    "secondReminderDays" INTEGER NOT NULL DEFAULT 14,
    "finalReminderDays" INTEGER NOT NULL DEFAULT 30,
    "companyLogo" TEXT,
    "emailSignature" TEXT,
    "invoiceEmailCc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_invoiceId_idx" ON "EmailLog"("invoiceId");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_type_idx" ON "EmailLog"("type");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSettings_userId_key" ON "EmailSettings"("userId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSettings" ADD CONSTRAINT "EmailSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
