'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp } from 'lucide-react';

interface Goal {
  type: string;
  label: string;
  target: number;
  current: number;
  unit: string;
}

interface GoalsProgressProps {
  goals: Goal[];
}

export function GoalsProgress({ goals }: GoalsProgressProps) {
  const formatValue = (value: number, unit: string) => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <CardTitle>Doelstellingen</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const achieved = percentage >= 100;

            return (
              <div key={goal.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{goal.label}</span>
                    {achieved && (
                      <Badge variant="default" className="bg-green-600">
                        Behaald!
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatValue(goal.current, goal.unit)} / {formatValue(goal.target, goal.unit)}
                  </div>
                </div>
                
                <Progress value={percentage} className="h-2" />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(0)}% behaald</span>
                  {!achieved && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Nog {formatValue(goal.target - goal.current, goal.unit)} te gaan
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Geen doelstellingen ingesteld</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
