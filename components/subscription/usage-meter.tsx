'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UsageMeterProps {
  current: number;
  limit: number;
  label: string;
}

export function UsageMeter({ current, limit, label }: UsageMeterProps) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <Card className={`${isNearLimit ? 'border-orange-500' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm text-muted-foreground">
              {current} / {limit}
            </span>
          </div>

          <Progress value={percentage} className="h-2" />

          {isNearLimit && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-orange-600">
                Je nadert je limiet
              </p>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/upgrade">Upgrade</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
