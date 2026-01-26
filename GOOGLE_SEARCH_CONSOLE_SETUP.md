# Google Search Console Setup Guide

This guide will help you verify your JabClub website (`app.jabclubegy.com`) in Google Search Console.

## Prerequisites

- Access to Google Search Console: https://search.google.com/search-console
- Access to your Vercel project environment variables

## Step 1: Add Property to Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"** or use the property selector
3. Select **"URL prefix"** property type
4. Enter your website URL: `https://app.jabclubegy.com`
5. Click **"Continue"**

## Step 2: Choose Verification Method

Google Search Console offers several verification methods. For Next.js apps on Vercel, we recommend the **HTML tag** method (already configured).

### Method 1: HTML Tag (Recommended - Already Configured)

1. On the verification page, select **"HTML tag"** method
2. Copy the `content` value from the meta tag shown:
   ```html
   <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" />
   ```
3. Add the verification code to your Vercel environment variables:
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name**: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
     - **Value**: `YOUR_VERIFICATION_CODE_HERE` (just the code, not the full tag)
     - **Environment**: Production (and Preview if desired)
   - Click **"Save"**
4. Redeploy your application (or wait for the next deployment)
5. Go back to Search Console and click **"Verify"**

### Method 2: HTML File Upload (Alternative)

If you prefer the HTML file method:

1. On the verification page, select **"HTML file"** method
2. Download the verification HTML file (e.g., `google1234567890.html`)
3. Upload it to your `frontend/public/` directory
4. Commit and push the file to GitHub
5. After deployment, go back to Search Console and click **"Verify"**

**Note**: The file will be accessible at `https://app.jabclubegy.com/google1234567890.html`

## Step 3: Verify Ownership

1. After adding the verification code/file, click **"Verify"** in Search Console
2. If successful, you'll see a confirmation message
3. You'll now have access to Search Console data for your site

## Step 4: Submit Sitemap (Optional but Recommended)

After verification:

1. In Search Console, go to **Sitemaps** in the left sidebar
2. Enter your sitemap URL: `https://app.jabclubegy.com/sitemap.xml`
3. Click **"Submit"**

**Note**: If you don't have a sitemap yet, you can create one using Next.js sitemap generation or a sitemap generator tool.

## Troubleshooting

### Verification Failed

- **Check the meta tag is present**: Visit `https://app.jabclubegy.com` and view page source (Ctrl+U or Cmd+U). Search for "google-site-verification" to confirm the tag is present.
- **Ensure environment variable is set**: Check Vercel dashboard that `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set correctly.
- **Wait for deployment**: After adding the environment variable, wait for Vercel to redeploy (or trigger a manual deployment).
- **Check for typos**: Ensure the verification code matches exactly what Search Console provided.

### Common Errors

- **"Meta tag not found"**: The environment variable may not be set or the deployment hasn't completed yet.
- **"Meta tag is incorrect"**: Double-check the verification code matches exactly.
- **"Connection timeout"**: Your site may be down or experiencing issues. Check Vercel deployment status.

## Verification Methods Comparison

| Method | Pros | Cons |
|--------|------|------|
| HTML Tag | ✅ Already configured<br>✅ Easy to update<br>✅ No file management | Requires environment variable |
| HTML File | ✅ Simple file upload<br>✅ No code changes needed | Requires file in repository |
| Domain Provider | ✅ Verifies entire domain<br>✅ Includes all subdomains | More complex setup |

## Current Configuration

The JabClub app is configured to support HTML tag verification via the `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` environment variable. The meta tag is automatically added to the homepage `<head>` section when this variable is set.

## Additional Resources

- [Google Search Console Help](https://support.google.com/webmasters/answer/9008080)
- [Next.js Metadata Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment variables in Vercel
3. Check Vercel deployment logs for any errors
4. Ensure the verification code matches exactly what Search Console provided
