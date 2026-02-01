import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperuser } from '@/lib/auth/admin-guard';

/**
 * GET - List all discount codes (superuser only)
 */
export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isSuper = await isSuperuser(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const discountCodes = await db.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    return NextResponse.json(discountCodes);
  } catch (error) {
    console.error('Get discount codes error:', error);
    return NextResponse.json(
      { error: 'Ophalen kortingscodes mislukt' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new discount code (superuser only)
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isSuper = await isSuperuser(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      minTier = 'STARTER',
      validFrom,
      validUntil,
      campaign,
      source,
    } = body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Code, type en waarde zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Ongeldig kortingstype' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountType === 'PERCENTAGE' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage moet tussen 1 en 100 zijn' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await db.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Kortingscode bestaat al' },
        { status: 400 }
      );
    }

    // Create discount code
    const discountCode = await db.discountCode.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseInt(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : null,
        minTier,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        campaign,
        source,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Create discount code error:', error);
    return NextResponse.json(
      { error: 'Kortingscode aanmaken mislukt' },
      { status: 500 }
    );
  }
}
