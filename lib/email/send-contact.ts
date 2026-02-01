import { resend, EMAIL_CONFIG } from './client';
import ContactEmail from '@/emails/contact-email';

export interface SendContactParams {
  name: string;
  email: string;
  company?: string;
  subject: string;
  subjectLabel?: string;
  message: string;
}

const CONTACT_TO =
  process.env.CONTACT_EMAIL || process.env.EMAIL_REPLY_TO || 'support@declair.app';

export async function sendContactEmail({
  name,
  email,
  company,
  subject,
  subjectLabel,
  message,
}: SendContactParams) {
  const subjectDisplay = subjectLabel || subject;
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: email,
    to: CONTACT_TO,
    subject: `Contactformulier: ${subjectDisplay} – ${name}`,
    react: ContactEmail({ name, email, company, subject: subjectDisplay, message }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
