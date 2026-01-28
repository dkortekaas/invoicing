import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseFile, executeImport } from '@/lib/import-export/import-service';
import type { EntityType } from '@/lib/import-export/fields';

export async function POST(
  _request: NextRequest,
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

    if (!job.filePath) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 });
    }

    if (!job.columnMapping) {
      return NextResponse.json(
        { error: 'Valideer eerst de import' },
        { status: 400 }
      );
    }

    // Update job status
    await db.importExportJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Read and parse file
    const fileBuffer = await readFile(job.filePath);
    const { rows } = await parseFile(fileBuffer, job.mimeType!);

    // Execute import
    const result = await executeImport(
      session.user.id,
      rows,
      job.columnMapping as Record<string, string>,
      job.entityType as EntityType,
      (job.importOptions as Record<string, unknown>) || {}
    );

    // Update job with results
    await db.importExportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedRows: rows.length,
        successRows: result.success,
        errorRows: result.errors,
        skippedRows: result.skipped,
      },
    });

    // Clean up temp file
    try {
      await unlink(job.filePath);
    } catch {
      console.warn('Could not delete temp file:', job.filePath);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import execute error:', error);

    // Update job status to failed
    const { jobId } = await params;
    await db.importExportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: 'Import mislukt' },
      { status: 500 }
    );
  }
}
