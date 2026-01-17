'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';

interface RecurringStatsProps {
  stats: {
    totalMRR: number;
    totalARR: number;
    activeSubscriptions: number;
    totalCustomers: number;
  };
}

export function RecurringStats({ stats }: RecurringStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">MRR</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalMRR)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ARR</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalARR)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actieve abonnementen</p>
            <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Klanten</p>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
