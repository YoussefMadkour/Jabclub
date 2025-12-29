# JabClub Booking System - Deployment Guide

This guide provides step-by-step instructions for deploying the JabClub Booking System to Hostinger VPS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [SSL and Domain Setup](#ssl-and-domain-setup)
7. [Process Management](#process-management)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the deployment, ensure you have:

- Hostinger VPS account with root access
- Domain name (e.g., jabclub.com)
- SSH access to the server
- Git installed on your local machine
- Basic knowledge of Linux command line

### Required Software Versions

- Node.js: v18.x or higher
- PostgreSQL: v14.x or higher
- PM2: Latest version
- Nginx: Latest stable version

---

## Server Setup

### 1. Connect to Your Server

```bash
ssh root@your-server-ip
```

### 2. Update System Packages

```bash
apt update && apt upgrade -y
```

### 3. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install PostgreSQL

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Verify installation
systemctl status postgresql
```

### 5. Install PM2 Globally

```bash
npm install -g pm2

# Verify installation
pm2 --version
```

### 6. Install Nginx

```bash
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

### 7. Create Application Directory

```bash
# Create directory for the application
mkdir -p /var/www/jabclub
cd /var/www/jabclub

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

---

## Database Setup

### 1. Create PostgreSQL User and Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE USER jabclub_user WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE jabclub_production OWNER jabclub_user;
GRANT ALL PRIVILEGES ON DATABASE jabclub_production TO jabclub_user;

# Exit PostgreSQL
\q
```

### 2. Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit postgresql.conf
nano /etc/postgresql/14/main/postgresql.conf

# Find and modify:
listen_addresses = 'localhost'

# Edit pg_hba.conf
nano /etc/postgresql/14/main/pg_hba.conf

# Add line:
local   all             jabclub_user                            md5

# Restart PostgreSQL
systemctl restart postgresql
```

### 3. Test Database Connection

```bash
psql -U jabclub_user -d jabclub_production -h localhost
```

---

## Application Deployment

### 1. Clone Repository

```bash
cd /var/www/jabclub

# Clone your repository
git clone https://github.com/your-username/jabclub.git .

# Or upload files via SFTP/SCP
```

### 2. Configure Environment Variables

#### Backend Environment

```bash
cd /var/www/jabclub/backend
cp .env.production.example .env

# Edit .env file
nano .env
```

Update the following values in `.env`:

```env
DATABASE_URL="postgresql://jabclub_user:your_strong_password_here@localhost:5432/jabclub_production?schema=public"
JWT_SECRET="generate_random_32_char_string_here"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="production"
UPLOAD_DIR="/var/www/jabclub/uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="https://app.jabclub.com"
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend Environment

```bash
cd /var/www/jabclub/frontend
cp .env.production.example .env.production.local

# Edit .env.production.local
nano .env.production.local
```

Update:

```env
NEXT_PUBLIC_API_URL="https://app.jabclub.com/api"
```

### 3. Install Dependencies and Build

```bash
# Install backend dependencies
cd /var/www/jabclub/backend
npm ci --production=false

# Install frontend dependencies
cd /var/www/jabclub/frontend
npm ci --production=false
```

### 4. Run Database Migrations

```bash
cd /var/www/jabclub/backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run prod:seed
```

**Important:** The seed script creates a default admin user:
- Email: `admin@jabclub.com`
- Password: `Admin123!`

**Change this password immediately after first login!**

### 5. Build Applications

```bash
# Build backend
cd /var/www/jabclub/backend
npm run build

# Build frontend
cd /var/www/jabclub/frontend
npm run build
```

### 6. Set Proper Permissions

```bash
cd /var/www/jabclub

# Set ownership
chown -R www-data:www-data /var/www/jabclub

# Set permissions
chmod -R 755 /var/www/jabclub
chmod -R 775 /var/www/jabclub/uploads
```

---

## Environment Configuration

### Production Environment Variables

#### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Generated random string |
| `JWT_EXPIRES_IN` | Token expiration time | `24h` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `UPLOAD_DIR` | Directory for file uploads | `/var/www/jabclub/uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.jabclub.com` |

#### Frontend (.env.production.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://app.jabclub.com/api` |

---

## SSL and Domain Setup

### 1. Configure Nginx

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/jabclub
```

Add the following configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.jabclub.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.jabclub.com;

    # SSL Configuration (will be added by Certbot)
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
        
        # Increase timeout for file uploads
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

    # Client max body size for file uploads
    client_max_body_size 10M;
}
```

Enable the site:

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/jabclub /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 2. Install SSL Certificate with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d app.jabclub.com

# Follow the prompts and select:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test auto-renewal
certbot renew --dry-run
```

### 3. Configure DNS

In your domain registrar (or Hostinger DNS panel):

1. Add an A record:
   - **Type:** A
   - **Name:** app (or your subdomain)
   - **Value:** Your server IP address
   - **TTL:** 3600

2. Wait for DNS propagation (can take up to 48 hours, usually much faster)

3. Verify DNS:
```bash
nslookup app.jabclub.com
```

---

## Process Management

### Starting the Application with PM2

```bash
cd /var/www/jabclub

# Start both frontend and backend
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command that PM2 outputs
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# View logs for specific app
pm2 logs jabclub-backend
pm2 logs jabclub-frontend

# Monitor resources
pm2 monit

# Restart applications
pm2 restart ecosystem.config.js

# Stop applications
pm2 stop ecosystem.config.js

# Delete processes
pm2 delete ecosystem.config.js

# View detailed info
pm2 info jabclub-backend
```

### Log Management

Logs are stored in:
- Backend: `/var/www/jabclub/backend/logs/`
- Frontend: `/var/www/jabclub/frontend/logs/`

Rotate logs to prevent disk space issues:

```bash
# Install logrotate configuration
nano /etc/logrotate.d/jabclub
```

Add:

```
/var/www/jabclub/*/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## Maintenance

### Updating the Application

```bash
cd /var/www/jabclub

# Pull latest changes
git pull origin main

# Backend updates
cd backend
npm ci --production=false
npm run build
npx prisma migrate deploy

# Frontend updates
cd ../frontend
npm ci --production=false
npm run build

# Restart applications
cd ..
pm2 restart ecosystem.config.js
```

### Database Backup

Create a backup script:

```bash
nano /usr/local/bin/backup-jabclub-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/jabclub"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U jabclub_user -h localhost jabclub_production | gzip > $BACKUP_DIR/jabclub_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "jabclub_*.sql.gz" -mtime +7 -delete

echo "Backup completed: jabclub_$DATE.sql.gz"
```

Make executable and schedule:

```bash
chmod +x /usr/local/bin/backup-jabclub-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-jabclub-db.sh
```

### Database Restore

```bash
# Restore from backup
gunzip < /var/backups/jabclub/jabclub_YYYYMMDD_HHMMSS.sql.gz | psql -U jabclub_user -h localhost jabclub_production
```

### Monitoring

Set up basic monitoring:

```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Monitor system resources
htop

# Monitor disk usage
df -h

# Monitor application logs
pm2 logs

# Check Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Application Won't Start

1. Check PM2 logs:
```bash
pm2 logs
```

2. Check environment variables:
```bash
cd /var/www/jabclub/backend
cat .env
```

3. Verify database connection:
```bash
psql -U jabclub_user -d jabclub_production -h localhost
```

4. Check port availability:
```bash
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
```

### Database Connection Issues

1. Verify PostgreSQL is running:
```bash
systemctl status postgresql
```

2. Check database credentials in `.env`

3. Test connection:
```bash
psql -U jabclub_user -d jabclub_production -h localhost
```

4. Check PostgreSQL logs:
```bash
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Issues

1. Test configuration:
```bash
nginx -t
```

2. Check Nginx logs:
```bash
tail -f /var/log/nginx/error.log
```

3. Verify Nginx is running:
```bash
systemctl status nginx
```

4. Restart Nginx:
```bash
systemctl restart nginx
```

### SSL Certificate Issues

1. Check certificate status:
```bash
certbot certificates
```

2. Renew certificate manually:
```bash
certbot renew
```

3. Check Nginx SSL configuration:
```bash
nano /etc/nginx/sites-available/jabclub
```

### File Upload Issues

1. Check upload directory permissions:
```bash
ls -la /var/www/jabclub/uploads
```

2. Verify Nginx client_max_body_size

3. Check backend logs for upload errors

### Performance Issues

1. Monitor resources:
```bash
pm2 monit
htop
```

2. Check database performance:
```bash
sudo -u postgres psql jabclub_production
\timing on
-- Run slow queries
```

3. Optimize PM2 instances:
```bash
# Edit ecosystem.config.js to adjust instances
pm2 restart ecosystem.config.js
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `EADDRINUSE` | Port already in use. Stop conflicting process or change port |
| `ECONNREFUSED` | Database not running or wrong credentials |
| `502 Bad Gateway` | Backend not running. Check PM2 status |
| `413 Request Entity Too Large` | Increase `client_max_body_size` in Nginx |
| `JWT malformed` | Check JWT_SECRET in environment variables |

---

## Quick Deployment Script

For convenience, use the provided deployment script:

```bash
cd /var/www/jabclub
./deploy.sh
```

This script will:
1. Install dependencies
2. Build applications
3. Run database migrations
4. Start/restart PM2 processes

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Use strong database password
- [ ] Enable firewall (UFW)
- [ ] Keep system packages updated
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] SSL certificate auto-renewal configured
- [ ] Restrict SSH access (key-based authentication)
- [ ] Configure fail2ban for brute force protection

---

## Support

For issues or questions:
- Check application logs: `pm2 logs`
- Check Nginx logs: `/var/log/nginx/`
- Check PostgreSQL logs: `/var/log/postgresql/`
- Review this documentation

---

**Last Updated:** November 2025
