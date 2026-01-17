'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Quarter {
  year: number;
  quarter: number;
  label: string;
  vatBalance: number;
  status: 'DRAFT' | 'FINAL' | 'FILED';
  totalRevenue: number;
  totalExpenses: number;
}

interface VATDashboardProps {
  quarters: Quarter[];
  currentQuarter: { year: number; quarter: number };
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Concept', variant: 'secondary' as const },
  FINAL: { label: 'Definitief', variant: 'default' as const },
  FILED: { label: 'Ingediend', variant: 'outline' as const },
};

export function VATDashboard({ quarters, currentQuarter }: VATDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quarters.slice(0, 3).map((q) => {
          const isCurrent = q.year === currentQuarter.year && q.quarter === currentQuarter.quarter;
          const statusConfig = STATUS_CONFIG[q.status];

          return (
            <Card key={`${q.year}-${q.quarter}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{q.label}</h3>
                    {isCurrent && (
                      <Badge variant="secondary" className="mt-1">Huidig kwartaal</Badge>
                    )}
                  </div>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Omzet</div>
                    <div className="text-xl font-semibold">{formatCurrency(q.totalRevenue)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Kosten</div>
                    <div className="text-xl font-semibold">{formatCurrency(q.totalExpenses)}</div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">BTW saldo</span>
                      <div className="flex items-center gap-2">
                        {q.vatBalance >= 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-xl font-bold ${q.vatBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(q.vatBalance))}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {q.vatBalance >= 0 ? 'Te betalen' : 'Terug te ontvangen'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/btw/kwartaal/${q.year}/${q.quarter}`}>
                      Details
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/api/vat/report/${q.year}/${q.quarter}/export`} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
