import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateNextDate } from '@/lib/recurring/calculations';
import { ensureCompanyDetails } from '@/lib/company-guard';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import { Prisma, RecurringStatus } from '@prisma/client';

// GET - List recurring invoices
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Recurring invoices is a premium feature
  const hasAccess = await hasFeatureAccess(session.user.id, 'recurring_invoices');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Automatische facturen is een premium functie. Upgrade je abonnement.' },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');

  try {
    const where: Prisma.RecurringInvoiceWhereInput = {
      userId: session.user.id,
    };

    if (status) {
      // Validate that status is a valid RecurringStatus enum value
      if (Object.values(RecurringStatus).includes(status as RecurringStatus)) {
        where.status = status as RecurringStatus;
      }
    }
    if (customerId) where.customerId = customerId;

    const recurring = await db.recurringInvoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: {
        nextDate: 'asc',
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Get recurring invoices error:', error);
    return NextResponse.json(
      { error: 'Ophalen mislukt' },
      { status: 500 }
    );
  }
}

// POST - Create recurring invoice
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = await hasFeatureAccess(session.user.id, 'recurring_invoices');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Automatische facturen is een premium functie. Upgrade je abonnement.' },
      { status: 403 }
    );
  }

  if (!(await ensureCompanyDetails(session.user.id))) {
    return NextResponse.json(
      { error: 'Vul eerst je bedrijfsgegevens in via Instellingen > Bedrijfsgegevens.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      customerId,
      frequency,
      interval = 1,
      startDate,
      endDate,
      dayOfMonth,
      autoSend = false,
      sendDays = 0,
      reference,
      items,
      notes,
      currencyCode = 'EUR',
    } = body;

    if (!name || !customerId || !frequency || !startDate || !items?.length) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    // Bereken eerste nextDate
    const start = new Date(startDate);
    const nextDate = calculateNextDate(start, frequency, interval, dayOfMonth);

    const recurring = await db.recurringInvoice.create({
      data: {
        userId: session.user.id,
        name,
        description,
        customerId,
        frequency,
        interval,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDate,
        dayOfMonth,
        autoSend,
        sendDays,
        reference,
        notes,
        currencyCode,
        status: 'ACTIVE',
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number; vatRate: number }, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    // Log creation
    await db.recurringInvoiceLog.create({
      data: {
        recurringInvoiceId: recurring.id,
        action: 'CREATED',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Create recurring invoice error:', error);
    return NextResponse.json(
      { error: 'Aanmaken mislukt' },
      { status: 500 }
    );
  }
}
