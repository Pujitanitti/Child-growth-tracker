const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/**
 * Sends an email. In development without SMTP configured, logs to the
 * console instead of throwing, so the auth flow is testable without a
 * real mail server.
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[email:dev-mode] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@growthtracker.app',
    to,
    subject,
    html,
  });
}

function passwordResetTemplate(name, resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your Child Growth Tracker password. This link expires in 15 minutes.</p>
      <p><a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

module.exports = { sendEmail, passwordResetTemplate };
