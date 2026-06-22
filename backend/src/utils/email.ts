interface ISendEmailOptions {
  email: string;
  subject: string;
  html: string;
}

/**
 * Dispatches verification links and reset links.
 * Logs email content to the console in development, preventing external dependency requirements.
 */
export const sendEmail = async (options: ISendEmailOptions): Promise<boolean> => {
  try {
    console.log('=== [EMAIL DISPATCHED] ===');
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body Snippet: ${options.html.substring(0, 150)}...`);
    console.log('==========================');
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
