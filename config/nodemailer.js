import nodemailer from 'nodemailer';

/**
 * Helper to send email via SMTP transporter configured through env variables.
 * @param {Object} options - Email sending options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML body content
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('SMTP credentials (EMAIL_USER / EMAIL_PASS) are not configured. Skipping email send.');
    return { success: false, error: 'SMTP credentials not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587 or other ports
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Vidyarthi Classes" <${user}>`,
      to,
      subject,
      text,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};
