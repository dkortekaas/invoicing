import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { auth } from '@/lib/auth';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import { getTaxReport } from '@/lib/tax';
import { TAX_RATES_2026 } from '@/lib/tax/rates';

interface RouteParams {
  params: Promise<{ year: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check feature access
    const hasAccess = await hasFeatureAccess(session.user.id, 'tax_reporting');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Upgrade naar Pro voor deze functie' },
        { status: 403 }
      );
    }

    const { year: yearStr } = await params;
    const year = parseInt(yearStr, 10);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Ongeldig jaar' }, { status: 400 });
    }

    const report = await getTaxReport(session.user.id, year);

    if (!report) {
      return NextResponse.json(
        { error: 'Rapport niet gevonden' },
        { status: 404 }
      );
    }

    // Generate Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Declair';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Samenvatting');
    addSummarySheet(summarySheet, report, year);

    // Revenue & Expenses sheet
    const revenueSheet = workbook.addWorksheet('Omzet en Kosten');
    addRevenueSheet(revenueSheet, report);

    // Deductions sheet
    const deductionsSheet = workbook.addWorksheet('Aftrekposten');
    addDeductionsSheet(deductionsSheet, report);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const date = format(new Date(), 'yyyy-MM-dd');

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="belastingoverzicht-${year}-${date}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export tax report error:', error);
    return NextResponse.json({ error: 'Export mislukt' }, { status: 500 });
  }
}

function formatCurrency(value: number | { toNumber(): number }): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

