import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
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
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        successRows: true,
        errorRows: true,
        skippedRows: true,
        errors: true,
        warnings: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Import taak niet gevonden' }, { status: 404 });
    }

    // Calculate progress
    const progress = job.totalRows && job.processedRows
      ? Math.round((job.processedRows / job.totalRows) * 100)
      : 0;

    return NextResponse.json({
      status: job.status,
      progress,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successRows: job.successRows,
      errorRows: job.errorRows,
      skippedRows: job.skippedRows,
      errors: job.errors,
      warnings: job.warnings,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('Import status error:', error);
    return NextResponse.json(
      { error: 'Status ophalen mislukt' },
      { status: 500 }
    );
  }
}
