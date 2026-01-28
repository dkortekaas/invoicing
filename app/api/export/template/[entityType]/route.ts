import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateTemplate } from '@/lib/import-export/export-service';
import type { EntityType } from '@/lib/import-export/fields';

const ENTITY_FILE_NAMES: Record<EntityType, string> = {
  CUSTOMERS: 'klanten-template',
  INVOICES: 'facturen-template',
  EXPENSES: 'onkosten-template',
  PRODUCTS: 'producten-template',
  TIME_ENTRIES: 'urenregistratie-template',
};

const VALID_ENTITY_TYPES: EntityType[] = [
  'CUSTOMERS',
  'INVOICES',
  'EXPENSES',
  'PRODUCTS',
  'TIME_ENTRIES',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { entityType } = await params;
    const upperEntityType = entityType.toUpperCase() as EntityType;

    if (!VALID_ENTITY_TYPES.includes(upperEntityType)) {
      return NextResponse.json(
        { error: 'Ongeldig entiteit type' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fileFormat = (searchParams.get('format') || 'xlsx') as 'csv' | 'xlsx';

    const buffer = await generateTemplate(upperEntityType, fileFormat);

    const fileName = ENTITY_FILE_NAMES[upperEntityType];
    const extension = fileFormat === 'xlsx' ? 'xlsx' : 'csv';
    const contentType =
      fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}.${extension}"`,
      },
    });
  } catch (error) {
    console.error('Generate template error:', error);
    return NextResponse.json(
      { error: 'Template genereren mislukt' },
      { status: 500 }
    );
  }
}