function addSummarySheet(
  sheet: ExcelJS.Worksheet,
  report: Record<string, unknown>,
  year: number
) {
  // Title
  sheet.mergeCells('A1:C1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Belastingoverzicht ${year}`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  // Status
  sheet.getCell('A3').value = 'Status:';
  sheet.getCell('B3').value = getStatusLabel(report.status as string);
  sheet.getCell('A4').value = 'Gegenereerd op:';
  sheet.getCell('B4').value = format(
    new Date(report.generatedAt as Date),
    'd MMMM yyyy HH:mm',
    { locale: nl }
  );

  // Key figures
  sheet.getCell('A6').value = 'Belangrijkste cijfers';
  sheet.getCell('A6').font = { bold: true, size: 14 };

  const keyFigures = [
    ['Netto omzet', formatCurrency(report.revenueNet as number)],
    ['Totaal kosten', formatCurrency(report.expensesTotal as number)],
    ['Afschrijvingen', formatCurrency(report.depreciationTotal as number)],
    ['Bruto winst', formatCurrency(report.grossProfit as number)],
    [''],
    ['Totaal aftrekposten', calculateTotalDeductions(report)],
    [''],
    ['Belastbaar inkomen', formatCurrency(report.taxableProfit as number)],
    ['Geschatte belasting Box 1', formatCurrency(report.estimatedTaxBox1 as number)],
  ];

  keyFigures.forEach((row, index) => {
    sheet.getCell(`A${8 + index}`).value = row[0];
    sheet.getCell(`B${8 + index}`).value = row[1];
    if (row[0] === 'Bruto winst' || row[0] === 'Belastbaar inkomen') {
      sheet.getCell(`A${8 + index}`).font = { bold: true };
      sheet.getCell(`B${8 + index}`).font = { bold: true };
    }
    if (row[0] === 'Geschatte belasting Box 1') {
      sheet.getCell(`B${8 + index}`).font = { bold: true, color: { argb: 'FFCC0000' } };
    }
  });

  // Hours criterion
  if (report.hoursWorked !== null && report.hoursWorked !== undefined) {
    sheet.getCell('A20').value = 'Urencriterium';
    sheet.getCell('A20').font = { bold: true, size: 14 };
    sheet.getCell('A21').value = 'Geregistreerde uren:';
    sheet.getCell('B21').value = report.hoursWorked as number;
    sheet.getCell('A22').value = 'Vereist minimum:';
    sheet.getCell('B22').value = TAX_RATES_2026.hoursCriterionMin;
    sheet.getCell('A23').value = 'Voldoet aan criterium:';
    sheet.getCell('B23').value = report.meetsHoursCriterion ? 'Ja' : 'Nee';
  }

  // Set column widths
  sheet.getColumn('A').width = 30;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 15;
}

function addRevenueSheet(sheet: ExcelJS.Worksheet, report: Record<string, unknown>) {
  // Title
  sheet.getCell('A1').value = 'Omzet en Kosten';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  // Revenue section
  sheet.getCell('A3').value = 'OMZET';
  sheet.getCell('A3').font = { bold: true };

  const revenueRows = [
    ['Bruto omzet', formatCurrency(report.revenueGross as number)],
    ['Credit nota\'s', `-${formatCurrency(report.creditNotesTotal as number)}`],
    ['Netto omzet', formatCurrency(report.revenueNet as number)],
  ];

  revenueRows.forEach((row, index) => {
    sheet.getCell(`A${4 + index}`).value = row[0];
    sheet.getCell(`B${4 + index}`).value = row[1];
  });
  sheet.getCell('A6').font = { bold: true };
  sheet.getCell('B6').font = { bold: true };

  // Expenses section
  sheet.getCell('A9').value = 'KOSTEN';
  sheet.getCell('A9').font = { bold: true };

  const expenseRows = [
    ['Vervoerskosten', formatCurrency(report.expensesTransport as number)],
    ['Huisvestingskosten', formatCurrency(report.expensesHousing as number)],
    ['Algemene kosten', formatCurrency(report.expensesGeneral as number)],
    ['Kantoorkosten', formatCurrency(report.expensesOffice as number)],
    ['Uitbesteed werk', formatCurrency(report.expensesOutsourced as number)],
    ['Representatiekosten', formatCurrency(report.expensesRepresentation as number)],
    ['Overige kosten', formatCurrency(report.expensesOther as number)],
    ['', ''],
    ['Totaal kosten', formatCurrency(report.expensesTotal as number)],
  ];

  expenseRows.forEach((row, index) => {
    sheet.getCell(`A${10 + index}`).value = row[0];
    sheet.getCell(`B${10 + index}`).value = row[1];
  });
  sheet.getCell('A18').font = { bold: true };
  sheet.getCell('B18').font = { bold: true };

  // Depreciation
  sheet.getCell('A20').value = 'Afschrijvingen';
  sheet.getCell('B20').value = formatCurrency(report.depreciationTotal as number);

  // Gross profit
  sheet.getCell('A22').value = 'BRUTO WINST';
  sheet.getCell('A22').font = { bold: true, size: 12 };
  sheet.getCell('B22').value = formatCurrency(report.grossProfit as number);
  sheet.getCell('B22').font = { bold: true, size: 12 };

  // Set column widths
  sheet.getColumn('A').width = 30;
  sheet.getColumn('B').width = 20;
}

function addDeductionsSheet(sheet: ExcelJS.Worksheet, report: Record<string, unknown>) {
  // Title
  sheet.getCell('A1').value = 'Aftrekposten';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  // Starting point
  sheet.getCell('A3').value = 'Bruto winst';
  sheet.getCell('B3').value = formatCurrency(report.grossProfit as number);
  sheet.getCell('A3').font = { bold: true };
  sheet.getCell('B3').font = { bold: true };

  // Deductions
  sheet.getCell('A5').value = 'ONDERNEMERSAFTREKKEN';
  sheet.getCell('A5').font = { bold: true };

  const deductions = [
    [
      'Kleinschaligheidsinvesteringsaftrek (KIA)',
      report.kiaAmount as number > 0 ? `-${formatCurrency(report.kiaAmount as number)}` : '-',
      `Investeringen: ${formatCurrency(report.kiaInvestments as number)}`,
    ],
    [
      'Zelfstandigenaftrek',
      report.zelfstandigenaftrek as number > 0 ? `-${formatCurrency(report.zelfstandigenaftrek as number)}` : '-',
      report.meetsHoursCriterion ? 'Urencriterium voldaan' : 'Niet van toepassing',
    ],
    [
      'Startersaftrek',
      report.startersaftrek as number > 0 ? `-${formatCurrency(report.startersaftrek as number)}` : '-',
      '',
    ],
    [
      'Fiscale Oudedagsreserve (FOR)',
      report.forDotation as number > 0 ? `-${formatCurrency(report.forDotation as number)}` : '-',
      '',
    ],
  ];

  deductions.forEach((row, index) => {
    sheet.getCell(`A${6 + index}`).value = row[0];
    sheet.getCell(`B${6 + index}`).value = row[1];
    sheet.getCell(`C${6 + index}`).value = row[2];
    sheet.getCell(`C${6 + index}`).font = { italic: true, color: { argb: 'FF666666' } };
  });

  // Profit before MKB
  sheet.getCell('A11').value = 'Winst voor MKB-vrijstelling';
  sheet.getCell('B11').value = formatCurrency(report.profitBeforeMKB as number);
  sheet.getCell('A11').font = { bold: true };
  sheet.getCell('B11').font = { bold: true };

  // MKB exemption
  sheet.getCell('A13').value = 'MKB-winstvrijstelling';
  sheet.getCell('B13').value = report.mkbVrijstelling as number > 0
    ? `-${formatCurrency(report.mkbVrijstelling as number)}`
    : '-';
  sheet.getCell('C13').value = `${TAX_RATES_2026.mkbVrijstellingPercentage}% van de winst`;
  sheet.getCell('C13').font = { italic: true, color: { argb: 'FF666666' } };

  // Taxable income
  sheet.getCell('A15').value = 'BELASTBAAR INKOMEN';
  sheet.getCell('A15').font = { bold: true, size: 12 };
  sheet.getCell('B15').value = formatCurrency(report.taxableProfit as number);
  sheet.getCell('B15').font = { bold: true, size: 12 };

  // Estimated tax
  sheet.getCell('A17').value = 'Geschatte belasting Box 1';
  sheet.getCell('A17').font = { bold: true };
  sheet.getCell('B17').value = formatCurrency(report.estimatedTaxBox1 as number);
  sheet.getCell('B17').font = { bold: true, color: { argb: 'FFCC0000' } };
  sheet.getCell('C17').value = 'Dit is een indicatie';
  sheet.getCell('C17').font = { italic: true, color: { argb: 'FF666666' } };

  // Tax brackets info
  sheet.getCell('A20').value = 'Tarieven Box 1 (2026)';
  sheet.getCell('A20').font = { bold: true };
  sheet.getCell('A21').value = `Tot € ${TAX_RATES_2026.box1.bracket1Max.toLocaleString('nl-NL')}`;
  sheet.getCell('B21').value = `${TAX_RATES_2026.box1.bracket1Rate}%`;
  sheet.getCell('A22').value = `Boven € ${TAX_RATES_2026.box1.bracket1Max.toLocaleString('nl-NL')}`;
  sheet.getCell('B22').value = `${TAX_RATES_2026.box1.bracket2Rate}%`;

  // Set column widths
  sheet.getColumn('A').width = 40;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 30;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Concept',
    PROVISIONAL: 'Voorlopig',
    FINAL: 'Definitief',
    FILED: 'Ingediend bij Belastingdienst',
  };
  return labels[status] || status;
}

function calculateTotalDeductions(report: Record<string, unknown>): string {
  const total =
    (report.kiaAmount as number) +
    (report.zelfstandigenaftrek as number) +
    (report.startersaftrek as number) +
    (report.forDotation as number) +
    (report.mkbVrijstelling as number);
  return formatCurrency(total);
}
