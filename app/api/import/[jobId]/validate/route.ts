import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseFile, validateImport } from '@/lib/import-export/import-service';
import type { EntityType } from '@/lib/import-export/fields';

async function getFileBuffer(job: { fileContent: Buffer | null; filePath: string | null }): Promise<Buffer> {
  if (job.fileContent && job.fileContent.length > 0) {
    return Buffer.isBuffer(job.fileContent) ? job.fileContent : Buffer.from(job.fileContent);
  }
  if (job.filePath) {
    return readFile(job.filePath);
  }
  throw new Error('Bestand niet gevonden');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { jobId } = await params;

    // Find job
    const job = await db.importExportJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Import taak niet gevonden' }, { status: 404 });
    }

    if (!job.fileContent?.length && !job.filePath) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 });
    }

    const body = await request.json();
    const {
      columnMapping,
      options = {},
    } = body;

    if (!columnMapping || typeof columnMapping !== 'object') {
      return NextResponse.json(
        { error: 'Kolom mapping is verplicht' },
        { status: 400 }
      );
    }

    // Update job status
    await db.importExportJob.update({
      where: { id: jobId },
      data: {
        status: 'VALIDATING',
        columnMapping,
        importOptions: options,
      },
    });

    // Read and parse file (from DB or legacy temp file)
    const fileBuffer = await getFileBuffer(job);
    const { rows } = await parseFile(fileBuffer, job.mimeType!);

    // Validate
    const result = await validateImport(
      session.user.id,
      rows,
      columnMapping,
      job.entityType as EntityType,
      options
    );

    // Update job with validation results
    await db.importExportJob.update({
      where: { id: jobId },
      data: {
        status: result.errors > 0 ? 'PENDING' : 'VALIDATING',
        errors: result.details.filter((d) => d.severity === 'error') as unknown as Prisma.InputJsonValue,
        warnings: result.details.filter((d) => d.severity === 'warning') as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import validate error:', error);
    return NextResponse.json(
      { error: 'Validatie mislukt' },
      { status: 500 }
    );
  }
}
