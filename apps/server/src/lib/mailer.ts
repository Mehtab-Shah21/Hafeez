import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from './logger.js';

/**
 * MAIL_DRIVER=smtp (SMTP_* vars) or resend (RESEND_API_KEY). With nothing configured, messages are
 * logged instead of sent, so local development never fails on email.
 */
let transporter: Transporter | null = null;

function smtp(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
  });
}

async function sendResend(to: string[], subject: string, text: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text, html }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
}

export async function sendMail(to: string[], subject: string, text: string, html: string): Promise<void> {
  try {
    if (process.env.MAIL_DRIVER === 'resend' && process.env.RESEND_API_KEY) {
      await sendResend(to, subject, text, html);
      return;
    }
    transporter ??= smtp();
    if (!transporter) {
      logger.info({ to, subject }, 'Email not sent (no MAIL transport configured)');
      return;
    }
    await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
  } catch (err) {
    // A mail failure must never lose the inquiry: it is already saved; log and move on.
    logger.error({ err, subject }, 'Email send failed');
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function inquiryEmail(i: Record<string, unknown>, adminUrl: string) {
  const rows = Object.entries(i).filter(([, v]) => v !== '' && v != null && typeof v !== 'object');
  const booking = typeof i.payload === 'object' && i.payload ? Object.entries(i.payload as Record<string, unknown>) : [];
  const all = [...rows, ...booking];
  const text = all.map(([k, v]) => `${k}: ${String(v)}`).join('\n') + `\n\nOpen in admin: ${adminUrl}`;
  const html = `<table cellpadding="6">${all.map(([k, v]) => `<tr><th align="left">${esc(k)}</th><td>${esc(String(v))}</td></tr>`).join('')}</table><p><a href="${esc(adminUrl)}">Open in admin</a></p>`;
  return { text, html };
}
