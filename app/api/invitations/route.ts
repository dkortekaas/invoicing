import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateInvitationToken, getDefaultExpiration } from '@/lib/invitations/utils';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';

/**
 * GET - List all invitations for the current user (as sender)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user has PRO subscription
    const hasProAccess = await hasFeatureAccess(session.user.id, 'unlimited_invoices');
    
    if (!hasProAccess) {
      return NextResponse.json(
        { error: 'Alleen PRO accounts kunnen gebruikers uitnodigen' },
        { status: 403 }
      );
    }

    const invitations = await db.invitation.findMany({
      where: { senderId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: 'Ophalen uitnodigingen mislukt' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new invitation
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user has PRO subscription
    const hasProAccess = await hasFeatureAccess(session.user.id, 'unlimited_invoices');
    
    if (!hasProAccess) {
      return NextResponse.json(
        { error: 'Alleen PRO accounts kunnen gebruikers uitnodigen' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = 'USER' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Ongeldig e-mailadres' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Gebruiker met dit e-mailadres bestaat al' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Er is al een actieve uitnodiging voor dit e-mailadres' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await db.invitation.create({
      data: {
        senderId: session.user.id,
        email,
        token: generateInvitationToken(),
        role: role as 'USER' | 'ADMIN',
        expiresAt: getDefaultExpiration(),
      },
    });

    // TODO: Send invitation email
    // await sendInvitationEmail(invitation);

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Uitnodiging aanmaken mislukt' },
      { status: 500 }
    );
  }
}
