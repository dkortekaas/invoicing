'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/analytics/kpi-card';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { CustomerChart } from '@/components/analytics/customer-chart';
import { CashflowChart } from '@/components/analytics/cashflow-chart';
import { GoalsProgress } from '@/components/analytics/goals-progress';
import { PeriodSelector } from '@/components/analytics/period-selector';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';

export default function DashboardPage() {
  const [kpis, setKPIs] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'custom' | 'month' | 'quarter' | 'year'>('year');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    loadData();
  }, [period, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        params.set('startDate', dateRange.from.toISOString());
        params.set('endDate', dateRange.to.toISOString());
      }

      const [kpisRes, trendsRes, customersRes] = await Promise.all([
        fetch(`/api/analytics/kpis?${params.toString()}`),
        fetch('/api/analytics/trends?months=12'),
        fetch(`/api/analytics/customers?limit=5&${params.toString()}`),
      ]);

      const kpisData = await kpisRes.json();
      const trendsData = await trendsRes.json();
      const customersData = await customersRes.json();

      setKPIs(kpisData);
      setTrends(trendsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/analytics/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analytics-${new Date().getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overzicht van je business</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Geen data beschikbaar</p>
      </div>
    );
  }

  // Prepare cashflow data
  const cashflowData = trends.map(t => ({
    month: t.month,
    income: t.revenue,
    expenses: t.expenses,
    cashflow: t.profit,
  }));

  // Mock goals (in production, fetch from API)
  const goals = [
    {
      type: 'revenue',
      label: 'Omzet dit jaar',
      target: 100000,
      current: kpis.totalRevenue,
      unit: 'currency',
    },
    {
      type: 'clients',
      label: 'Actieve klanten',
      target: 20,
      current: kpis.activeCustomers,
      unit: 'number',
    },
  ];

  if (kpis.totalHours !== undefined) {
    goals.push({
      type: 'hours',
      label: 'Billable hours',
      target: 1500,
      current: kpis.billableHours || 0,
      unit: 'number',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welkom terug! Hier is een overzicht van je business.</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Omzet deze maand"
          value={formatCurrency(kpis.revenueThisMonth)}
          change={kpis.revenueGrowth}
          changeLabel="vorige maand"
          icon={<DollarSign className="h-5 w-5" />}
          trend={
            Math.abs(kpis.revenueGrowth) < 1 
              ? 'neutral' 
              : kpis.revenueGrowth > 0 
                ? 'up' 
                : 'down'
          }
        />

        <KPICard
          title="Winst marge"
          value={`${kpis.profitMargin.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <KPICard
          title="Openstaand"
          value={formatCurrency(kpis.totalOutstanding)}
          icon={<FileText className="h-5 w-5" />}
        />

        <KPICard
          title="Actieve klanten"
          value={kpis.activeCustomers.toString()}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Gemiddelde betaaltermijn"
          value={`${Math.round(kpis.averagePaymentDays)} dagen`}
          icon={<Clock className="h-5 w-5" />}
        />

        <KPICard
          title="Gemiddelde factuurwaarde"
          value={formatCurrency(kpis.averageInvoiceValue)}
          icon={<DollarSign className="h-5 w-5" />}
        />

        {kpis.overdueAmount > 0 && (
          <KPICard
            title="Achterstallig"
            value={formatCurrency(kpis.overdueAmount)}
            icon={<AlertCircle className="h-5 w-5" />}
            trend="down"
            invertTrend={true}
          />
        )}

        {kpis.utilizationRate !== undefined && (
          <KPICard
            title="Utilization Rate"
            value={`${kpis.utilizationRate.toFixed(1)}%`}
            icon={<Clock className="h-5 w-5" />}
          />
        )}

        {kpis.mrr !== undefined && (
          <KPICard
            title="MRR"
            value={formatCurrency(kpis.mrr)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={trends} type="bar" />
        <CustomerChart data={customers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashflowChart data={cashflowData} />
        </div>
        <GoalsProgress goals={goals} />
      </div>
    </div>
  );
}
