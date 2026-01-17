import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateAmount } from '@/lib/time/calculations';

// GET - List time entries met filters
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const customerId = searchParams.get('customerId');
  const billable = searchParams.get('billable');
  const invoiced = searchParams.get('invoiced');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const where: any = {
      userId: session.user.id,
    };

    if (projectId) where.projectId = projectId;
    if (customerId) where.customerId = customerId;
    if (billable !== null) where.billable = billable === 'true';
    if (invoiced !== null) where.invoiced = invoiced === 'true';
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const entries = await db.timeEntry.findMany({
      where,
      include: {
        project: true,
        customer: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Get entries error:', error);
    return NextResponse.json(
      { error: 'Entries ophalen mislukt' },
      { status: 500 }
    );
  }
}

// POST - Create manual entry
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      description,
      startTime,
      endTime,
      duration,
      projectId,
      customerId,
      activityType,
      billable,
      hourlyRate,
      notes,
    } = body;

    if (!description || !startTime) {
      return NextResponse.json(
        { error: 'Beschrijving en starttijd zijn verplicht' },
        { status: 400 }
      );
    }

    // Bereken duration als niet gegeven
    let finalDuration = duration;
    if (!finalDuration && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      finalDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    if (!finalDuration || finalDuration <= 0) {
      return NextResponse.json(
        { error: 'Ongeldige duur' },
        { status: 400 }
      );
    }

    // Bepaal hourly rate
    let rate = hourlyRate;
    if (!rate && projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
      });
      rate = project?.defaultHourlyRate;
    }
    if (!rate) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });
      rate = user?.defaultHourlyRate || 0;
    }

    const amount = calculateAmount(finalDuration, Number(rate));

    const entry = await db.timeEntry.create({
      data: {
        userId: session.user.id,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration: finalDuration,
        projectId: projectId || null,
        customerId: customerId || null,
        activityType: activityType || null,
        billable: billable ?? true,
        hourlyRate: rate,
        amount,
        notes: notes || null,
        isRunning: false,
      },
      include: {
        project: true,
        customer: true,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Create entry error:', error);
    return NextResponse.json(
      { error: 'Entry aanmaken mislukt' },
      { status: 500 }
    );
  }
}

// PUT - Update entry
export async function PUT(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      description,
      startTime,
      endTime,
      duration,
      projectId,
      customerId,
      activityType,
      billable,
      hourlyRate,
      notes,
    } = body;

    // Check ownership
    const existing = await db.timeEntry.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Entry niet gevonden' },
        { status: 404 }
      );
    }

    if (existing.invoiced) {
      return NextResponse.json(
        { error: 'Gefactureerde entries kunnen niet worden aangepast' },
        { status: 400 }
      );
    }

    // Bereken duration als niet gegeven
    let finalDuration = duration;
    if (!finalDuration && startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      finalDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    if (!finalDuration || finalDuration <= 0) {
      return NextResponse.json(
        { error: 'Ongeldige duur' },
        { status: 400 }
      );
    }

    // Bepaal hourly rate
    let rate = hourlyRate;
    if (!rate && projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
      });
      rate = project?.defaultHourlyRate;
    }
    if (!rate) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });
      rate = user?.defaultHourlyRate || 0;
    }

    const amount = calculateAmount(finalDuration, Number(rate));

    const updated = await db.timeEntry.update({
      where: { id },
      data: {
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : null,
        duration: finalDuration,
        projectId: projectId || null,
        customerId: customerId || null,
        activityType: activityType || null,
        billable: billable ?? true,
        hourlyRate: rate,
        amount,
        notes: notes || null,
      },
      include: {
        project: true,
        customer: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update entry error:', error);
    return NextResponse.json(
      { error: 'Entry bijwerken mislukt' },
      { status: 500 }
    );
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'ID is verplicht' },
      { status: 400 }
    );
  }

  try {
    const entry = await db.timeEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Entry niet gevonden' },
        { status: 404 }
      );
    }

    if (entry.invoiced) {
      return NextResponse.json(
        { error: 'Gefactureerde entries kunnen niet worden verwijderd' },
        { status: 400 }
      );
    }

    await db.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete entry error:', error);
    return NextResponse.json(
      { error: 'Entry verwijderen mislukt' },
      { status: 500 }
    );
  }
}
