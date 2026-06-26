import nodemailer from 'nodemailer';

interface ISendEmailOptions {
  email: string;
  subject: string;
  html: string;
}

/**
 * Dispatches verification links and reset links.
 * Uses SMTP (e.g., Hostinger, Mailtrap) if configured, or falls back to console-logging.
 */
export const sendEmail = async (options: ISendEmailOptions): Promise<boolean> => {
  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || 'noreply@thehelpingsociety.in';

    // Fallback to console logging if SMTP variables are not configured or set to placeholder/localhost defaults, or if in test mode
    if (process.env.NODE_ENV === 'test' || !host || host === 'localhost' || !user || user === 'placeholder' || !pass || pass === 'placeholder') {
      console.log('=== [EMAIL DISPATCHED (FALLBACK TO LOG)] ===');
      console.log(`To:      ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body Snippet: ${options.html.substring(0, 150)}...`);
      console.log('============================================');
      return true;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465 (SSL), false for other ports (like 587)
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'The Helping Society'}" <${from}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
