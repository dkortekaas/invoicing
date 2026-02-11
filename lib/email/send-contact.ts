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

// Strip newlines and carriage returns to prevent SMTP header injection
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]/g, ' ').trim();
}

export async function sendContactEmail({
  name,
  email,
  company,
  subject,
  subjectLabel,
  message,
}: SendContactParams) {
  const safeName = sanitizeHeaderValue(name);
  const safeEmail = sanitizeHeaderValue(email);
  const subjectDisplay = sanitizeHeaderValue(subjectLabel || subject);
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: safeEmail,
    to: CONTACT_TO,
    subject: `Contactformulier: ${subjectDisplay} – ${safeName}`,
    react: ContactEmail({ name: safeName, email: safeEmail, company, subject: subjectDisplay, message }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
