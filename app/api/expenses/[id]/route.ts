import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateNetFromGross, calculateVATFromGross } from '@/lib/vat/calculations';
import { Prisma } from '@prisma/client';

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
    const expense = await db.expense.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        customer: true,
        project: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json(
      { error: 'Failed to get expense' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      date,
      description,
      category,
      amount,
      vatRate,
      supplier,
      invoiceNumber,
      deductible,
      deductiblePerc,
      receipt,
      customerId,
      projectId,
      notes,
      tags,
    } = body;

    // Check if expense exists and belongs to user
    const existing = await db.expense.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Recalculate amounts if amount or vatRate changed
    const updateData: Prisma.ExpenseUpdateInput = {};
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (deductible !== undefined) updateData.deductible = deductible;
    if (deductiblePerc !== undefined) updateData.deductiblePerc = deductiblePerc;
    if (receipt !== undefined) updateData.receipt = receipt;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;

    if (amount !== undefined || vatRate !== undefined) {
      const finalAmount = amount !== undefined ? amount : Number(existing.amount);
      const finalVatRate = vatRate !== undefined ? vatRate : Number(existing.vatRate);
      
      updateData.amount = finalAmount;
      updateData.vatRate = finalVatRate;
      updateData.netAmount = calculateNetFromGross(finalAmount, finalVatRate);
      updateData.vatAmount = calculateVATFromGross(finalAmount, finalVatRate);
    }

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        project: true,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

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
    const expense = await db.expense.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    await db.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
