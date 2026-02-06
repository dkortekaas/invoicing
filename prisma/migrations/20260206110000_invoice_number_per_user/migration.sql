-- Drop global unique on invoiceNumber so each user can have their own sequence (e.g. 2025-0001 per user)
DROP INDEX IF EXISTS "Invoice_invoiceNumber_key";

-- Unique per user: (userId, invoiceNumber)
CREATE UNIQUE INDEX "Invoice_userId_invoiceNumber_key" ON "Invoice"("userId", "invoiceNumber");
