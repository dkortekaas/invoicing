import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const recurring = await db.recurringInvoice.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await db.recurringInvoiceLog.create({
      data: {
        recurringInvoiceId: recurring.id,
        action: 'CANCELLED',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Cancel recurring invoice error:', error);
    return NextResponse.json(
      { error: 'Annuleren mislukt' },
      { status: 500 }
    );
  }
}
