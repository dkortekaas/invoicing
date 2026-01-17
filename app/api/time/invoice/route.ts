import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { entryIds, customerId, invoiceDate, dueDate } = body;

    if (!entryIds || entryIds.length === 0) {
      return NextResponse.json(
        { error: 'Selecteer minimaal 1 entry' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Klant is verplicht' },
        { status: 400 }
      );
    }

    // Haal entries op
    const entries = await db.timeEntry.findMany({
      where: {
        id: { in: entryIds },
        userId: session.user.id,
        billable: true,
        invoiced: false,
      },
      include: {
        project: true,
        customer: true,
      },
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'Geen factureerbare entries gevonden' },
        { status: 400 }
      );
    }

    // Check of alle entries dezelfde klant hebben
    const uniqueCustomers = new Set(entries.map(e => e.customerId).filter(Boolean));
    if (uniqueCustomers.size > 1) {
      return NextResponse.json(
        { error: 'Alle entries moeten van dezelfde klant zijn' },
        { status: 400 }
      );
    }

    // Genereer invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await db.invoice.findFirst({
      where: {
        userId: session.user.id,
        invoiceNumber: {
          startsWith: `${year}-`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length > 1 && parts[1]) {
        const lastSequence = parseInt(parts[1]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    const invoiceNumber = `${year}-${sequence.toString().padStart(4, '0')}`;

    // Groepeer entries per project/beschrijving
    const groupedItems = new Map<string, {
      description: string;
      duration: number;
      hourlyRate: number;
      amount: number;
      entries: string[];
    }>();

    entries.forEach(entry => {
      const key = entry.project 
        ? `${entry.project.name} - ${entry.description}`
        : entry.description;

      const existing = groupedItems.get(key);
      if (existing) {
        existing.duration += Number(entry.duration);
        existing.amount += Number(entry.amount);
        existing.entries.push(entry.id);
      } else {
        groupedItems.set(key, {
          description: key,
          duration: Number(entry.duration),
          hourlyRate: Number(entry.hourlyRate),
          amount: Number(entry.amount),
          entries: [entry.id],
        });
      }
    });

    // Bereken totalen
    const subtotal = Array.from(groupedItems.values())
      .reduce((sum, item) => sum + item.amount, 0);
    // Check if user can create invoice
    const { canCreateInvoice, incrementInvoiceCount } = await import('@/lib/stripe/subscriptions');
    const canCreate = await canCreateInvoice(session.user.id);

    if (!canCreate.allowed) {
      return NextResponse.json(
        { 
          error: canCreate.reason || 'Je hebt je maandelijkse limiet bereikt',
          current: canCreate.current,
          limit: canCreate.limit,
          upgrade: true,
        },
        { status: 403 }
      );
    }

    const vatAmount = subtotal * 0.21; // 21% BTW
    const total = subtotal + vatAmount;

    // Create invoice met items
    const invoice = await db.invoice.create({
      data: {
        userId: session.user.id,
        customerId,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        subtotal,
        vatAmount,
        total,
        items: {
          create: Array.from(groupedItems.values()).map((item, index) => ({
            description: item.description,
            quantity: item.duration,
            unitPrice: item.hourlyRate,
            vatRate: 21,
            subtotal: item.amount,
            vatAmount: item.amount * 0.21,
            total: item.amount * 1.21,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    // Increment counter for free users
    await incrementInvoiceCount(session.user.id);

    // Mark time entries as invoiced
    await db.timeEntry.updateMany({
      where: {
        id: { in: entryIds },
      },
      data: {
        invoiced: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Convert to invoice error:', error);
    return NextResponse.json(
      { error: 'Factuur aanmaken mislukt' },
      { status: 500 }
    );
  }
}
