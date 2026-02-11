interface KPIData {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  totalProfit: number;
  profitMargin: number;
  totalOutstanding: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  averageInvoiceValue: number;
  averagePaymentDays: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
}

interface TrendData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  invoices: number;
  hours?: number;
}

interface CustomerData {
  name: string;
  value: number;
  percentage: number;
}

export async function exportAnalyticsToExcel(data: {
  kpis: KPIData;
  trends: TrendData[];
  customers: CustomerData[];
  period: { start: Date; end: Date };
}): Promise<Buffer> {
  const { default: ExcelJSModule } = await import('exceljs');
  const workbook = new ExcelJSModule.Workbook();

  // KPIs Sheet
  const kpisSheet = workbook.addWorksheet('KPI Overzicht');
  
  kpisSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Waarde', key: 'value', width: 20 },
  ];

  kpisSheet.addRows([
    { metric: 'Totale omzet', value: data.kpis.totalRevenue },
    { metric: 'Omzet deze maand', value: data.kpis.revenueThisMonth },
    { metric: 'Omzet groei', value: `${data.kpis.revenueGrowth.toFixed(1)}%` },
    { metric: 'Totale winst', value: data.kpis.totalProfit },
    { metric: 'Winst marge', value: `${data.kpis.profitMargin.toFixed(1)}%` },
    { metric: 'Openstaand', value: data.kpis.totalOutstanding },
    { metric: 'Achterstallig', value: data.kpis.overdueAmount },
    { metric: 'Aantal facturen', value: data.kpis.totalInvoices },
    { metric: 'Betaalde facturen', value: data.kpis.paidInvoices },
    { metric: 'Onbetaalde facturen', value: data.kpis.unpaidInvoices },
    { metric: 'Gemiddelde factuurwaarde', value: data.kpis.averageInvoiceValue },
    { metric: 'Gemiddelde betaaltermijn (dagen)', value: Math.round(data.kpis.averagePaymentDays) },
    { metric: 'Totaal klanten', value: data.kpis.totalCustomers },
    { metric: 'Actieve klanten', value: data.kpis.activeCustomers },
    { metric: 'Nieuwe klanten', value: data.kpis.newCustomers },
  ]);

  // Format currency cells
  kpisSheet.getColumn('value').eachCell((cell, rowNumber) => {
    if (rowNumber > 1 && typeof cell.value === 'number') {
      cell.numFmt = '€ #,##0.00';
    }
  });

  // Trends Sheet
  const trendsSheet = workbook.addWorksheet('Maandelijkse Trends');
  
  trendsSheet.columns = [
    { header: 'Maand', key: 'month', width: 15 },
    { header: 'Omzet', key: 'revenue', width: 15 },
    { header: 'Kosten', key: 'expenses', width: 15 },
    { header: 'Winst', key: 'profit', width: 15 },
    { header: 'Facturen', key: 'invoices', width: 12 },
  ];

  if (data.trends[0]?.hours !== undefined) {
    trendsSheet.columns.push({ header: 'Uren', key: 'hours', width: 12 });
  }

  trendsSheet.addRows(data.trends);

  trendsSheet.getColumn('revenue').numFmt = '€ #,##0.00';
  trendsSheet.getColumn('expenses').numFmt = '€ #,##0.00';
  trendsSheet.getColumn('profit').numFmt = '€ #,##0.00';

  // Customers Sheet
  const customersSheet = workbook.addWorksheet('Top Klanten');
  
  customersSheet.columns = [
    { header: 'Klant', key: 'name', width: 30 },
    { header: 'Omzet', key: 'value', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 12 },
  ];

  customersSheet.addRows(
    data.customers.map(c => ({
      ...c,
      percentage: `${c.percentage.toFixed(1)}%`,
    }))
  );

  customersSheet.getColumn('value').numFmt = '€ #,##0.00';

  // Style headers
  [kpisSheet, trendsSheet, customersSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
