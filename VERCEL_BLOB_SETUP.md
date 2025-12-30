# Vercel Blob Storage Setup Guide

This guide explains how to set up Vercel Blob Storage for file uploads in your serverless backend.

## ✅ What's Already Done

1. ✅ Blob Store created: `jabclub-api-backend-blob`
2. ✅ Backend code updated to use Blob Storage
3. ✅ Package installed: `@vercel/blob`

## 🔑 Required: Add Blob Token to Environment Variables

You need to add the `BLOB_READ_WRITE_TOKEN` environment variable to your Vercel project.

### Step 1: Get Your Blob Token

1. Go to your Vercel Dashboard
2. Navigate to: **Storage** → **jabclub-api-backend-blob**
3. Click on the **`.env.local`** tab (next to `@vercel/blob` tab)
4. Copy the `BLOB_READ_WRITE_TOKEN` value

It should look something like:
```
vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Add to Vercel Environment Variables

1. Go to your backend project: **jabclub-api-backend**
2. Click **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Paste the token you copied
   - **Environment**: Select **Production** (and Preview/Development if needed)
   - Click **"Save"**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete

## 🎯 How It Works

### In Production (Vercel):
- Files are uploaded to Vercel Blob Storage
- Files are organized by year/month: `payments/2025/01/filename.jpg`
- Files are publicly accessible via blob URLs
- No local filesystem needed ✅

### In Local Development:
- Files are saved to `./uploads` directory
- Works exactly as before
- No changes needed for local testing

## 📝 Environment Variables Summary

Add this to your Vercel environment variables:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: The token is automatically available in Vercel serverless functions, but you need to add it explicitly for it to work.

## 🔍 Testing

After deployment, test file uploads:

1. Make a payment screenshot upload via the frontend
2. Check the payment record in your database
3. The `screenshotPath` should be a blob URL like:
   ```
   https://[your-blob-store].public.blob.vercel-storage.com/payments/2025/01/...
   ```

## 🚨 Troubleshooting

### Error: "Missing BLOB_READ_WRITE_TOKEN"
- Make sure you added the token to Vercel environment variables
- Redeploy after adding the variable

### Files not uploading
- Check Vercel deployment logs
- Verify the blob store is active in Storage dashboard
- Ensure token has read/write permissions

### Files uploaded but URLs not working
- Blob URLs are public by default
- Check if the blob store is in the correct region (Dubai/dxb1)
- Verify the URL format matches Vercel Blob URL pattern

## 📚 Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob Package](https://www.npmjs.com/package/@vercel/blob)

