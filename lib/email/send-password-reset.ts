import { resend, EMAIL_CONFIG } from './client';
import PasswordResetEmail from '@/emails/password-reset-email';

const PASSWORD_RESET_EXPIRY_MINUTES = 60;

interface SendPasswordResetEmailParams {
  email: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: SendPasswordResetEmailParams) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: email,
    subject: 'Wachtwoord herstellen - Declair',
    react: PasswordResetEmail({
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    }),
  });

  if (error) {
    throw new Error(`E-mail verzenden mislukt: ${error.message}`);
  }

  return { success: true, emailId: data?.id };
}
