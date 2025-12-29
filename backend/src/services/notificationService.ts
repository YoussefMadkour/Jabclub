import nodemailer from 'nodemailer';

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

interface NotificationOptions {
  email?: string;
  name: string;
}

/**
 * Send email notification
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  try {
    // Skip if SMTP not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('⚠️  Email not configured. Skipping email notification.');
      return false;
    }

    const transporter = createEmailTransporter();
    
    await transporter.sendMail({
      from: `"JabClub" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      html,
    });

    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
};

/**
 * Send email notification (simplified interface)
 */
export const sendNotification = async (
  options: NotificationOptions,
  emailSubject: string,
  emailHtml: string
): Promise<{ emailSent: boolean }> => {
  const results = {
    emailSent: false,
  };

  // Send email if email provided
  if (options.email) {
    results.emailSent = await sendEmail(options.email, emailSubject, emailHtml);
  }

  return results;
};

/**
 * Notification templates
 */
export const NotificationTemplates = {
  /**
   * Signup success notification
   */
  signupSuccess: (name: string) => ({
    emailSubject: 'Welcome to JabClub! 🥊',
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to JabClub, ${name}!</h1>
        <p>Thank you for signing up! Your account has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and book classes</li>
          <li>Purchase session packages</li>
          <li>Manage your bookings and children's profiles</li>
        </ul>
        <p>We're excited to have you join our community!</p>
        <p>Best regards,<br>The JabClub Team</p>
      </div>
    `,
  }),

  /**
   * Package purchase approval notification
   */
  packagePurchaseApproved: (name: string, packageName: string, sessions: number, expiryDate: string) => ({
    emailSubject: `Package Approved: ${packageName} ✅`,
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Package Approved!</h1>
        <p>Hi ${name},</p>
        <p>Great news! Your payment for <strong>${packageName}</strong> has been approved.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Package:</strong> ${packageName}</p>
          <p><strong>Sessions:</strong> ${sessions}</p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
        </div>
        <p>You can now use your credits to book classes!</p>
        <p>Best regards,<br>The JabClub Team</p>
      </div>
    `,
  }),

  /**
   * Class booking confirmation notification
   */
  classBookingConfirmed: (
    name: string,
    className: string,
    date: string,
    time: string,
    location: string,
    bookedFor?: string
  ) => ({
    emailSubject: `Class Booking Confirmed: ${className} ✅`,
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Booking Confirmed!</h1>
        <p>Hi ${name},</p>
        <p>Your class booking has been confirmed.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Class:</strong> ${className}</p>
          ${bookedFor ? `<p><strong>Booked For:</strong> ${bookedFor}</p>` : ''}
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>The JabClub Team</p>
      </div>
    `,
  }),

  /**
   * Package expiry warning notification
   */
  packageExpiryWarning: (name: string, packageName: string, sessionsRemaining: number, expiryDate: string) => ({
    emailSubject: `⚠️ Package Expiring Soon: ${packageName}`,
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Package Expiring Soon</h1>
        <p>Hi ${name},</p>
        <p>This is a reminder that your package <strong>${packageName}</strong> will expire soon.</p>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Package:</strong> ${packageName}</p>
          <p><strong>Remaining Sessions:</strong> ${sessionsRemaining}</p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
        </div>
        <p>Don't let your sessions go to waste! Book your classes now.</p>
        <p>Best regards,<br>The JabClub Team</p>
      </div>
    `,
  }),

  /**
   * Package purchase receipt (with VAT)
   */
  packagePurchaseReceipt: (
    name: string,
    packageName: string,
    sessions: number,
    startDate: string,
    expiryDate: string,
    amount: number,
    vatAmount: number | null,
    vatIncluded: boolean,
    totalAmount: number,
    paymentId: number
  ) => ({
    emailSubject: `Receipt: ${packageName} - JabClub`,
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">JabClub</h1>
          <p style="color: #6b7280; margin: 5px 0;">Payment Receipt</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Receipt #:</strong> ${paymentId}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${name}</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #111827; margin-top: 0;">Package Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Package:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${packageName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Sessions:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${sessions}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Start Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Expiry Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${expiryDate}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #111827; margin-top: 0;">Payment Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">EGP ${amount.toFixed(2)}</td>
            </tr>
            ${vatIncluded && vatAmount ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">VAT (14%):</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">EGP ${vatAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 12px 0;"><strong>Total Amount:</strong></td>
              <td style="padding: 12px 0; text-align: right;"><strong>EGP ${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
          Thank you for your purchase!<br>
          This is an automated receipt. Please keep it for your records.
        </p>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
          Best regards,<br>The JabClub Team
        </p>
      </div>
    `,
  }),

  /**
   * Package renewal reminder
   */
  packageRenewalReminder: (name: string, packageName: string, expiryDate: string, daysRemaining: number) => ({
    emailSubject: `🔄 Renew Your Package: ${packageName}`,
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Renew Your Package</h1>
        <p>Hi ${name},</p>
        <p>Your package <strong>${packageName}</strong> will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.</p>
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p><strong>Package:</strong> ${packageName}</p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
        </div>
        <p>Renew now to continue enjoying our classes without interruption!</p>
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://jabclub.com'}/purchase" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Renew Package</a>
        </p>
        <p>Best regards,<br>The JabClub Team</p>
      </div>
    `,
  }),
};
