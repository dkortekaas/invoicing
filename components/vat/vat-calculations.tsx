'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VATCalculationsProps {
  report: {
    revenueHighRate: number;
    revenueHighVAT: number;
    revenueLowRate: number;
    revenueLowVAT: number;
    revenueZeroRate: number;
    revenueReversed: number;
    revenueEU: number;
    revenueExport: number;
    expensesHighRate: number;
    expensesHighVAT: number;
    expensesLowRate: number;
    expensesLowVAT: number;
    expensesReversed: number;
    totalRevenue: number;
    totalRevenueVAT: number;
    totalExpenses: number;
    totalExpensesVAT: number;
    vatOwed: number;
    vatDeductible: number;
    vatBalance: number;
  };
}

export function VATCalculations({ report }: VATCalculationsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* OMZET */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Omzet (Prestaties/leveringen)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="text-right">Bedrag (excl. BTW)</TableHead>
                <TableHead className="text-right">BTW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Prestaties/leveringen belast met hoog tarief (21%)</TableCell>
                <TableCell className="text-right">{formatCurrency(report.revenueHighRate)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(report.revenueHighVAT)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Prestaties/leveringen belast met laag tarief (9%)</TableCell>
                <TableCell className="text-right">{formatCurrency(report.revenueLowRate)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(report.revenueLowVAT)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Prestaties/leveringen belast met overige tarieven (0%)</TableCell>
                <TableCell className="text-right">{formatCurrency(report.revenueZeroRate)}</TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
              {report.revenueReversed > 0 && (
                <TableRow>
                  <TableCell>Prestaties waarbij de BTW naar u is verlegd</TableCell>
                  <TableCell className="text-right">{formatCurrency(report.revenueReversed)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
              )}
              {report.revenueEU > 0 && (
                <TableRow>
                  <TableCell>Leveringen naar landen binnen de EU (ICP)</TableCell>
                  <TableCell className="text-right">{formatCurrency(report.revenueEU)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
              )}
              {report.revenueExport > 0 && (
                <TableRow>
                  <TableCell>Leveringen naar landen buiten de EU</TableCell>
                  <TableCell className="text-right">{formatCurrency(report.revenueExport)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
              )}
              <TableRow className="font-semibold">
                <TableCell>Totaal omzet</TableCell>
                <TableCell className="text-right">{formatCurrency(report.totalRevenue)}</TableCell>
                <TableCell className="text-right">{formatCurrency(report.totalRevenueVAT)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* VOORBELASTING */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Voorbelasting (Inkopen/kosten)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="text-right">Bedrag (excl. BTW)</TableHead>
                <TableHead className="text-right">BTW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Voorbelasting hoog tarief (21%)</TableCell>
                <TableCell className="text-right">{formatCurrency(report.expensesHighRate)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(report.expensesHighVAT)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Voorbelasting laag tarief (9%)</TableCell>
                <TableCell className="text-right">{formatCurrency(report.expensesLowRate)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(report.expensesLowVAT)}</TableCell>
              </TableRow>
              {report.expensesReversed > 0 && (
                <TableRow>
                  <TableCell>Omzetbelasting verlegd naar u</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(report.expensesReversed)}</TableCell>
                </TableRow>
              )}
              <TableRow className="font-semibold">
                <TableCell>Totaal voorbelasting</TableCell>
                <TableCell className="text-right">{formatCurrency(report.totalExpenses)}</TableCell>
                <TableCell className="text-right">{formatCurrency(report.totalExpensesVAT)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SALDO */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">BTW Saldo</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Verschuldigde omzetbelasting</span>
              <span className="font-medium">{formatCurrency(report.vatOwed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voorbelasting</span>
              <span className="font-medium">{formatCurrency(report.vatDeductible)}</span>
            </div>
            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-lg font-semibold">
                {report.vatBalance >= 0 ? 'TE BETALEN' : 'TERUG TE ONTVANGEN'}
              </span>
              <span className={`text-2xl font-bold ${report.vatBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(report.vatBalance))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
