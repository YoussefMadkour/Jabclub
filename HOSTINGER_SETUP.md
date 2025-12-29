# Hostinger VPS Setup Guide for JabClub

This guide is specifically tailored for deploying JabClub on Hostinger VPS.

## Prerequisites

- Hostinger VPS plan (recommended: VPS 2 or higher)
- Domain name configured in Hostinger
- SSH access credentials from Hostinger panel

## Step 1: Access Your Hostinger VPS

### Via Hostinger Panel

1. Log in to [Hostinger Panel](https://hpanel.hostinger.com)
2. Navigate to **VPS** section
3. Select your VPS
4. Click **SSH Access** or use the web-based terminal

### Via SSH Client

```bash
ssh root@your-vps-ip
# Enter password from Hostinger panel
```

## Step 2: Initial Server Configuration

### Update System

```bash
apt update && apt upgrade -y
```

### Set Hostname (Optional)

```bash
hostnamectl set-hostname jabclub
```

### Create Swap File (if needed)

```bash
# Check current swap
free -h

# Create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

## Step 3: Install Required Software

### Install Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version  # Should show v18.x.x
npm --version
```

### Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib

# Start and enable
systemctl start postgresql
systemctl enable postgresql

# Verify
systemctl status postgresql
```

### Install PM2

```bash
npm install -g pm2

# Verify
pm2 --version
```

### Install Nginx

```bash
apt install -y nginx

# Start and enable
systemctl start nginx
systemctl enable nginx

# Verify
systemctl status nginx
```

### Install Git

```bash
apt install -y git

# Verify
git --version
```

## Step 4: Configure Firewall

Hostinger VPS typically uses UFW (Uncomplicated Firewall):

```bash
# Check status
ufw status

# If not enabled, configure it
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Verify
ufw status verbose
```

## Step 5: Set Up PostgreSQL

### Create Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL prompt:

```sql
-- Create user
CREATE USER jabclub_user WITH PASSWORD 'YourStrongPassword123!';

-- Create database
CREATE DATABASE jabclub_production OWNER jabclub_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jabclub_production TO jabclub_user;

-- Exit
\q
```

### Secure PostgreSQL

```bash
# Edit pg_hba.conf
nano /etc/postgresql/14/main/pg_hba.conf

# Ensure local connections use md5:
# local   all             all                                     md5

# Restart PostgreSQL
systemctl restart postgresql
```

## Step 6: Set Up Application Directory

```bash
# Create directory
mkdir -p /var/www/jabclub
cd /var/www/jabclub

# Create uploads directory
mkdir -p uploads

# Set permissions
chmod 755 uploads
```

## Step 7: Deploy Application

### Option A: Clone from Git

```bash
cd /var/www/jabclub
git clone https://github.com/your-username/jabclub.git .
```

### Option B: Upload via SFTP

Use an SFTP client (FileZilla, WinSCP, or Cyberduck):

1. Connect to your VPS:
   - Host: your-vps-ip
   - Port: 22
   - Username: root
   - Password: from Hostinger panel

2. Upload project files to `/var/www/jabclub`

## Step 8: Configure Environment Variables

### Backend Environment

```bash
cd /var/www/jabclub/backend
cp .env.production.example .env
nano .env
```

Update with your values:

```env
DATABASE_URL="postgresql://jabclub_user:YourStrongPassword123!@localhost:5432/jabclub_production?schema=public"
JWT_SECRET="generate_this_with_command_below"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="production"
UPLOAD_DIR="/var/www/jabclub/uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="https://app.jabclub.com"
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Environment

```bash
cd /var/www/jabclub/frontend
cp .env.production.example .env.production.local
nano .env.production.local
```

Update:

```env
NEXT_PUBLIC_API_URL="https://app.jabclub.com/api"
```

## Step 9: Build and Deploy

```bash
cd /var/www/jabclub

# Install dependencies and build
cd backend
npm ci --production=false
npm run build

cd ../frontend
npm ci --production=false
npm run build

# Run database migrations
cd ../backend
npx prisma generate
npx prisma migrate deploy

# Seed initial data
npm run prod:seed
```

## Step 10: Configure Domain in Hostinger

### Add DNS Records

1. Go to Hostinger Panel → **Domains**
2. Select your domain (e.g., jabclub.com)
3. Click **DNS / Nameservers**
4. Add/Edit A record:
   - **Type:** A
   - **Name:** app (for app.jabclub.com) or @ (for jabclub.com)
   - **Points to:** Your VPS IP address
   - **TTL:** 3600

5. Wait for DNS propagation (usually 5-30 minutes)

### Verify DNS

```bash
nslookup app.jabclub.com
# Should return your VPS IP
```

## Step 11: Configure Nginx

### Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/jabclub
```

Paste the following configuration:

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
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
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

    # Uploads
    location /uploads {
        alias /var/www/jabclub/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
```

### Enable Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/jabclub /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

## Step 12: Install SSL Certificate

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d app.jabclub.com

# Follow prompts:
# 1. Enter email address
# 2. Agree to terms of service
# 3. Choose whether to share email (optional)
# 4. Certificate will be automatically installed

# Test auto-renewal
certbot renew --dry-run
```

## Step 13: Start Application with PM2

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

## Step 14: Set Proper Permissions

```bash
# Set ownership
chown -R www-data:www-data /var/www/jabclub

# Set permissions
chmod -R 755 /var/www/jabclub
chmod -R 775 /var/www/jabclub/uploads
```

## Step 15: Verify Deployment

### Check Services

```bash
# Check PM2
pm2 status

# Check Nginx
systemctl status nginx

# Check PostgreSQL
systemctl status postgresql
```

### Test Application

```bash
# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000

# Test via domain
curl https://app.jabclub.com
```

### Access Application

Open browser and navigate to: `https://app.jabclub.com`

Default admin credentials:
- Email: `admin@jabclub.com`
- Password: `Admin123!`

**⚠️ Change password immediately!**

## Step 16: Set Up Automated Backups

### Create Backup Script

```bash
mkdir -p /var/backups/jabclub
nano /usr/local/bin/backup-jabclub.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/jabclub"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -U jabclub_user -h localhost jabclub_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/jabclub uploads

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:

```bash
chmod +x /usr/local/bin/backup-jabclub.sh
```

### Schedule with Cron

```bash
crontab -e

# Add line (daily at 2 AM):
0 2 * * * /usr/local/bin/backup-jabclub.sh >> /var/log/jabclub-backup.log 2>&1
```

## Hostinger-Specific Tips

### 1. Resource Monitoring

Monitor your VPS resources in Hostinger panel:
- CPU usage
- RAM usage
- Disk space
- Bandwidth

### 2. Upgrade VPS if Needed

If you experience performance issues:
1. Go to Hostinger Panel → VPS
2. Click **Upgrade**
3. Select higher plan

### 3. Hostinger Support

For VPS-related issues:
- Live chat: Available 24/7
- Email: support@hostinger.com
- Knowledge base: https://support.hostinger.com

### 4. Backup in Hostinger Panel

Hostinger provides automatic backups:
- Weekly backups (retained for 7 days)
- Access via VPS panel → Backups

### 5. Monitoring Tools

Install monitoring tools:

```bash
apt install -y htop iotop nethogs

# Use:
htop        # System resources
iotop       # Disk I/O
nethogs     # Network usage
```

## Troubleshooting

### Can't Connect via SSH

1. Check VPS status in Hostinger panel
2. Verify IP address
3. Check firewall rules
4. Try web-based terminal in Hostinger panel

### Domain Not Resolving

1. Verify DNS records in Hostinger panel
2. Wait for DNS propagation (up to 48 hours)
3. Clear DNS cache: `systemd-resolve --flush-caches`
4. Test with: `nslookup app.jabclub.com`

### Application Not Starting

1. Check PM2 logs: `pm2 logs`
2. Verify environment variables
3. Check disk space: `df -h`
4. Check memory: `free -h`

### SSL Certificate Issues

1. Verify domain is pointing to VPS
2. Check Nginx configuration: `nginx -t`
3. Try manual renewal: `certbot renew --force-renewal`

## Security Recommendations

1. **Change SSH Port** (optional but recommended):
```bash
nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
systemctl restart sshd
# Update firewall: ufw allow 2222/tcp
```

2. **Disable Root Login**:
```bash
# Create sudo user first
adduser jabclub
usermod -aG sudo jabclub

# Disable root login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

3. **Install Fail2Ban**:
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

4. **Regular Updates**:
```bash
# Set up automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## Next Steps

1. Change default admin password
2. Configure email notifications (if needed)
3. Set up monitoring and alerts
4. Test all features thoroughly
5. Train users on the system

## Support

- Application issues: Check logs with `pm2 logs`
- Server issues: Contact Hostinger support
- Deployment questions: Refer to DEPLOYMENT.md

---

**Deployment Date:** ___________  
**VPS IP:** ___________  
**Domain:** ___________  
**Admin Email:** ___________
