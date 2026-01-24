-- Index voor Company.userId (@@index in schema); IF NOT EXISTS voor dev-databases waar 20260123195532 al was toegepast
CREATE INDEX IF NOT EXISTS "Company_userId_idx" ON "Company"("userId");
