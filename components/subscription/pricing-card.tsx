'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: number;
  interval: 'month' | 'year';
  priceId: string;
  features: string[];
  popular?: boolean;
  currentPlan?: boolean;
  onSubscribe?: (priceId: string) => Promise<void>;
}

export function PricingCard({
  name,
  price,
  interval,
  priceId,
  features,
  popular = false,
  currentPlan = false,
  onSubscribe,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!onSubscribe) return;
    
    setLoading(true);
    try {
      await onSubscribe(priceId);
    } catch (error) {
      console.error('Subscribe error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    const formatted = formatCurrency(price / 100);

    return (
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold">{formatted}</span>
        <span className="text-muted-foreground">/{interval === 'month' ? 'maand' : 'jaar'}</span>
      </div>
    );
  };

  return (
    <Card className={`relative ${popular ? 'border-primary border-2' : ''}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Populair
        </Badge>
      )}

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{name}</h3>
            <div className="mt-4">{formatPrice()}</div>
            {interval === 'year' && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency((price / 100) / 12)}/maand
              </p>
            )}
          </div>

          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            onClick={handleSubscribe}
            disabled={loading || currentPlan}
            variant={popular ? 'default' : 'outline'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentPlan ? 'Huidig plan' : 'Upgrade nu'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
