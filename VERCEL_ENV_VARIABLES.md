# Vercel Environment Variables - Copy & Paste Ready

Copy these environment variables into Vercel Dashboard → Your Backend Project → Settings → Environment Variables

## Required Environment Variables

```
DATABASE_URL=postgres://994964e38fb5be67b97daf4c33c028e0f7aa9741237f328c48cdfd7ba7350d2e:sk_cSvEPIjpH4EH0mUcZmj5z@db.prisma.io:5432/postgres?sslmode=require

JWT_SECRET=406d9a247dbdf8c3b01fdc6c134d3c8b67c633fc90fc36dfca388ede2da24c54

JWT_EXPIRES_IN=24h

SESSION_SECRET=2a18ee1b1de5df9fb2979feacd1627eb2197a7205fc10ceb6c73b12a8fd10aad04a6c6ce684d3d8003ba0975efc869d36fdc5a3b7039f0d3bea4def085799fa6

PORT=5000

NODE_ENV=production

FRONTEND_URL=https://app.jabclubegy.com

UPLOAD_DIR=./uploads

MAX_FILE_SIZE=5242880

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_SECURE=false

SMTP_USER=your-email@gmail.com

SMTP_PASSWORD=your-gmail-app-password

BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Important Notes:

1. **BLOB_READ_WRITE_TOKEN**: Get this from Vercel Dashboard → Storage → Your Blob Store → `.env.local` tab
   - See `VERCEL_BLOB_SETUP.md` for detailed instructions
2. **SMTP_USER**: Replace `your-email@gmail.com` with your actual Gmail address

1. **SMTP_USER**: Replace `your-email@gmail.com` with your actual Gmail address
2. **SMTP_PASSWORD**: Replace `your-gmail-app-password` with your Gmail App Password
   - Generate at: https://myaccount.google.com/apppasswords
   - It's a 16-character password (no spaces)

## How to Add in Vercel:

1. Go to your backend project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. For each variable above:
   - Click **"Add"** or **"Add New"**
   - Paste the **Key** (left side)
   - Paste the **Value** (right side)
   - Select **"Production"** environment
   - Click **"Save"**
4. Repeat for all variables

## After Adding Variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. This will apply the new environment variables


