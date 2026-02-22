import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseFile, executeImport } from '@/lib/import-export/import-service';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import type { EntityType } from '@/lib/import-export/fields';

async function getFileBuffer(job: {
  fileContent: Buffer | Uint8Array | null;
  filePath: string | null;
}): Promise<Buffer> {
  if (job.fileContent && job.fileContent.length > 0) {
    return Buffer.isBuffer(job.fileContent) ? job.fileContent : Buffer.from(job.fileContent);
  }
  if (job.filePath) {
    return readFile(job.filePath);
  }
  throw new Error('Bestand niet gevonden');
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    // Read and parse file (from DB or legacy temp file)
    const fileBuffer = await getFileBuffer(job);
    const { rows } = await parseFile(fileBuffer, job.mimeType!);

    // Execute import
    const result = await executeImport(
      session.user.id,
      rows,
      job.columnMapping as Record<string, string>,
      job.entityType as EntityType,
      (job.importOptions as Record<string, unknown>) || {}
    );

    // Update job with results and clear file content (no longer needed)
    await db.importExportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedRows: rows.length,
        successRows: result.success,
        errorRows: result.errors,
        skippedRows: result.skipped,
        fileContent: null, // Free storage after successful import
      },
    });

    // Clean up legacy temp file (only when stored on disk)
    if (job.filePath) {
      try {
        await unlink(job.filePath);
      } catch {
        console.warn('Could not delete temp file:', job.filePath);
      }
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
