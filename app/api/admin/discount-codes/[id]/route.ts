import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperuser } from '@/lib/auth/admin-guard';

/**
 * GET - Get a single discount code with usage stats
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isSuper = await isSuperuser(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const discountCode = await db.discountCode.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        usages: {
          orderBy: { appliedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: 'Kortingscode niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Get discount code error:', error);
    return NextResponse.json(
      { error: 'Ophalen kortingscode mislukt' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a discount code
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isSuper = await isSuperuser(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      description,
      discountValue,
      maxUses,
      validUntil,
      isActive,
      campaign,
      source,
    } = body;

    // Check if discount code exists
    const existing = await db.discountCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kortingscode niet gevonden' },
        { status: 404 }
      );
    }

    // Update discount code
    const discountCode = await db.discountCode.update({
      where: { id },
      data: {
        description,
        discountValue: discountValue !== undefined ? parseInt(discountValue) : undefined,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        campaign,
        source,
      },
    });

    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Update discount code error:', error);
    return NextResponse.json(
      { error: 'Bijwerken kortingscode mislukt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a discount code
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isSuper = await isSuperuser(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if discount code exists
    const existing = await db.discountCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Kortingscode niet gevonden' },
        { status: 404 }
      );
    }

    // If code has been used, just deactivate it instead of deleting
    if (existing._count.usages > 0) {
      await db.discountCode.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, deactivated: true });
    }

    // Delete discount code if never used
    await db.discountCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete discount code error:', error);
    return NextResponse.json(
      { error: 'Verwijderen kortingscode mislukt' },
      { status: 500 }
    );
  }
}
