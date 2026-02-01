import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations';
import { sendContactEmail } from '@/lib/email/send-contact';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? 'Controleer de ingevulde gegevens.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, company, subject, subjectLabel, message } = parsed.data;
    await sendContactEmail({
      name,
      email,
      company: company || undefined,
      subject,
      subjectLabel: subjectLabel || undefined,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Versturen mislukt. Probeer het later opnieuw.',
      },
      { status: 500 }
    );
  }
}
