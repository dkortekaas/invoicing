-- AlterTable
ALTER TABLE "AccountingConnection" ADD COLUMN "existingCustomerStrategy" TEXT DEFAULT 'FIND_BY_EMAIL';
