import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is niet geconfigureerd');
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const instance = getResend();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Facturen <noreply@example.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'info@example.com',
} as const;
