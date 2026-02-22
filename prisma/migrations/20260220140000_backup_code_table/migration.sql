-- SEC-09: Replace user.backupCodes JSON column with a dedicated BackupCode table.
-- This allows per-code indexing, audit trail via usedAt, and individual anonymisation.

-- Create BackupCode table
CREATE TABLE "BackupCode" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "codeHash"  TEXT         NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BackupCode"
  ADD CONSTRAINT "BackupCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "BackupCode_userId_idx"   ON "BackupCode"("userId");
CREATE INDEX "BackupCode_codeHash_idx" ON "BackupCode"("codeHash");

-- Migrate existing backup codes from the JSON column to the new table.
-- Each element of the JSON array becomes an individual BackupCode row.
-- Uses a PL/pgSQL block so malformed JSON for any single user is skipped safely.
DO $$
DECLARE
  r         RECORD;
  code_hash TEXT;
BEGIN
  FOR r IN
    SELECT id, "backupCodes"
    FROM   "User"
    WHERE  "backupCodes" IS NOT NULL
      AND  "backupCodes" NOT IN ('null', '[]', '')
  LOOP
    BEGIN
      FOR code_hash IN
        SELECT jsonb_array_elements_text(r."backupCodes"::jsonb)
      LOOP
        IF code_hash IS NOT NULL AND code_hash <> '' THEN
          INSERT INTO "BackupCode" ("id", "userId", "codeHash", "createdAt")
          VALUES (gen_random_uuid()::text, r.id, code_hash, NOW());
        END IF;
      END LOOP;
    EXCEPTION WHEN others THEN
      -- Skip users whose backupCodes value is not valid JSON
      NULL;
    END;
  END LOOP;
END $$;

-- Drop the now-redundant JSON column
ALTER TABLE "User" DROP COLUMN "backupCodes";
