-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('REVENUE', 'PROFIT', 'HOURS', 'CLIENTS');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "BusinessGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "period" "GoalPeriod" NOT NULL,
    "targetRevenue" DECIMAL(10,2),
    "targetProfit" DECIMAL(10,2),
    "targetHours" DECIMAL(10,2),
    "targetClients" INTEGER,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "month" INTEGER,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL,
    "expenses" DECIMAL(10,2) NOT NULL,
    "profit" DECIMAL(10,2) NOT NULL,
    "invoicesSent" INTEGER NOT NULL,
    "invoicesPaid" INTEGER NOT NULL,
    "newCustomers" INTEGER NOT NULL,
    "activeProjects" INTEGER NOT NULL,
    "hoursLogged" DECIMAL(10,2) NOT NULL,
    "billableHours" DECIMAL(10,2) NOT NULL,
    "outstanding" DECIMAL(10,2) NOT NULL,
    "overdue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessGoal_userId_idx" ON "BusinessGoal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessGoal_userId_type_period_year_quarter_month_key" ON "BusinessGoal"("userId", "type", "period", "year", "quarter", "month");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_userId_idx" ON "AnalyticsSnapshot"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_date_idx" ON "AnalyticsSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_userId_date_key" ON "AnalyticsSnapshot"("userId", "date");

-- AddForeignKey
ALTER TABLE "BusinessGoal" ADD CONSTRAINT "BusinessGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
