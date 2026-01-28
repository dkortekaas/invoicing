import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateNetFromGross, calculateVATFromGross } from '@/lib/vat/calculations';
import { ensureCompanyDetails } from '@/lib/company-guard';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const category = searchParams.get('category');

  try {
    const where: Prisma.ExpenseWhereInput = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) where.category = category;

    const expenses = await db.expense.findMany({
      where,
      include: {
        customer: true,
        project: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Failed to get expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      date,
      description,
      category,
      amount, // Gross amount (incl VAT)
      vatRate,
      supplier,
      invoiceNumber,
      deductible = true,
      deductiblePerc = 100,
      receipt,
      customerId,
      projectId,
      notes,
      tags,
    } = body;

    if (!date || !description || !category || amount === undefined || vatRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate net amount and VAT
    const netAmount = calculateNetFromGross(amount, vatRate);
    const vatAmount = calculateVATFromGross(amount, vatRate);

    const expense = await db.expense.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        description,
        category,
        amount,
        vatAmount,
        vatRate,
        netAmount,
        supplier,
        invoiceNumber,
        deductible,
        deductiblePerc,
        receipt,
        customerId,
        projectId,
        notes,
        tags: tags || [],
      },
      include: {
        customer: true,
        project: true,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
