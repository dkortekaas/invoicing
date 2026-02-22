import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseFile, detectColumnMapping } from '@/lib/import-export/import-service';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import type { EntityType } from '@/lib/import-export/fields';

const VALID_ENTITY_TYPES: EntityType[] = [
  'CUSTOMERS',
  'INVOICES',
  'EXPENSES',
  'PRODUCTS',
  'TIME_ENTRIES',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic byte signatures for allowed formats
const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04] // PK\x03\x04 — ZIP container (XLSX)
const XLS_MAGIC  = [0xd0, 0xcf, 0x11, 0xe0] // OLE2 compound document (XLS)

/**
 * Detects the actual file type from the first bytes of the buffer.
 * Returns the canonical MIME type or null for unrecognised/disallowed content.
 * Ignores the client-supplied Content-Type header, which is trivially spoofable.
 */
function detectMimeTypeFromBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null

  // XLSX (ZIP-based Office Open XML)
  if (
    buffer[0] === XLSX_MAGIC[0] &&
    buffer[1] === XLSX_MAGIC[1] &&
    buffer[2] === XLSX_MAGIC[2] &&
    buffer[3] === XLSX_MAGIC[3]
  ) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }

  // XLS (OLE2 compound document)
  if (
    buffer[0] === XLS_MAGIC[0] &&
    buffer[1] === XLS_MAGIC[1] &&
    buffer[2] === XLS_MAGIC[2] &&
    buffer[3] === XLS_MAGIC[3]
  ) {
    return 'application/vnd.ms-excel'
  }

  // UTF-8 BOM (EF BB BF) — common for CSV exports from Excel
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'text/csv'
  }

  // Heuristic: if the first 512 bytes contain no unexpected control bytes
  // the content is very likely plain-text CSV.
  const sample = buffer.slice(0, 512)
  const hasBinaryBytes = sample.some(
    (byte) => byte < 0x09 || (byte > 0x0d && byte < 0x20)
  )
  if (!hasBinaryBytes) {
    return 'text/csv'
  }

  return null // Unrecognised binary content
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const hasAccess = await hasFeatureAccess(session.user.id, 'import');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Import is alleen beschikbaar vanaf het Starter abonnement' },
        { status: 403 }
      );
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

    // Validate file size before reading the buffer (cheap early exit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximum is 10MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Server-side magic bytes check — do not trust the client-supplied Content-Type
    const mimeType = detectMimeTypeFromBytes(buffer);
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Ongeldig bestandstype. Alleen Excel (.xlsx, .xls) en CSV bestanden zijn toegestaan.' },
        { status: 400 }
      );
    }

    // Parse file — wrap separately so we can give actionable error messages
    let columns: string[]
    let rows: Record<string, unknown>[]
    try {
      const result = await parseFile(buffer, mimeType)
      columns = result.columns
      rows = result.rows
    } catch {
      if (mimeType === 'text/csv') {
        return NextResponse.json(
          {
            error:
              'Het CSV-bestand kon niet worden gelezen. Controleer of het scheidingsteken een komma (,) of puntkomma (;) is en of het bestand UTF-8 gecodeerd is.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        {
          error:
            'Het bestand kon niet worden gelezen. Controleer of het bestand niet beschadigd of beveiligd is met een wachtwoord.',
        },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      if (mimeType === 'text/csv') {
        return NextResponse.json(
          {
            error:
              'Het CSV-bestand bevat geen gegevensrijen. Controleer of het scheidingsteken (komma of puntkomma) correct is en het bestand daadwerkelijk gegevens bevat.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        {
          error:
            'Het bestand bevat geen gegevens. Controleer of je het juiste werkblad hebt geselecteerd en of er rijen met gegevens aanwezig zijn.',
        },
        { status: 400 }
      )
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

    // Store file content in DB (no temp file on disk; removed after upload)
    await db.importExportJob.update({
      where: { id: job.id },
      data: { fileContent: buffer },
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
