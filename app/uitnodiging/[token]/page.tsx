import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isInvitationExpired } from '@/lib/invitations/utils';
import { InvitationAcceptForm } from '@/components/admin/invitation-accept-form';

interface InvitationPageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      sender: {
        select: {
          name: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  if (!invitation) {
    redirect('/login?error=invitation_not_found');
  }

  if (invitation.status !== 'PENDING') {
    redirect('/login?error=invitation_used');
  }

  if (isInvitationExpired(invitation.expiresAt)) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    redirect('/login?error=invitation_expired');
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    redirect('/login?error=user_exists');
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <InvitationAcceptForm
          invitation={{
            token: invitation.token,
            email: invitation.email,
            role: invitation.role === 'SUPERUSER' ? 'ADMIN' : invitation.role,
            sender: invitation.sender,
          }}
        />
      </div>
    </div>
  );
}
