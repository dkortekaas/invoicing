import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseFile, detectColumnMapping } from '@/lib/import-export/import-service';
import type { EntityType } from '@/lib/import-export/fields';

const VALID_ENTITY_TYPES: EntityType[] = [
  'CUSTOMERS',
  'INVOICES',
  'EXPENSES',
  'PRODUCTS',
  'TIME_ENTRIES',
];

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'application/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityTypeRaw = formData.get('entityType') as string;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
    }

    const entityType = entityTypeRaw?.toUpperCase() as EntityType;
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ error: 'Ongeldig entiteit type' }, { status: 400 });
    }

    // Validate file type
    const mimeType = file.type || 'text/csv';
    if (!ALLOWED_MIME_TYPES.includes(mimeType) && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Ongeldig bestandstype. Alleen Excel (.xlsx) en CSV bestanden zijn toegestaan.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximum is 10MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse file
    const { columns, rows } = await parseFile(buffer, mimeType);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Bestand is leeg of kon niet worden gelezen' },
        { status: 400 }
      );
    }

    if (rows.length > 10000) {
      return NextResponse.json(
        { error: 'Maximaal 10.000 rijen per import' },
        { status: 400 }
      );
    }

    // Create job record
    const job = await db.importExportJob.create({
      data: {
        userId: session.user.id,
        type: 'IMPORT',
        entityType,
        status: 'PENDING',
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        totalRows: rows.length,
      },
    });

    // Save file temporarily
    const uploadsDir = join(process.cwd(), 'tmp', 'imports');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, `${job.id}-${file.name}`);
    await writeFile(filePath, buffer);

    await db.importExportJob.update({
      where: { id: job.id },
      data: { filePath },
    });

    // Auto-detect column mapping
    const suggestedMapping = detectColumnMapping(columns, entityType);

    return NextResponse.json({
      jobId: job.id,
      fileName: file.name,
      totalRows: rows.length,
      columns,
      sampleData: rows.slice(0, 5),
      suggestedMapping,
    });
  } catch (error) {
    console.error('Import upload error:', error);
    return NextResponse.json(
      { error: 'Upload mislukt' },
      { status: 500 }
    );
  }
}
