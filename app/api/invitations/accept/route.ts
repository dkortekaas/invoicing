import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isInvitationExpired } from '@/lib/invitations/utils';
import { hashPassword } from '@/lib/auth-utils';
import { addMonths } from 'date-fns';

/**
 * POST - Accept an invitation and create user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Uitnodigingstoken is verplicht' },
        { status: 400 }
      );
    }

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Naam en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const invitation = await db.invitation.findUnique({
      where: { token },
      include: { sender: { include: { company: true } } },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Uitnodiging niet gevonden' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Uitnodiging is al gebruikt of geannuleerd' },
        { status: 400 }
      );
    }

    if (isInvitationExpired(invitation.expiresAt)) {
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'Uitnodiging is verlopen' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Gebruiker met dit e-mailadres bestaat al' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Determine subscription settings
    // If invitation has a subscription tier, set it up as manual subscription
    const hasManualSubscription = !!invitation.subscriptionTier;
    let manualSubscriptionExpiresAt: Date | null = null;

    if (hasManualSubscription && invitation.subscriptionDuration) {
      // Duration is in months, calculate expiration date
      manualSubscriptionExpiresAt = addMonths(new Date(), invitation.subscriptionDuration);
    }
    // If duration is null/0, subscription is unlimited (no expiration)

    // Create user account with subscription tier if provided
    const user = await db.user.create({
      data: {
        email: invitation.email,
        name,
        passwordHash,
        role: invitation.role,
        subscriptionTier: invitation.subscriptionTier || 'FREE',
        subscriptionStatus: hasManualSubscription ? 'ACTIVE' : 'FREE',
        isManualSubscription: hasManualSubscription,
        manualSubscriptionExpiresAt,
        manualSubscriptionNote: hasManualSubscription
          ? `Toegewezen via uitnodiging door admin`
          : null,
      },
    });

    const senderCompany = invitation.sender.company
    if (senderCompany?.name?.trim() && senderCompany?.email?.trim() && senderCompany?.address?.trim() && senderCompany?.city?.trim() && senderCompany?.postalCode?.trim()) {
      await db.company.create({
        data: {
          userId: user.id,
          name: senderCompany.name,
          email: senderCompany.email,
          phone: senderCompany.phone,
          address: senderCompany.address,
          city: senderCompany.city,
          postalCode: senderCompany.postalCode,
          country: senderCompany.country ?? 'Nederland',
          logo: senderCompany.logo,
        },
      })
    }

    // Update invitation
    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        receiverId: user.id,
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Uitnodiging accepteren mislukt' },
      { status: 500 }
    );
  }
}
