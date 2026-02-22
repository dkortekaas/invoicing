-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('MANUAL', 'AUTO');

-- AlterTable QuoteSigningReminder: add reminderType column
ALTER TABLE "QuoteSigningReminder" ADD COLUMN "reminderType" "ReminderType" NOT NULL DEFAULT 'AUTO';

-- AlterTable UserSigningSettings: add requireDrawnSignature column
ALTER TABLE "UserSigningSettings" ADD COLUMN "requireDrawnSignature" BOOLEAN NOT NULL DEFAULT false;
