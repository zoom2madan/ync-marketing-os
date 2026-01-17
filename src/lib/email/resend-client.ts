/**
 * Resend Email Client
 * Integrates with the Resend API for sending emails.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using the Resend API.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = options.from || "noreply@example.com";

  if (!apiKey) {
    console.error("RESEND_API_KEY environment variable is not set");
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const emailPayload: Record<string, string> = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Add reply_to if provided
    if (options.replyTo) {
      emailPayload.reply_to = options.replyTo;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return {
        success: false,
        error: data.message || "Failed to send email",
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send bulk emails (with rate limiting).
 */
export async function sendBulkEmails(
  emails: SendEmailOptions[],
  options?: { delayMs?: number }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const delayMs = options?.delayMs || 100; // Default 100ms delay between emails
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`Failed to send to ${email.to}: ${result.error}`);
    }

    // Rate limiting delay
    if (delayMs > 0 && emails.indexOf(email) < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { sent, failed, errors };
}

