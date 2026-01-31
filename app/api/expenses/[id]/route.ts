import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateNetFromGross, calculateVATFromGross } from '@/lib/vat/calculations';
import { Prisma, ExpenseCategory } from '@prisma/client';
import { recordCorrection } from '@/lib/categorization';

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

    // Check if user has KOR enabled - if so, VAT is never deductible
    const fiscalSettings = await db.fiscalSettings.findUnique({
      where: { userId: session.user.id },
      select: { useKOR: true },
    });
    const useKOR = fiscalSettings?.useKOR ?? false;

    // Recalculate amounts if amount or vatRate changed
    const updateData: Prisma.ExpenseUpdateInput = {};
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (deductible !== undefined) updateData.deductible = useKOR ? false : deductible;
    if (deductiblePerc !== undefined) updateData.deductiblePerc = useKOR ? 0 : deductiblePerc;
    if (receipt !== undefined) updateData.receipt = receipt;
    if (customerId !== undefined) {
      updateData.customer = customerId 
        ? { connect: { id: customerId } }
        : { disconnect: true };
    }
    if (projectId !== undefined) {
      updateData.project = projectId
        ? { connect: { id: projectId } }
        : { disconnect: true };
    }
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

    // Track category corrections for learning
    const categoryChanged = category && category !== existing.category;
    const wasAutoCategorized = existing.wasAutoCategorized;
    const hadPrediction = existing.predictedCategory !== null;

    if (categoryChanged) {
      updateData.wasCorrected = true;
    }

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        project: true,
        vendor: true,
      },
    });

    // Record correction for learning if category was changed on an auto-categorized expense
    if (categoryChanged && (wasAutoCategorized || hadPrediction)) {
      const predictedCategory = existing.predictedCategory || existing.category;
      await recordCorrection({
        userId: session.user.id,
        expenseId: id,
        predictedCategory: predictedCategory as ExpenseCategory,
        actualCategory: category as ExpenseCategory,
        supplierName: existing.supplier || undefined,
        vendorId: existing.vendorId || undefined,
      });
    }

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
