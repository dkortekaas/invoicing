import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperuser } from '@/lib/auth/admin-guard';
import { logUpdate } from '@/lib/audit/helpers';

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const { role } = body;

    if (!['USER', 'ADMIN', 'SUPERUSER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Prevent users from changing their own role
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Fetch the current role before updating so we can log the change
    const existingUser = await db.user.findUnique({
      where: { id },
      select: { role: true },
    });

    const user = await db.user.update({
      where: { id },
      data: { role },
    });

    // Audit log: record who changed whose role and from/to what value
    await logUpdate('user', id, { role: existingUser?.role }, { role }, session.user.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
