-- PERF-04: Index on Expense.customerId for faster customer expense queries
CREATE INDEX "Expense_customerId_idx" ON "Expense"("customerId");

-- UX-03: Soft-delete for Invoice
ALTER TABLE "Invoice" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- UX-03: Soft-delete for Customer
ALTER TABLE "Customer" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");
