-- AlterTable: voeg portalToken toe aan Customer voor klantportaal-toegang
ALTER TABLE "Customer" ADD COLUMN "portalToken" TEXT;

-- UniqueIndex voor snelle lookup via token
CREATE UNIQUE INDEX "Customer_portalToken_key" ON "Customer"("portalToken");

-- Extra index voor aanwezigheid-check
CREATE INDEX "Customer_portalToken_idx" ON "Customer"("portalToken");
