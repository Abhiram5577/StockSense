import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer transporter configured for Gmail SMTP
 * Uses Google App Passwords through environment variables.
 */
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });
}

/**
 * Sends password reset OTP to user's email address
 * @param {string} toEmail - Recipient email
 * @param {string} recipientName - User's name
 * @param {string} otp - Plain 6-digit OTP to send
 * @returns {Promise<boolean>}
 */
export async function sendOtpEmail(toEmail, recipientName, otp) {
  const transporter = createTransporter();

  const subject = 'StockSense Password Reset OTP';
  const textContent = `Hello ${recipientName || 'User'},

Your StockSense password reset OTP is:

${otp}

This OTP expires in 10 minutes.

If you did not request a password reset, please ignore this email.

Regards,
StockSense Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; background-color: #14b8a6; color: #042f2e; font-weight: bold; font-size: 16px; padding: 6px 12px; border-radius: 6px;">S</span>
        <span style="font-size: 18px; font-weight: 600; margin-left: 8px; vertical-align: middle;">StockSense</span>
      </div>
      <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0;">Password Reset OTP</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Hello <strong>${recipientName || 'User'}</strong>,</p>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">You requested a password reset for your StockSense account. Use the one-time passcode below to proceed:</p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 32px; letter-spacing: 6px; font-weight: bold; background-color: #1e293b; color: #2dd4bf; padding: 12px 24px; border-radius: 8px; border: 1px solid #334155; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #e2e8f0; font-size: 13px;">This OTP will expire in <strong>10 minutes</strong>.</p>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
        If you did not request a password reset, please ignore this email. Your account remains secure.
      </p>
      <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
        Regards,<br>
        <strong>StockSense Team</strong>
      </p>
    </div>
  `;

  if (!transporter) {
    console.warn('[Email Warning] GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env.');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Development Simulation] OTP for ${toEmail}: ${otp}`);
    }
    return true; // Don't crash in local dev
  }

  try {
    const info = await transporter.sendMail({
      from: `"StockSense Support" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
    console.log(`[Email Service] OTP successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${toEmail}: ${error.message}`);
    if (error.code === 'EAUTH') {
      console.error('[Email Hint] Gmail authentication failed. Ensure you are using a 16-character Google App Password (not your Gmail account password) and 2-Step Verification is active.');
    }
    // In development mode, provide OTP in terminal so local testing is never blocked
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🔑 [Development OTP Code] --> ${otp} <-- (Use this to verify on your frontend screen!)\n`);
    }
    return false;
  }
}
