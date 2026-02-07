import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperuser } from '@/lib/auth/admin-guard';

/**
 * DELETE - Reset 2FA voor een gebruiker (superuser only)
 * Zet twoFactorEnabled op false en wist twoFactorSecret en backupCodes.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSuper = await isSuperuser(session.user.id);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    await db.user.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset 2FA error:', error);
    return NextResponse.json(
      { error: '2FA resetten mislukt' },
      { status: 500 }
    );
  }
}
