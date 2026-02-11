/**
 * Email service for sending invitations and notifications
 * Supports multiple email providers (Resend, SendGrid, SMTP, or console logging)
 */

// Import Resend at the top - package is installed
import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log("[Email] sendEmail called with options:", { to: options.to, subject: options.subject });
    
    // Check if Resend API key is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== "your_resend_api_key_here") {
      console.log("[Email] Using Resend service");
      return await sendWithResend(options);
    } else {
      console.log("[Email] RESEND_API_KEY not configured or is placeholder");
    }

    // Check if SendGrid API key is configured
    if (process.env.SENDGRID_API_KEY) {
      return await sendWithSendGrid(options);
    }

    // Check if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      return await sendWithSMTP(options);
    }

    // Fallback: Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("\n=== EMAIL (Development Mode) ===");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("---\n");
      console.log(options.html);
      console.log("\n=== END EMAIL ===\n");
      return true;
    }

    console.warn("No email service configured. Email not sent.");
    return false;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function sendWithResend(options: EmailOptions): Promise<boolean> {
  try {
    console.log("[Email] Attempting to send email via Resend to:", options.to);
    
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "your_resend_api_key_here") {
      console.error("[Email] RESEND_API_KEY is not set or is placeholder");
      return false;
    }

    const client = new Resend(apiKey);

    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    console.log("[Email] Sending from:", from);

    const result = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("[Email] Resend response:", JSON.stringify(result, null, 2));
    
    // Resend SDK returns { data: {...}, error: null } on success
    // or { data: null, error: {...} } on failure
    if (result.error) {
      console.error("[Email] Resend API error:", result.error);
      console.error("[Email] Error message:", result.error.message);
      console.error("[Email] Error name:", result.error.name);
      return false;
    }

    if (result.data) {
      console.log("[Email] Email sent successfully via Resend. Email ID:", result.data.id);
      return true;
    }

    // Fallback - if neither data nor error, assume success if no error was thrown
    console.log("[Email] Email sent successfully via Resend (no error thrown)");
    return true;
  } catch (error: any) {
    console.error("[Email] Resend error:", error);
    console.error("[Email] Error message:", error?.message);
    console.error("[Email] Error details:", JSON.stringify(error, null, 2));
    return false;
  }
}

async function sendWithSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    // Dynamic import with error handling for missing package
    // Using Function to prevent Next.js from analyzing this import at build time
    const importSendGrid = new Function('specifier', 'return import(specifier)');
    
    let sgMail;
    try {
      sgMail = await importSendGrid("@sendgrid/mail");
    } catch (importError: any) {
      if (importError.code === "MODULE_NOT_FOUND" || importError.message?.includes("Cannot find module")) {
        console.warn("SendGrid package not installed. Install it with: npm install @sendgrid/mail");
        return false;
      }
      throw importError;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const from = process.env.SENDGRID_FROM_EMAIL || "noreply@example.com";

    await sgMail.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    return false;
  }
}

async function sendWithSMTP(options: EmailOptions): Promise<boolean> {
  try {
    // Dynamic import with error handling for missing package
    // Using Function to prevent Next.js from analyzing this import at build time
    const importNodemailer = new Function('specifier', 'return import(specifier)');
    
    let nodemailer;
    try {
      nodemailer = await importNodemailer("nodemailer");
    } catch (importError: any) {
      if (importError.code === "MODULE_NOT_FOUND" || importError.message?.includes("Cannot find module")) {
        console.warn("Nodemailer package not installed. Install it with: npm install nodemailer");
        return false;
      }
      throw importError;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    return true;
  } catch (error) {
    console.error("SMTP error:", error);
    return false;
  }
}

export function renderInvitationEmail(data: {
  employeeName: string;
  companyName: string;
  invitationLink: string;
  customMessage?: string;
  inviterName?: string;
}): { subject: string; html: string; text: string } {
  const defaultMessage = `You've been invited to join {{companyName}} on TimeTrack. Please click the link below to accept the invitation and set up your account.`;
  
  // Replace placeholder with actual company name
  let message = data.customMessage || defaultMessage;
  message = message.replace(/\{\{companyName\}\}/g, data.companyName);
  
  const inviterText = data.inviterName ? ` by ${data.inviterName}` : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">TimeTrack</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #111827; margin-top: 0;">Hello ${data.employeeName}!</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      ${message.replace(/\n/g, '<br>')}
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invitationLink}" 
         style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This invitation was sent${inviterText}. If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${data.invitationLink}" style="color: #667eea; word-break: break-all;">${data.invitationLink}</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hello ${data.employeeName}!

${message}

Accept your invitation: ${data.invitationLink}

This invitation was sent${inviterText}. If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  return {
    subject: `Invitation to join ${data.companyName} on TimeTrack`,
    html,
    text,
  };
}
