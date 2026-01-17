import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ isAdmin: false });
  }

  const admin = await isAdmin(session.user.id);
  return NextResponse.json({ isAdmin: admin });
}
