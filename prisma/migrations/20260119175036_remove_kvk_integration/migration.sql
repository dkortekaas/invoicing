-- DropForeignKey
ALTER TABLE "SbiCode" DROP CONSTRAINT IF EXISTS "SbiCode_customerId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Customer_kvkNumber_idx";

-- DropIndex
DROP INDEX IF EXISTS "Customer_kvkNumber_key";

-- DropIndex
DROP INDEX IF EXISTS "KvkCache_expiresAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "KvkCache_cacheKey_key";

-- DropIndex
DROP INDEX IF EXISTS "SbiCode_code_idx";

-- DropIndex
DROP INDEX IF EXISTS "SbiCode_customerId_idx";

-- DropTable
DROP TABLE IF EXISTS "KvkCache";

-- DropTable
DROP TABLE IF EXISTS "SbiCode";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "kvkData",
DROP COLUMN IF EXISTS "kvkLastSync",
DROP COLUMN IF EXISTS "kvkNumber",
DROP COLUMN IF EXISTS "legalForm",
DROP COLUMN IF EXISTS "tradeNames";
