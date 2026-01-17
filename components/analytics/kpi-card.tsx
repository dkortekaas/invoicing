'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  invertTrend?: boolean; // For metrics where down is good (e.g. expenses)
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  invertTrend = false,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') {
      return <Minus className="h-4 w-4" />;
    }
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-muted-foreground';
    
    const isPositive = invertTrend 
      ? trend === 'down' 
      : trend === 'up';
    
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">vs {changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
