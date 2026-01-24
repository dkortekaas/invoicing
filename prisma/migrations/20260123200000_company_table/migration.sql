-- CreateTable Company: bedrijfsgegevens in aparte tabel
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nederland',
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Migreer bestaande bedrijfsgegevens van User naar Company
INSERT INTO "Company" ("id", "userId", "name", "email", "phone", "address", "city", "postalCode", "country", "logo", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  NULLIF(TRIM("companyName"), ''),
  NULLIF(TRIM("companyEmail"), ''),
  "companyPhone",
  NULLIF(TRIM("companyAddress"), ''),
  NULLIF(TRIM("companyCity"), ''),
  NULLIF(TRIM("companyPostalCode"), ''),
  COALESCE(NULLIF(TRIM("companyCountry"), ''), 'Nederland'),
  "companyLogo",
  NOW(),
  NOW()
FROM "User"
WHERE ("companyName" IS NOT NULL AND TRIM("companyName") != '')
   OR ("companyEmail" IS NOT NULL AND TRIM("companyEmail") != '')
   OR ("companyAddress" IS NOT NULL AND TRIM("companyAddress") != '')
   OR ("companyCity" IS NOT NULL AND TRIM("companyCity") != '')
   OR ("companyPostalCode" IS NOT NULL AND TRIM("companyPostalCode") != '');

-- Unieke index voor userId (1:1 relatie)
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- Foreign key
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verwijder bedrijfsvelden uit User
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyName";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyEmail";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyPhone";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyAddress";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyCity";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyPostalCode";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyCountry";
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyLogo";
