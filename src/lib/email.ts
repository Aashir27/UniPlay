/**
 * src/lib/email.ts
 *
 * Thin wrapper around Nodemailer. Works with any SMTP provider
 * (AWS SES, SendGrid SMTP relay, Mailgun, Brevo SMTP, or local MailHog).
 *
 * Required env vars:
 *   SMTP_HOST        e.g. "smtp-relay.brevo.com"
 *   SMTP_PORT        e.g. "587"
 *   SMTP_USER        SMTP username / provider login
 *   SMTP_PASS        SMTP password / SMTP key
 *   SMTP_FROM        e.g. "UniPlay <no-reply@uniplay.app>"
 */

import nodemailer, { type Transporter } from "nodemailer";

type GlobalWithTransporter = typeof globalThis & {
  __mailer?: Transporter;
};

const g = globalThis as GlobalWithTransporter;

function createTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP config. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/** Singleton transporter (re-used across hot-reloads in dev). */
function getTransporter(): Transporter {
  if (!g.__mailer) {
    g.__mailer = createTransporter();
  }
  return g.__mailer;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const from =
    process.env.SMTP_FROM ??
    process.env.EMAIL_FROM ??
    "UniPlay <no-reply@uniplay.app>";
  await getTransporter().sendMail({ from, ...opts });
}

/** Convenience: send a 6-digit OTP verification email. */
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<void> {
  await sendMail({
    to: opts.to,
    subject: "Verify your UniPlay account",
    text: `Hi ${opts.name},\n\nYour verification code is: ${opts.otp}\n\nIt expires in 15 minutes.\n\nIf you did not register, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#059669">Welcome to UniPlay, ${opts.name}!</h2>
        <p>Enter the code below to verify your email address. It expires in <strong>15 minutes</strong>.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:.3em;padding:1rem;background:#f4f4f5;border-radius:8px;text-align:center">
          ${opts.otp}
        </div>
        <p style="color:#71717a;font-size:.85rem;margin-top:1.5rem">
          If you did not create a UniPlay account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
