import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getQuarterInfo } from './calculations';

interface VATReportExportData {
  year: number;
  quarter: number;
  company: {
    name: string;
    vatNumber: string;
    address: string;
  };
  revenue: {
    highRate: number;
    highVAT: number;
    lowRate: number;
    lowVAT: number;
    zeroRate: number;
    reversed: number;
    eu: number;
    export: number;
  };
  expenses: {
    highRate: number;
    highVAT: number;
    lowRate: number;
    lowVAT: number;
    reversed: number;
  };
  totals: {
    revenue: number;
    revenueVAT: number;
    expenses: number;
    expensesVAT: number;
    vatOwed: number;
    vatDeductible: number;
    vatBalance: number;
  };
}

export async function exportVATReportToExcel(
  data: VATReportExportData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BTW Aangifte');

  const { startDate, endDate, label } = getQuarterInfo(data.year, data.quarter);

  // Styling
  const headerStyle = {
    font: { bold: true, size: 12 },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE0E0E0' },
    },
  };

  const currencyFormat = '€ #,##0.00';

  // Header
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = `BTW Aangifte ${label}`;
  worksheet.getCell('A1').font = { bold: true, size: 16 };

  worksheet.getCell('A2').value = 'Periode:';
  worksheet.getCell('B2').value = `${format(startDate, 'dd-MM-yyyy', { locale: nl })} t/m ${format(endDate, 'dd-MM-yyyy', { locale: nl })}`;

  worksheet.getCell('A3').value = 'Bedrijf:';
  worksheet.getCell('B3').value = data.company.name;

  worksheet.getCell('A4').value = 'BTW-nummer:';
  worksheet.getCell('B4').value = data.company.vatNumber;

  // Empty row
  const currentRow = 6;

  // OMZET SECTIE
  worksheet.getCell(`A${currentRow}`).value = 'OMZET (Prestaties/leveringen)';
  worksheet.getCell(`A${currentRow}`).style = headerStyle;
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);

  let row = currentRow + 1;

  // Hoog tarief
  worksheet.getCell(`A${row}`).value = 'Prestaties/leveringen belast met hoog tarief (21%)';
  worksheet.getCell(`C${row}`).value = data.revenue.highRate;
  worksheet.getCell(`C${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).value = data.revenue.highVAT;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  row++;

  // Laag tarief
  worksheet.getCell(`A${row}`).value = 'Prestaties/leveringen belast met laag tarief (9%)';
  worksheet.getCell(`C${row}`).value = data.revenue.lowRate;
  worksheet.getCell(`C${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).value = data.revenue.lowVAT;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  row++;

  // Nul tarief
  worksheet.getCell(`A${row}`).value = 'Prestaties/leveringen belast met overige tarieven (0%)';
  worksheet.getCell(`C${row}`).value = data.revenue.zeroRate;
  worksheet.getCell(`C${row}`).numFmt = currencyFormat;
  row++;

  // Verlegd
  if (data.revenue.reversed > 0) {
    worksheet.getCell(`A${row}`).value = 'Prestaties waarbij de omzetbelasting naar u is verlegd';
    worksheet.getCell(`C${row}`).value = data.revenue.reversed;
    worksheet.getCell(`C${row}`).numFmt = currencyFormat;
    row++;
  }

  // ICP
  if (data.revenue.eu > 0) {
    worksheet.getCell(`A${row}`).value = 'Leveringen naar landen binnen de EU (ICP)';
    worksheet.getCell(`C${row}`).value = data.revenue.eu;
    worksheet.getCell(`C${row}`).numFmt = currencyFormat;
    row++;
  }

  // Export
  if (data.revenue.export > 0) {
    worksheet.getCell(`A${row}`).value = 'Leveringen naar landen buiten de EU';
    worksheet.getCell(`C${row}`).value = data.revenue.export;
    worksheet.getCell(`C${row}`).numFmt = currencyFormat;
    row++;
  }

  row++;

  // VOORBELASTING SECTIE
  worksheet.getCell(`A${row}`).value = 'VOORBELASTING (Inkopen/kosten)';
  worksheet.getCell(`A${row}`).style = headerStyle;
  worksheet.mergeCells(`A${row}:D${row}`);
  row++;

  worksheet.getCell(`A${row}`).value = 'Voorbelasting hoog tarief (21%)';
  worksheet.getCell(`C${row}`).value = data.expenses.highRate;
  worksheet.getCell(`C${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).value = data.expenses.highVAT;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  row++;

  worksheet.getCell(`A${row}`).value = 'Voorbelasting laag tarief (9%)';
  worksheet.getCell(`C${row}`).value = data.expenses.lowRate;
  worksheet.getCell(`C${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).value = data.expenses.lowVAT;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  row++;

  if (data.expenses.reversed > 0) {
    worksheet.getCell(`A${row}`).value = 'Omzetbelasting verlegd naar u';
    worksheet.getCell(`D${row}`).value = data.expenses.reversed;
    worksheet.getCell(`D${row}`).numFmt = currencyFormat;
    row++;
  }

  row += 2;

  // TOTALEN
  worksheet.getCell(`A${row}`).value = 'TOTALEN';
  worksheet.getCell(`A${row}`).style = headerStyle;
  worksheet.mergeCells(`A${row}:D${row}`);
  row++;

  worksheet.getCell(`A${row}`).value = 'Totaal omzet (exclusief BTW)';
  worksheet.getCell(`D${row}`).value = data.totals.revenue;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).font = { bold: true };
  row++;

  worksheet.getCell(`A${row}`).value = 'Verschuldigde omzetbelasting (rubrieken 1a t/m 1e)';
  worksheet.getCell(`D${row}`).value = data.totals.revenueVAT;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).font = { bold: true };
  row++;

  worksheet.getCell(`A${row}`).value = 'Voorbelasting';
  worksheet.getCell(`D${row}`).value = data.totals.expensesVAT;
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).font = { bold: true };
  row++;

  row++;

  worksheet.getCell(`A${row}`).value = data.totals.vatBalance >= 0 ? 'TE BETALEN' : 'TERUG TE ONTVANGEN';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 14 };
  worksheet.getCell(`D${row}`).value = Math.abs(data.totals.vatBalance);
  worksheet.getCell(`D${row}`).numFmt = currencyFormat;
  worksheet.getCell(`D${row}`).font = { bold: true, size: 14 };
  worksheet.getCell(`D${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: data.totals.vatBalance >= 0 ? 'FFFFCCCC' : 'FFCCFFCC' },
  };

  // Column widths
  worksheet.getColumn('A').width = 50;
  worksheet.getColumn('B').width = 20;
  worksheet.getColumn('C').width = 15;
  worksheet.getColumn('D').width = 15;

  // Headers voor bedragen
  worksheet.getCell('C5').value = 'Bedrag';
  worksheet.getCell('C5').font = { bold: true };
  worksheet.getCell('D5').value = 'BTW';
  worksheet.getCell('D5').font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
