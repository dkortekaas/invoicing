import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isInvitationExpired } from '@/lib/invitations/utils';

/**
 * GET - Validate an invitation token
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        sender: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, error: 'Uitnodiging niet gevonden' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({
        valid: false,
        error: invitation.status === 'ACCEPTED' 
          ? 'Uitnodiging is al gebruikt' 
          : 'Uitnodiging is geannuleerd',
      });
    }

    if (isInvitationExpired(invitation.expiresAt)) {
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({
        valid: false,
        error: 'Uitnodiging is verlopen',
      });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json({
        valid: false,
        error: 'Gebruiker met dit e-mailadres bestaat al',
      });
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      sender: invitation.sender,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validatie mislukt' },
      { status: 500 }
    );
  }
}
