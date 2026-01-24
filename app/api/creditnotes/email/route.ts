import { NextRequest, NextResponse } from 'next/server';
import { sendCreditNoteEmail } from '@/lib/email/send-credit-note';
import { getCurrentUserId } from '@/lib/server-utils';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    const body = await request.json();
    const { creditNoteId } = body;

    if (!creditNoteId) {
      return NextResponse.json(
        { error: 'Credit nota ID is vereist' },
        { status: 400 }
      );
    }

    // Verify credit note belongs to user
    const creditNote = await db.creditNote.findFirst({
      where: { id: creditNoteId, userId },
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Credit nota niet gevonden' },
        { status: 404 }
      );
    }

    // Only allow sending if status is FINAL or already SENT
    if (creditNote.status !== 'FINAL' && creditNote.status !== 'SENT') {
      return NextResponse.json(
        { error: 'Credit nota moet eerst definitief zijn voordat deze kan worden verzonden' },
        { status: 400 }
      );
    }

    const result = await sendCreditNoteEmail({ creditNoteId });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Credit note email send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email verzenden mislukt' },
      { status: 500 }
    );
  }
}
