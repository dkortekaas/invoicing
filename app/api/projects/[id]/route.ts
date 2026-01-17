import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get single project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        customer: true,
        timeEntries: {
          orderBy: { startTime: 'desc' },
          take: 50,
        },
      },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Project ophalen mislukt' },
      { status: 500 }
    );
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
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
      archived,
    } = body;

    // Check ownership
    const existing = await db.project.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    const project = await db.project.update({
      where: { id },
      data: {
        name,
        description: description !== undefined ? description : undefined,
        code: code !== undefined ? code : undefined,
        color: color !== undefined ? color : undefined,
        customerId: customerId || undefined,
        status: status || undefined,
        budgetHours: budgetHours !== undefined ? (budgetHours ? parseFloat(budgetHours) : null) : undefined,
        budgetAmount: budgetAmount !== undefined ? (budgetAmount ? parseFloat(budgetAmount) : null) : undefined,
        defaultHourlyRate: defaultHourlyRate !== undefined ? (defaultHourlyRate ? parseFloat(defaultHourlyRate) : null) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        archived: archived !== undefined ? archived : undefined,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Project bijwerken mislukt' },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Project verwijderen mislukt' },
      { status: 500 }
    );
  }
}
