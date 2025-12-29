# Quick Guide: Deploy JabClub to Subdomain on Hostinger

This is a streamlined guide for deploying JabClub to a subdomain (e.g., `app.jabclub.com`) on Hostinger VPS.

## Prerequisites

- Hostinger VPS with root access
- Domain name configured in Hostinger
- SSH access to your VPS

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# Enter password from Hostinger panel
```

## Step 2: Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install Git
apt install -y git
```

## Step 3: Configure Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

## Step 4: Set Up Database

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE USER jabclub_user WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE jabclub_production OWNER jabclub_user;
GRANT ALL PRIVILEGES ON DATABASE jabclub_production TO jabclub_user;
\q
```

## Step 5: Create Application Directory

```bash
mkdir -p /var/www/jabclub/uploads
cd /var/www/jabclub
```

## Step 6: Deploy Application Code

### Option A: Clone from Git
```bash
git clone https://github.com/your-username/jabclub.git .
```

### Option B: Upload via SFTP
Use FileZilla, WinSCP, or Hostinger File Manager to upload files to `/var/www/jabclub`

## Step 7: Configure Environment Variables

### Backend (.env)
```bash
cd /var/www/jabclub/backend
nano .env
```

Add/update:
```env
DATABASE_URL="postgresql://jabclub_user:YourStrongPassword123!@localhost:5432/jabclub_production?schema=public"
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="production"
UPLOAD_DIR="/var/www/jabclub/uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="https://app.jabclub.com"

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# WhatsApp Configuration (for notifications)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Frontend (.env.production.local)
```bash
cd /var/www/jabclub/frontend
nano .env.production.local
```

Add:
```env
NEXT_PUBLIC_API_URL="https://app.jabclub.com/api"
```

## Step 8: Build and Deploy

```bash
cd /var/www/jabclub

# Install dependencies
cd backend && npm ci --production=false && cd ..
cd frontend && npm ci --production=false && cd ..

# Build applications
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Run database migrations
cd backend
npx prisma generate
npx prisma migrate deploy
npm run prod:seed  # Creates default admin user
cd ..
```

## Step 9: Configure DNS in Hostinger

1. Go to **Hostinger Panel** → **Domains** → Select your domain
2. Click **DNS / Nameservers**
3. Add A record:
   - **Type:** A
   - **Name:** `app` (for app.jabclub.com)
   - **Points to:** Your VPS IP address
   - **TTL:** 3600
4. Wait 5-30 minutes for DNS propagation

Verify DNS:
```bash
nslookup app.jabclub.com
```

## Step 10: Configure Nginx

```bash
nano /etc/nginx/sites-available/jabclub
```

Paste this configuration (replace `app.jabclub.com` with your subdomain):

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.jabclub.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.jabclub.com;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/app.jabclub.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/app.jabclub.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Uploads directory
    location /uploads {
        alias /var/www/jabclub/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/jabclub /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site
nginx -t  # Test configuration
systemctl reload nginx
```

## Step 11: Install SSL Certificate

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d app.jabclub.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Test auto-renewal
certbot renew --dry-run
```

## Step 12: Start Application with PM2

```bash
cd /var/www/jabclub

# Start applications
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Enable PM2 startup on boot
pm2 startup systemd
# Copy and run the command that PM2 outputs

# Verify
pm2 status
```

## Step 13: Set Permissions

```bash
chown -R www-data:www-data /var/www/jabclub
chmod -R 755 /var/www/jabclub
chmod -R 775 /var/www/jabclub/uploads
```

## Step 14: Verify Deployment

```bash
# Check services
pm2 status
systemctl status nginx
systemctl status postgresql

# Test locally
curl http://localhost:5000/api/health
curl http://localhost:3000

# Test via domain
curl https://app.jabclub.com
```

## Step 15: Access Your Application

Open browser: `https://app.jabclub.com`

**Default Admin Credentials:**
- Email: `admin@jabclub.com`
- Password: `Admin123!`

⚠️ **Change password immediately after first login!**

## Quick Commands Reference

```bash
# View application logs
pm2 logs

# Restart applications
pm2 restart ecosystem.config.js

# Stop applications
pm2 stop ecosystem.config.js

# Monitor resources
pm2 monit

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Update application
cd /var/www/jabclub
git pull
cd backend && npm ci && npm run build && npx prisma migrate deploy && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 restart ecosystem.config.js
```

## Troubleshooting

### Application Not Starting
```bash
pm2 logs  # Check logs
cd /var/www/jabclub/backend && cat .env  # Verify environment variables
```

### Database Connection Issues
```bash
systemctl status postgresql
psql -U jabclub_user -d jabclub_production -h localhost
```

### Nginx Issues
```bash
nginx -t  # Test configuration
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
certbot certificates  # Check certificate status
certbot renew --force-renewal  # Force renewal
```

### Port Already in Use
```bash
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
# Kill process if needed: kill -9 <PID>
```

## Notification System Setup

After deployment, configure notifications:

1. **Email (Gmail Example):**
   - Enable 2FA on Gmail
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Add to backend `.env`:
     ```env
     SMTP_USER=your-email@gmail.com
     SMTP_PASSWORD=your-app-password
     ```

2. **WhatsApp (Twilio):**
   - Sign up: https://www.twilio.com
   - Get Account SID and Auth Token
   - Add to backend `.env`:
     ```env
     TWILIO_ACCOUNT_SID=your-sid
     TWILIO_AUTH_TOKEN=your-token
     ```
   - For testing, use Twilio Sandbox: `whatsapp:+14155238886`

See `NOTIFICATION_SETUP.md` for detailed configuration.

## Security Checklist

- [ ] Changed default admin password
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Strong database password
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] PM2 auto-start configured
- [ ] Regular backups scheduled
- [ ] Email/WhatsApp notifications configured

## Next Steps

1. Change admin password
2. Configure email/WhatsApp notifications
3. Test all features
4. Set up automated backups (see `DEPLOYMENT.md`)
5. Monitor application logs

---

**Need Help?**
- Check logs: `pm2 logs`
- Review full guide: `DEPLOYMENT.md` or `HOSTINGER_SETUP.md`
- Hostinger Support: https://support.hostinger.com

