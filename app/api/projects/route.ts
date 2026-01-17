import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - List projects
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const customerId = searchParams.get('customerId');
  const status = searchParams.get('status');
  const archived = searchParams.get('archived');

  try {
    const where: any = {
      userId: session.user.id,
    };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (archived !== null) where.archived = archived === 'true';

    const projects = await db.project.findMany({
      where,
      include: {
        customer: true,
        _count: {
          select: { timeEntries: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Projecten ophalen mislukt' },
      { status: 500 }
    );
  }
}

// POST - Create project
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      code,
      color,
      customerId,
      status,
      budgetHours,
      budgetAmount,
      defaultHourlyRate,
      startDate,
      endDate,
    } = body;

    if (!name || !customerId) {
      return NextResponse.json(
        { error: 'Naam en klant zijn verplicht' },
        { status: 400 }
      );
    }

    // Check if customer belongs to user
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Klant niet gevonden' },
        { status: 404 }
      );
    }

    const project = await db.project.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        code: code || null,
        color: color || null,
        customerId,
        status: status || 'ACTIVE',
        budgetHours: budgetHours ? parseFloat(budgetHours) : null,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
        defaultHourlyRate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        archived: false,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Project aanmaken mislukt' },
      { status: 500 }
    );
  }
}
