import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin, isSuperuser } from '@/lib/auth/admin-guard';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ isAdmin: false, isSuperuser: false });
  }

  const [admin, superuser] = await Promise.all([
    isAdmin(session.user.id),
    isSuperuser(session.user.id),
  ]);
  return NextResponse.json({ isAdmin: admin, isSuperuser: superuser });
}
