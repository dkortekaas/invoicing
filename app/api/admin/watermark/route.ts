import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperuser } from '@/lib/auth/admin-guard';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSuper = await isSuperuser(session.user.id);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const settings = await db.systemSettings.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get watermark settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSuper = await isSuperuser(session.user.id);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      watermarkEnabled,
      watermarkText,
      watermarkOpacity,
      watermarkRotation,
      watermarkFontSize,
      watermarkColor,
      watermarkPosition,
      freeUserWatermarkEnabled,
    } = body;

    const settings = await db.systemSettings.update({
      where: { id: 'default' },
      data: {
        watermarkEnabled,
        watermarkText,
        watermarkOpacity,
        watermarkRotation,
        watermarkFontSize,
        watermarkColor,
        watermarkPosition,
        freeUserWatermarkEnabled,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update watermark settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
