import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateNextDate } from '@/lib/recurring/calculations';

// GET - Get single recurring invoice
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const recurring = await db.recurringInvoice.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10,
        },
        priceChanges: {
          orderBy: { effectiveDate: 'desc' },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: 'Recurring invoice niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Get recurring invoice error:', error);
    return NextResponse.json(
      { error: 'Ophalen mislukt' },
      { status: 500 }
    );
  }
}

// PUT - Update recurring invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      name,
      description,
      customerId,
      frequency,
      interval,
      startDate,
      endDate,
      dayOfMonth,
      autoSend,
      sendDays,
      reference,
      items,
      notes,
    } = body;

    // Check if recurring invoice exists and belongs to user
    const existing = await db.recurringInvoice.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring invoice niet gevonden' },
        { status: 404 }
      );
    }

    // Calculate nextDate if schedule changed
    let nextDate = existing.nextDate;
    if (frequency || interval || dayOfMonth !== undefined) {
      const baseDate = startDate ? new Date(startDate) : existing.startDate;
      nextDate = calculateNextDate(
        baseDate,
        frequency || existing.frequency,
        interval ?? existing.interval,
        dayOfMonth ?? existing.dayOfMonth
      );
    }

    // Update recurring invoice
    const recurring = await db.recurringInvoice.update({
      where: { id },
      data: {
        name,
        description,
        customerId,
        frequency,
        interval,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        dayOfMonth,
        autoSend,
        sendDays,
        reference,
        notes,
        nextDate,
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map((item: { description: string; quantity: number; unitPrice: number; vatRate: number }, index: number) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              sortOrder: index,
            })),
          },
        }),
      },
      include: {
        items: true,
        customer: true,
      },
    });

    // Log update
    await db.recurringInvoiceLog.create({
      data: {
        recurringInvoiceId: recurring.id,
        action: 'SCHEDULE_UPDATED',
        createdBy: session.user.id,
        details: 'Recurring invoice bijgewerkt',
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Update recurring invoice error:', error);
    return NextResponse.json(
      { error: 'Bijwerken mislukt' },
      { status: 500 }
    );
  }
}

// DELETE - Delete recurring invoice
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const recurring = await db.recurringInvoice.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: 'Recurring invoice niet gevonden' },
        { status: 404 }
      );
    }

    await db.recurringInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recurring invoice error:', error);
    return NextResponse.json(
      { error: 'Verwijderen mislukt' },
      { status: 500 }
    );
  }
}
