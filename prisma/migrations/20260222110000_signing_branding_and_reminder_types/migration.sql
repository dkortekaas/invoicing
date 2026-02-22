-- Extend ReminderType enum with specific auto-reminder types
ALTER TYPE "ReminderType" ADD VALUE 'AUTO_7_DAYS';
ALTER TYPE "ReminderType" ADD VALUE 'AUTO_3_DAYS';
ALTER TYPE "ReminderType" ADD VALUE 'AUTO_EXPIRY';

-- Add branding fields to UserSigningSettings
ALTER TABLE "UserSigningSettings"
  ADD COLUMN "logoUrl"      TEXT,
  ADD COLUMN "primaryColor" TEXT;
