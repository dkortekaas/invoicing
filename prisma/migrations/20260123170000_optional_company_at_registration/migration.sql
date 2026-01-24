-- Maak bedrijfsgegevens optioneel: gebruikers vullen deze pas in na registratie (onboarding)
ALTER TABLE "User" ALTER COLUMN "companyName" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "companyEmail" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "companyAddress" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "companyCity" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "companyPostalCode" DROP NOT NULL;
