# Email Notification System Setup Guide

This guide explains how to configure email notifications for the JabClub application.

## Features

The notification system sends automated email notifications for:
1. **Member Signup** - Welcome email when a new member signs up
2. **Package Purchase Approval** - Confirmation when admin approves a payment
3. **Package Purchase Receipt** - Receipt email sent when payment is approved
4. **Class Booking** - Confirmation when a member books a class
5. **Package Expiry Warning** - Warning sent 7 days before package expiry (runs daily at 9 AM)
6. **Package Renewal Reminder** - Reminder sent 3 days before package expiry (runs daily at 10 AM)

## Configuration

### Email Configuration (SMTP)

Add the following environment variables to your `.env` file:

```env
# Email/SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server (Gmail, SendGrid, etc.)
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                  # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # Your SMTP username/email
SMTP_PASSWORD=your-app-password   # Your SMTP password or app-specific password
```

#### Gmail Setup (Using Your Regular Gmail Account):

**Yes, you can use your regular Gmail account!** Here's how:

1. **Enable 2-Factor Authentication** (Required):
   - Go to your Google Account: https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the setup process (you'll need your phone)

2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter a name like "JabClub App"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

3. **Use in your `.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com          # Your regular Gmail address
   SMTP_PASSWORD=abcdefghijklmnop           # The 16-character app password (remove spaces)
   ```

**Important Notes:**
- Use your **regular Gmail address** (e.g., `yourname@gmail.com`)
- Use the **App Password** (not your regular Gmail password)
- Remove any spaces from the App Password when pasting
- The App Password is 16 characters without spaces
- You can revoke App Passwords anytime from the same page

#### Other SMTP Providers:
- **SendGrid**: Use `smtp.sendgrid.net` as host, port 587
- **Mailgun**: Use `smtp.mailgun.org` as host, port 587
- **AWS SES**: Use your AWS SES SMTP endpoint
- **Resend**: Use `smtp.resend.com` as host, port 465

## Email Notification Behavior

### Graceful Degradation
- If email is not configured, email notifications are skipped (logged but don't fail)
- Notifications are sent asynchronously and don't block the main operation
- If notification fails, it's logged but doesn't affect the user operation

### Email Templates

All notifications include:
- **Email**: HTML formatted email with styling
- Professional design with brand colors
- Responsive layout for mobile and desktop

## Email Flow Documentation

### 1. Member Signup Email
**Trigger**: When a new member successfully signs up
**Recipient**: New member's email address
**Subject**: "Welcome to JabClub! 🥊"
**Content**: 
- Welcome message
- Account creation confirmation
- Next steps (browse classes, purchase packages, manage bookings)
- Link to the application

**Flow**:
```
User Signup → Account Created → Email Sent (async) → User Receives Welcome Email
```

### 2. Package Purchase Approval Email
**Trigger**: When admin approves a payment for a package
**Recipient**: Member's email address
**Subject**: "Package Approved: [Package Name] ✅"
**Content**:
- Package approval confirmation
- Package details (name, sessions, expiry date)
- Instructions to start booking classes

**Flow**:
```
Member Submits Payment → Admin Approves → Package Activated → Email Sent (async) → Member Receives Approval Email
```

### 3. Package Purchase Receipt Email
**Trigger**: When admin approves a payment (sent alongside approval email)
**Recipient**: Member's email address
**Subject**: "Receipt: [Package Name] - JabClub"
**Content**:
- Receipt number and date
- Package details (name, sessions, start date, expiry date)
- Payment summary (subtotal, VAT if applicable, total amount)
- Professional receipt format

**Flow**:
```
Admin Approves Payment → Receipt Email Sent (async) → Member Receives Receipt
```

### 4. Class Booking Confirmation Email
**Trigger**: When a member successfully books a class
**Recipient**: Member's email address
**Subject**: "Class Booking Confirmed: [Class Name] ✅"
**Content**:
- Booking confirmation
- Class details (name, date, time, location)
- Booked for (self or child name if applicable)
- Reminder to attend

**Flow**:
```
Member Books Class → Booking Created → Credit Deducted → Email Sent (async) → Member Receives Confirmation
```

### 5. Package Expiry Warning Email
**Trigger**: Scheduled job runs daily at 9 AM, checks for packages expiring within 7 days
**Recipient**: Member's email address
**Subject**: "⚠️ Package Expiring Soon: [Package Name]"
**Content**:
- Warning about upcoming expiry
- Package details (name, remaining sessions, expiry date)
- Reminder to use remaining sessions

**Flow**:
```
Daily Cron Job (9 AM) → Check Expiring Packages → Email Sent (async) → Member Receives Warning
```

### 6. Package Renewal Reminder Email
**Trigger**: Scheduled job runs daily at 10 AM, checks for packages expiring within 3 days
**Recipient**: Member's email address
**Subject**: "🔄 Renew Your Package: [Package Name]"
**Content**:
- Renewal reminder
- Package details (name, expiry date, days remaining)
- Link to purchase page for renewal

**Flow**:
```
Daily Cron Job (10 AM) → Check Packages Expiring Soon → Email Sent (async) → Member Receives Reminder
```

## Scheduled Jobs

The expiry warning system runs automatically:
- **Expiry Check**: Daily at midnight (00:00) - marks expired packages
- **Expiry Warning**: Daily at 9 AM (09:00) - sends warnings for packages expiring within 7 days
- **Renewal Reminder**: Daily at 10 AM (10:00) - sends reminders for packages expiring within 3 days

These jobs are initialized automatically when the server starts.

## Testing

### Test Email Configuration:
```bash
# The system will log if email sending fails
# Check your server logs after triggering a signup or booking
# Verify emails are received in the member's inbox
```

## Troubleshooting

### Email Not Sending:
1. Check SMTP credentials are correct
2. Verify SMTP port and security settings
3. Check firewall/network allows SMTP connections
4. For Gmail, ensure 2FA is enabled and use App Password
5. Check server logs for specific error messages
6. Verify `.env` file is in the backend root directory
7. Restart the server after changing environment variables

### Notifications Not Working:
- Check that environment variables are loaded correctly
- Verify `.env` file is in the backend root directory
- Restart the server after changing environment variables
- Check server logs for notification errors

## Production Considerations

1. **Email Service**: Use a production SMTP service (SendGrid, Mailgun, AWS SES, Resend) instead of Gmail for better deliverability
2. **Rate Limiting**: Consider implementing rate limiting for notifications
3. **Monitoring**: Set up monitoring/alerts for notification failures
4. **Logging**: Ensure notification logs are properly stored and monitored
5. **Email Templates**: Customize email templates to match your brand
6. **Unsubscribe**: Consider adding unsubscribe links for marketing emails (not required for transactional emails)
